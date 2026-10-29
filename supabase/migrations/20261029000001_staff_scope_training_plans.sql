-- ============================================================
-- Omega Gym — Alcance de visibilidad del staff sobre los planes
-- TKT-OMEGYM-027 · SPEC_001 (regla de negocio 5)
--
-- PROBLEMA
--   training_plans_select otorgaba `is_trainer_or_admin()` sin mirar
--   `kind`, por lo que admin y entrenador podían leer —y escribir—
--   las rutinas personales (kind='personal') de los miembros.
--   Lo mismo aplicaba a plan_exercises. La regla 5 de SPEC_001
--   ("las rutinas personales nunca aparecen en las vistas de
--   entrenador ni admin") quedaba sin enforce a nivel de BD.
--
-- SOLUCIÓN
--   El staff (admin/trainer) solo accede a filas kind='trainer'.
--   Los miembros conservan TODAS sus ramas previas:
--     * created_by propio      → sus rutinas personales
--     * assigned_to propio     → asignación legacy
--     * plan_assignments       → asignación many-to-many
--   Las políticas de miembros (members_personal_*) NO se tocan.
--
-- ROLLBACK (si se necesitara volver atrás)
--   Recrear las políticas tal como están en:
--     - 20260704000001_rls_plan_assignments.sql (SELECT)
--     - 20260525000004_security_definer_rls.sql (INSERT/UPDATE/DELETE)
-- ============================================================

-- ------------------------------------------------------------
-- 1. training_plans — SELECT
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "training_plans_select" ON public.training_plans;

CREATE POLICY "training_plans_select" ON public.training_plans FOR SELECT
  USING (
    created_by IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR assigned_to IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.plan_assignments pa
      WHERE pa.plan_id = training_plans.id
        AND pa.member_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    )
    OR (kind = 'trainer' AND public.is_trainer_or_admin())
  );

-- ------------------------------------------------------------
-- 2. training_plans — escritura del staff limitada a kind='trainer'
--    (el staff sigue pudiendo editar sus propias rutinas personales
--     vía las políticas members_personal_*, que son permisivas y se
--     combinan con OR)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "training_plans_insert" ON public.training_plans;
CREATE POLICY "training_plans_insert" ON public.training_plans FOR INSERT
  WITH CHECK (public.is_trainer_or_admin() AND kind = 'trainer');

DROP POLICY IF EXISTS "training_plans_update" ON public.training_plans;
CREATE POLICY "training_plans_update" ON public.training_plans FOR UPDATE
  USING (public.is_trainer_or_admin() AND kind = 'trainer')
  WITH CHECK (public.is_trainer_or_admin() AND kind = 'trainer');

DROP POLICY IF EXISTS "training_plans_delete" ON public.training_plans;
CREATE POLICY "training_plans_delete" ON public.training_plans FOR DELETE
  USING (public.is_trainer_or_admin() AND kind = 'trainer');

-- ------------------------------------------------------------
-- 3. plan_exercises — SELECT (mismo criterio que su plan)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "plan_exercises_select" ON public.plan_exercises;

CREATE POLICY "plan_exercises_select" ON public.plan_exercises FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.training_plans tp
    WHERE tp.id = plan_exercises.plan_id
      AND (
        tp.created_by IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
        OR tp.assigned_to IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.plan_assignments pa
          WHERE pa.plan_id = tp.id
            AND pa.member_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
        )
        OR (tp.kind = 'trainer' AND public.is_trainer_or_admin())
      )
  ));

-- ------------------------------------------------------------
-- 4. plan_exercises — escritura del staff limitada a kind='trainer'
--    (se traduce auth_user_id → profiles.id, que la versión previa
--     no hacía y rompía a los miembros vinculados)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "plan_exercises_insert" ON public.plan_exercises;
CREATE POLICY "plan_exercises_insert" ON public.plan_exercises FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.training_plans tp
    WHERE tp.id = plan_exercises.plan_id
      AND (
        tp.created_by IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
        OR (tp.kind = 'trainer' AND public.is_trainer_or_admin())
      )
  ));

DROP POLICY IF EXISTS "plan_exercises_update" ON public.plan_exercises;
CREATE POLICY "plan_exercises_update" ON public.plan_exercises FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.training_plans tp
    WHERE tp.id = plan_exercises.plan_id
      AND (
        tp.created_by IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
        OR (tp.kind = 'trainer' AND public.is_trainer_or_admin())
      )
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.training_plans tp
    WHERE tp.id = plan_exercises.plan_id
      AND (
        tp.created_by IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
        OR (tp.kind = 'trainer' AND public.is_trainer_or_admin())
      )
  ));

DROP POLICY IF EXISTS "plan_exercises_delete" ON public.plan_exercises;
CREATE POLICY "plan_exercises_delete" ON public.plan_exercises FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.training_plans tp
    WHERE tp.id = plan_exercises.plan_id
      AND (
        tp.created_by IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
        OR (tp.kind = 'trainer' AND public.is_trainer_or_admin())
      )
  ));
