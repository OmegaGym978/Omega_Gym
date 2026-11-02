-- Omega Gym — Idempotencia en la creación de membresías
-- =====================================================
-- Contexto: 20261030000001 agregó pg_advisory_xact_lock y eliminó la carrera
-- "validar y luego insertar" para membresías que no son Visita. Quedaron tres
-- huecos que este archivo cierra:
--
--   1. Visita: la validación "sin membresía activa" excluye ese tipo, así que
--      el lock no tiene nada que serializar. Dos envíos del mismo formulario
--      insertan dos filas idénticas.
--   2. Reintento tras respuesta perdida: si el INSERT commitea y el cliente no
--      recibe la respuesta, el reintento manual crea otra fila. El lock no
--      ayuda porque la primera transacción ya terminó.
--   3. Clientes sin candado síncrono en la UI: el estado de React no es un
--      candado atómico.
--
-- Solución:
--   - memberships.request_id UUID + índice único parcial (idempotencia exacta
--     por intento de envío).
--   - Ventana anti-duplicado de 60 s: si ya existe una fila idéntica del mismo
--     miembro (tipo, inicio y fin) creada hace menos de un minuto, se devuelve
--     esa fila en lugar de insertar otra. Cubre Visita y reintentos de
--     clientes que todavía no envían request_id.
--   - El chequeo de idempotencia va ANTES de la validación "ya tiene membresía
--     activa": un reintento debe recibir su membresía, no un error.
--
-- La firma anterior se elimina para que PostgREST no quede con dos candidatas
-- ambiguas. El cliente antiguo (6 argumentos) sigue funcionando porque
-- p_request_id tiene DEFAULT NULL.
--
-- Fecha: 2026-10-30 (TKT-OMEGYM-046 / fix duplicados de membresía)

-- === 1) Clave de idempotencia por intento de envío ===
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS request_id UUID;

COMMENT ON COLUMN memberships.request_id IS
  'Identificador del intento de creación enviado por el cliente. Evita duplicados cuando se reintenta una petición que ya se confirmó.';

CREATE UNIQUE INDEX IF NOT EXISTS uq_memberships_request_id
  ON memberships (request_id)
  WHERE request_id IS NOT NULL;

-- === 2) Recrear el RPC con la clave de idempotencia ===
DROP FUNCTION IF EXISTS create_membership_with_payment(UUID, UUID, DATE, DATE, TEXT, TEXT);

CREATE OR REPLACE FUNCTION create_membership_with_payment(
  p_member_id UUID,
  p_type_id UUID,
  p_start_date DATE,
  p_end_date DATE DEFAULT NULL,
  p_status TEXT DEFAULT 'active',
  p_payment_method TEXT DEFAULT NULL,
  p_request_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type_name TEXT;
  v_duration_days INT;
  v_price NUMERIC(10,2);
  v_end_date DATE;
  v_membership_id UUID;
  v_pay_method TEXT;
  v_pay_status TEXT;
  v_result JSON;
  v_existing_id UUID;
  v_inserted INT;
BEGIN
  -- === Serializa las llamadas concurrentes del mismo miembro ===
  PERFORM pg_advisory_xact_lock(hashtext(p_member_id::text));

  -- === VALIDACIÓN 1: Obtener datos del tipo de membresía ===
  SELECT name, duration_days, price
  INTO v_type_name, v_duration_days, v_price
  FROM membership_types
  WHERE id = p_type_id;

  IF v_type_name IS NULL THEN
    RAISE EXCEPTION 'El tipo de membresía seleccionado no existe o no está disponible.';
  END IF;

  -- === Calcular end_date antes de validar duplicados ===
  v_end_date := COALESCE(p_end_date, p_start_date + v_duration_days);

  -- === VALIDACIÓN 2: Idempotencia exacta por request_id ===
  -- Un reintento del mismo intento devuelve la fila que ya se creó.
  IF p_request_id IS NOT NULL THEN
    SELECT m.id INTO v_existing_id
    FROM memberships m
    WHERE m.request_id = p_request_id;

    IF v_existing_id IS NOT NULL THEN
      SELECT json_build_object(
        'id', m.id,
        'member_id', m.member_id,
        'type_id', m.type_id,
        'start_date', m.start_date,
        'end_date', m.end_date,
        'status', m.status,
        'created_at', m.created_at
      ) INTO v_result
      FROM memberships m
      WHERE m.id = v_existing_id;

      RETURN v_result;
    END IF;
  END IF;

  -- === VALIDACIÓN 3: Ventana anti-duplicado (60 s) ===
  -- Cubre Visita y reintentos de clientes que aún no envían request_id.
  SELECT m.id INTO v_existing_id
  FROM memberships m
  WHERE m.member_id = p_member_id
    AND m.type_id = p_type_id
    AND m.start_date = p_start_date
    AND m.end_date = v_end_date
    AND m.status <> 'cancelled'
    AND m.created_at > NOW() - INTERVAL '60 seconds'
  ORDER BY m.created_at DESC
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    SELECT json_build_object(
      'id', m.id,
      'member_id', m.member_id,
      'type_id', m.type_id,
      'start_date', m.start_date,
      'end_date', m.end_date,
      'status', m.status,
      'created_at', m.created_at
    ) INTO v_result
    FROM memberships m
    WHERE m.id = v_existing_id;

    RETURN v_result;
  END IF;

  -- === VALIDACIÓN 4: No duplicar membresías activas (excluye Visita) ===
  SELECT m.id INTO v_existing_id
  FROM memberships m
  JOIN membership_types mt ON m.type_id = mt.id
  WHERE m.member_id = p_member_id
    AND m.status = 'active'
    AND mt.name != 'Visita'
    AND m.end_date >= p_start_date
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RAISE EXCEPTION 'El miembro ya tiene una membresía activa. Cancela la actual antes de asignar una nueva.';
  END IF;

  -- === VALIDACIÓN 5: Visita no permite pago pendiente ===
  IF v_type_name = 'Visita' AND p_payment_method = 'pending' THEN
    RAISE EXCEPTION 'Las membresías Visita no pueden tener pago pendiente. Selecciona un método de pago.';
  END IF;

  -- === Insertar membresía ===
  -- ON CONFLICT protege el caso en que otra transacción ganó con el mismo
  -- request_id entre la validación y este INSERT.
  INSERT INTO memberships (member_id, type_id, start_date, end_date, status, request_id)
  VALUES (p_member_id, p_type_id, p_start_date, v_end_date, p_status, p_request_id)
  ON CONFLICT (request_id) WHERE request_id IS NOT NULL DO NOTHING
  RETURNING id INTO v_membership_id;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted = 0 THEN
    -- Otra transacción insertó con la misma request_id: devolver la suya.
    SELECT m.id INTO v_membership_id
    FROM memberships m
    WHERE m.request_id = p_request_id;
  END IF;

  -- === Insertar pago solo si esta llamada creó la membresía ===
  IF v_inserted = 1 AND p_payment_method IS NOT NULL THEN
    v_pay_method := CASE WHEN p_payment_method = 'pending' THEN 'cash' ELSE p_payment_method END;
    v_pay_status := CASE WHEN p_payment_method = 'pending' THEN 'pending' ELSE 'paid' END;

    INSERT INTO payments (membership_id, amount, payment_date, method, status)
    VALUES (v_membership_id, v_price, p_start_date, v_pay_method, v_pay_status);
  END IF;

  -- === Devolver membresía creada ===
  SELECT json_build_object(
    'id', m.id,
    'member_id', m.member_id,
    'type_id', m.type_id,
    'start_date', m.start_date,
    'end_date', m.end_date,
    'status', m.status,
    'created_at', m.created_at
  ) INTO v_result
  FROM memberships m
  WHERE m.id = v_membership_id;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION create_membership_with_payment(UUID, UUID, DATE, DATE, TEXT, TEXT, UUID)
  TO anon, authenticated, service_role;
