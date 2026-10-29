-- ============================================================
-- TKT-OMEGYM-042 / TKT-OMEGYM-043
-- Ejercicios personales (created_by) y borrado seguro de ejercicios.
-- ============================================================

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_exercises_created_by ON public.exercises(created_by);

COMMENT ON COLUMN public.exercises.created_by IS
  'NULL = catálogo global; uuid = ejercicio personal visible solo para su dueño.';

-- ------------------------------------------------------------
-- RLS: catálogo global + ejercicios propios
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read exercises" ON public.exercises;
DROP POLICY IF EXISTS "exercises_select" ON public.exercises;

CREATE POLICY "exercises_select" ON public.exercises FOR SELECT
  USING (
    is_active AND (
      created_by IS NULL
      OR created_by IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "exercises_insert_own" ON public.exercises;
CREATE POLICY "exercises_insert_own" ON public.exercises FOR INSERT
  WITH CHECK (
    created_by IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "exercises_update_own" ON public.exercises;
CREATE POLICY "exercises_update_own" ON public.exercises FOR UPDATE
  USING (
    created_by IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    created_by IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "exercises_delete_own" ON public.exercises;
CREATE POLICY "exercises_delete_own" ON public.exercises FOR DELETE
  USING (
    created_by IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
  );

-- ------------------------------------------------------------
-- Borrado seguro: plan_exercises.exercise_id pasa a ON DELETE SET NULL
-- (antes no tenía acción y bloqueaba el borrado del ejercicio).
-- ------------------------------------------------------------
DO $$
DECLARE
  c text;
BEGIN
  SELECT conname INTO c
  FROM pg_constraint
  WHERE conrelid = 'public.plan_exercises'::regclass
    AND confrelid = 'public.exercises'::regclass
    AND contype = 'f';

  IF c IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.plan_exercises DROP CONSTRAINT %I', c);
  END IF;
END $$;

ALTER TABLE public.plan_exercises
  ADD CONSTRAINT plan_exercises_exercise_id_fkey
  FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE SET NULL;
