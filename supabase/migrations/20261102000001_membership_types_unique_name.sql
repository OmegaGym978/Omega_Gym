-- Tipos de membresía duplicados («Semana» x2).
--
-- 1) Desactiva los duplicados activos conservando el más antiguo de cada nombre
--    normalizado (sin espacios al inicio/fin y sin distinguir mayúsculas).
-- 2) Crea un índice único parcial sobre los tipos activos, para que el
--    servidor rechace cualquier inserción duplicada (código 23505) aunque dos
--    peticiones lleguen en paralelo desde el cliente.

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY lower(trim(name))
      ORDER BY created_at NULLS FIRST, id
    ) AS rn
  FROM membership_types
  WHERE is_active
)
UPDATE membership_types mt
SET is_active = false
FROM ranked r
WHERE mt.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_membership_types_name_active
  ON membership_types (lower(trim(name)))
  WHERE is_active;
