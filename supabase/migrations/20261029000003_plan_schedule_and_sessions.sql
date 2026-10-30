-- ============================================================
-- TKT-OMEGYM-040 / TKT-OMEGYM-041
-- 1) Programación semanal a nivel de plan (0 = lunes … 6 = domingo)
-- 2) Sesiones de entrenamiento y series realizadas (solo el miembro)
-- Sin cambios en plan_exercises.day (legacy).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Días programados por plan
-- ------------------------------------------------------------
ALTER TABLE public.training_plans
  ADD COLUMN IF NOT EXISTS scheduled_days SMALLINT[];

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'training_plans_scheduled_days_valid'
  ) THEN
    ALTER TABLE public.training_plans
      ADD CONSTRAINT training_plans_scheduled_days_valid
      CHECK (scheduled_days IS NULL OR scheduled_days <@ ARRAY[0,1,2,3,4,5,6]::smallint[]);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_training_plans_scheduled_days
  ON public.training_plans USING GIN (scheduled_days);

COMMENT ON COLUMN public.training_plans.scheduled_days IS
  'Días de la semana programados (0=lunes … 6=domingo). NULL o vacío = sin programar.';

-- ------------------------------------------------------------
-- 2. Sesiones de entrenamiento
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.training_plans(id) ON DELETE SET NULL,
  plan_name text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  total_sets integer NOT NULL DEFAULT 0,
  total_volume numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workout_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES public.exercises(id) ON DELETE SET NULL,
  exercise_name text NOT NULL,
  set_index integer NOT NULL,
  weight numeric(8,2),
  reps integer,
  completed boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_member
  ON public.workout_sessions (member_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_workout_sets_session
  ON public.workout_sets (session_id);

-- ------------------------------------------------------------
-- 3. RLS: solo el propio miembro (staff sin acceso)
-- ------------------------------------------------------------
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workout_sessions_own_select" ON public.workout_sessions;
CREATE POLICY "workout_sessions_own_select" ON public.workout_sessions
  FOR SELECT USING (
    member_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "workout_sessions_own_insert" ON public.workout_sessions;
CREATE POLICY "workout_sessions_own_insert" ON public.workout_sessions
  FOR INSERT WITH CHECK (
    member_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "workout_sessions_own_update" ON public.workout_sessions;
CREATE POLICY "workout_sessions_own_update" ON public.workout_sessions
  FOR UPDATE USING (
    member_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
  ) WITH CHECK (
    member_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "workout_sessions_own_delete" ON public.workout_sessions;
CREATE POLICY "workout_sessions_own_delete" ON public.workout_sessions
  FOR DELETE USING (
    member_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "workout_sets_own_select" ON public.workout_sets;
CREATE POLICY "workout_sets_own_select" ON public.workout_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = workout_sets.session_id
        AND ws.member_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "workout_sets_own_insert" ON public.workout_sets;
CREATE POLICY "workout_sets_own_insert" ON public.workout_sets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = workout_sets.session_id
        AND ws.member_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "workout_sets_own_update" ON public.workout_sets;
CREATE POLICY "workout_sets_own_update" ON public.workout_sets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = workout_sets.session_id
        AND ws.member_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = workout_sets.session_id
        AND ws.member_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "workout_sets_own_delete" ON public.workout_sets;
CREATE POLICY "workout_sets_own_delete" ON public.workout_sets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = workout_sets.session_id
        AND ws.member_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    )
  );
