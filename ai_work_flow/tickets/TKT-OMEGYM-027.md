# TKT-OMEGYM-027: Ocultar rutinas personales de los miembros al staff

## Metadata
- **Tipo**: Fix (seguridad / RLS)
- **Prioridad**: Alta
- **Estado**: Review
- **Módulo**: training-plans
- **Relacionado con**: `incremental/SPEC_001_member_shared_routines.md` (regla de negocio 5)
- **OpenSpec change**: `openspec/changes/hide-personal-routines-from-staff/`
- **Ticket Externo**: — (solicitud directa del dueño del proyecto)
- **Fecha apertura**: 2026-10-29
- **Fecha cierre**: —

## Descripción
El panel `/training-plans` (admin y entrenador) mostraba las rutinas personales (`kind='personal'`) creadas por los miembros, a pesar de que la regla 5 de SPEC_001 dice que nunca deben aparecer en las vistas de staff.

**Causa raíz** (no era solo de UI): `training_plans_select` y `plan_exercises_select` otorgaban `is_trainer_or_admin()` **sin mirar `kind`**, así que el staff podía leer —y modificar— cualquier rutina personal, incluso por API directa con su JWT.

Alcance confirmado con el dueño del proyecto:
- Ocultar a **admin y entrenador** (no solo admin).
- El staff sigue viendo **todos los planes `kind='trainer'`** (de cualquier autor).
- Enforcement en **RLS + frontend** (no solo frontend).

## Dependencias
- **Bloqueado por**: TKT-OMEGYM-019 (creación de `kind` y rutinas personales)
- **Bloquea a**: —

## Archivos Afectados
- `supabase/migrations/20261029000001_staff_scope_training_plans.sql` (nueva)
- `src/services/training.service.ts` (`getAll` filtra `kind='trainer'`; `duplicate` fija `kind`)
- `src/pages/dashboard/TrainingPlans.tsx` (texto del hero)
- `ai_work_flow/docs/specs/incremental/SPEC_001_member_shared_routines.md`
- `data/supabase/DATABASE_CONFIG.yaml`
- `ai_work_flow/knowledge/local/09_staff_plan_scope_decisions.md`

## Estimación
2–3 horas (migración + verificación DEV/PROD).

## Implementación
- [x] Diseño / esquema definido
- [x] Código implementado (servicio + UI)
- [x] Migración RLS escrita
- [x] Migración aplicada en DEV (vía Management API + historial registrado)
- [ ] Migración aplicada en PROD (Management API + `NOTIFY pgrst, 'reload schema'`)
- [x] Verificación RLS en DEV (simulación de JWT real vía `set local role authenticated`)
- [ ] Prueba manual de UI ejecutada por el dueño del proyecto

## Criterios de Aceptación
- [ ] `/training-plans` como admin lista solo `kind='trainer'` (conteo == `select count(*) from training_plans where kind='trainer'`).
- [ ] `/training-plans` como entrenador: mismo resultado.
- [ ] Buscar por nombre una rutina personal conocida → no aparece en la lista.
- [ ] `GET /rest/v1/training_plans?select=id,kind&kind=eq.personal` con JWT de **admin** → `[]`.
- [ ] `GET /rest/v1/plan_exercises?plan_id=eq.<rutina personal>` con JWT de **admin** → `[]`.
- [ ] Como miembro dueño: `/my-routines` (crear, editar, eliminar, compartir/revocar código) y `/my-plan` funcionan igual que antes.
- [ ] Regresión staff: crear plan, editar ejercicios, duplicar, asignar a 2 miembros, quitar asignación → OK.
- [ ] `/members/:id` sigue mostrando el plan asignado del miembro.
- [ ] `npm run build` sin errores.

## Verificación SQL (DEV)
```sql
-- Total que debe ver el staff
SELECT count(*) FROM public.training_plans WHERE kind = 'trainer';
-- Rutinas personales existentes (no deben ser legibles por staff)
SELECT count(*) FROM public.training_plans WHERE kind = 'personal';

-- Políticas vigentes
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('training_plans', 'plan_exercises')
ORDER BY tablename, policyname;
```

## Evidencia de Cierre
**Fecha**: 2026-10-29  
**Probado por**: Dev asistido por IA — verificación de RLS en DEV (proyecto `jaltwjcipyrnmvjkdqdp`) simulando el JWT del rol `authenticated` (`set_config('request.jwt.claims')` + `set local role authenticated`)  
**Resultado**:

| Verificación (DEV) | Antes | Después |
|---|---|---|
| `training_plans` visibles como **admin** | 9 trainer + 1 personal | **9 trainer, 0 personal** |
| `training_plans` visibles como **miembro dueño** | 9 trainer + 1 personal | **1 personal (sin cambios)** |
| `plan_exercises` de una rutina personal como **admin** | 1 | **0** |
| `plan_exercises` de su rutina como **miembro dueño** | 1 | **1** |
| `UPDATE`/`DELETE` de rutina personal como **admin** (plan desechable) | permitido | **0 filas afectadas**, fila intacta |
| `UPDATE` de ejercicios de rutina personal como **admin** | permitido | **0 filas afectadas** |

**Regresión staff (como `authenticated` admin, datos desechables `ZZ_TEST_*`, eliminados al final)**: crear plan `kind='trainer'` ✅, insertar ejercicio ✅, actualizar ejercicio ✅, borrar plan ✅, sin residuos (`count = 0`).

- Políticas verificadas en `pg_policies` (`training_plans`, `plan_exercises`): staff con `AND kind='trainer'`; políticas `members_personal_*` sin cambios.
- Historial `supabase_migrations.schema_migrations` con la entrada `20261029000001` (equivalente a `supabase migration repair --status applied`).
- `npm run build` OK (tsc + vite, 135 módulos).
- **Pendiente**: aplicar en PROD (el token de Management API disponible solo expone el proyecto DEV) y validación manual de UI por el dueño.

**Commit**: `fix(training-plans): ocultar rutinas personales al staff por RLS (#TKT-OMEGYM-027)`
