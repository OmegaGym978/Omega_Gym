-- ============================================================
-- TKT-OMEGYM-037 / SPEC exercise-set-logging
-- Series detalladas (peso y reps por serie) en plan_exercises.
-- Sin cambios de RLS: la columna vive en una tabla ya protegida.
-- ============================================================

ALTER TABLE public.plan_exercises
  ADD COLUMN IF NOT EXISTS set_details JSONB;

COMMENT ON COLUMN public.plan_exercises.set_details IS
  'Series planificadas: [{"weight": number|null, "reps": number|null}]. NULL = rutina antigua (usar sets/reps).';

-- Solo se acepta un arreglo JSON (o NULL). Evita strings/objetos sueltos.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'plan_exercises_set_details_is_array'
  ) THEN
    ALTER TABLE public.plan_exercises
      ADD CONSTRAINT plan_exercises_set_details_is_array
      CHECK (set_details IS NULL OR jsonb_typeof(set_details) = 'array');
  END IF;
END $$;

-- ------------------------------------------------------------
-- Importar por código: la copia también debe llevar las series.
-- Se recrea la función con set_details en la lista de columnas.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.import_routine_by_code(p_code text)
RETURNS uuid
LANGUAGE plpgsql VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_profile_id uuid;
  v_norm text;
  v_source public.training_plans%ROWTYPE;
  v_new_id uuid;
BEGIN
  SELECT id INTO v_profile_id
  FROM public.profiles WHERE auth_user_id = auth.uid();

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Perfil no encontrado para el usuario actual';
  END IF;

  v_norm := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));

  SELECT * INTO v_source
  FROM public.training_plans
  WHERE share_code IS NOT NULL
    AND replace(share_code, '-', '') = v_norm
    AND kind = 'personal';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Código inválido o ya revocado';
  END IF;

  IF v_source.created_by = v_profile_id THEN
    RAISE EXCEPTION 'Esta rutina ya es tuya, no puedes importarla';
  END IF;

  INSERT INTO public.training_plans (name, description, kind, created_by)
  VALUES (v_source.name || ' (copia)', v_source.description, 'personal', v_profile_id)
  RETURNING id INTO v_new_id;

  INSERT INTO public.plan_exercises (
    plan_id, exercise_id, exercise_name, sets, reps,
    rest_seconds, day, notes, order_index, muscle, reference_link, set_details
  )
  SELECT
    v_new_id, pe.exercise_id, pe.exercise_name, pe.sets, pe.reps,
    pe.rest_seconds, pe.day, pe.notes, pe.order_index, pe.muscle, pe.reference_link, pe.set_details
  FROM public.plan_exercises pe
  WHERE pe.plan_id = v_source.id;

  RETURN v_new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.import_routine_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.import_routine_by_code(text) TO authenticated;
