-- ============================================================
-- TKT-OMEGYM-045
-- Notas fijadas por el miembro en un ejercicio (privadas).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.exercise_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exercise_notes_member_exercise
  ON public.exercise_notes (member_id, exercise_id, created_at DESC);

COMMENT ON TABLE public.exercise_notes IS
  'Notas personales del miembro sobre un ejercicio; privadas por RLS.';

ALTER TABLE public.exercise_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exercise_notes_own_select" ON public.exercise_notes;
CREATE POLICY "exercise_notes_own_select" ON public.exercise_notes FOR SELECT
  USING (
    member_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "exercise_notes_own_insert" ON public.exercise_notes;
CREATE POLICY "exercise_notes_own_insert" ON public.exercise_notes FOR INSERT
  WITH CHECK (
    member_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "exercise_notes_own_update" ON public.exercise_notes;
CREATE POLICY "exercise_notes_own_update" ON public.exercise_notes FOR UPDATE
  USING (
    member_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    member_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "exercise_notes_own_delete" ON public.exercise_notes;
CREATE POLICY "exercise_notes_own_delete" ON public.exercise_notes FOR DELETE
  USING (
    member_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
  );
