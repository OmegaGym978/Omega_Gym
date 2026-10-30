# Proposal

## Why

El panel de planes (`/training-plans`) de admin y entrenador listaba las rutinas personales que los miembros crean en "Mis rutinas", incumpliendo la regla 5 de `SPEC_001` ("las rutinas personales nunca aparecen en las vistas de entrenador ni admin").

La causa no era cosmética: las políticas RLS `training_plans_select` y `plan_exercises_select` otorgaban acceso total al staff mediante `is_trainer_or_admin()` sin evaluar `kind`, de modo que las rutinas personales también eran legibles y modificables por API directa con el JWT del staff.

## What Changes

- **RLS de lectura**: el staff (`admin`/`trainer`) solo puede leer filas `kind = 'trainer'` en `training_plans` y en `plan_exercises`. Se conservan intactas las ramas de miembro (`created_by` propio, `assigned_to` legacy y `plan_assignments`).
- **RLS de escritura**: las políticas de `INSERT`/`UPDATE`/`DELETE` del staff en ambas tablas quedan limitadas a `kind = 'trainer'`; el staff sigue editando sus propias rutinas personales por las políticas `members_personal_*`.
- **Corrección de paso**: las políticas de escritura de `plan_exercises` comparaban `created_by = auth.uid()`, roto para cuentas vinculadas; pasan a traducir por `profiles.auth_user_id`.
- **Servicio**: `trainingService.getAll()` filtra `kind = 'trainer'` (defensa en profundidad) y `duplicate()` fija `kind = 'trainer'` en la copia.
- **UI**: el texto de cabecera del panel deja explícito que se gestionan planes de entrenamiento.
- **BREAKING** (solo para el rol staff vía API): las consultas a `training_plans`/`plan_exercises` con JWT de admin o entrenador dejan de devolver rutinas personales de miembros.
- **Sin cambios** en la experiencia del miembro: "Mis rutinas" y "Mi plan" siguen igual, incluidos compartir/importar por código y los toggles de visibilidad.
- **Sin cambios** en el flujo operativo del staff: crear, editar, duplicar, asignar y quitar asignaciones de planes `kind='trainer'` de cualquier autor.

## Capabilities

### New Capabilities

- `training-plans`: alcance de acceso a los planes de entrenamiento y sus ejercicios según rol y tipo de plan (`trainer` vs `personal`), incluyendo la garantía de que las rutinas personales de los miembros no son legibles ni modificables por el staff.

### Modified Capabilities

<!-- Ninguna: el proyecto todavía no tiene specs en openspec/specs/. La regla equivalente vivía solo en SPEC_001 (ai_work_flow/docs/specs/incremental/). -->

## Impact

- **Base de datos**: nueva migración `supabase/migrations/20261029000001_staff_scope_training_plans.sql` (recrea 6 políticas de `training_plans` y `plan_exercises`). Requiere recargar la caché de PostgREST.
- **Código**: `src/services/training.service.ts`, `src/pages/dashboard/TrainingPlans.tsx`.
- **Datos**: sin migración de datos; solo cambia la visibilidad.
- **Métricas**: los KPIs "Planes totales" y "Asignados" del panel admin dejan de contar rutinas personales (comportamiento esperado).
- **No afectado**: `plan_assignments` (las rutinas personales nunca se asignan), `/members/:id`, `services/routines.service.ts`, páginas del miembro.
- **Documentación del proyecto**: `ai_work_flow/tickets/TKT-OMEGYM-027.md`, `ai_work_flow/knowledge/local/09_staff_plan_scope_decisions.md`, `incremental/SPEC_001_member_shared_routines.md`, `data/supabase/DATABASE_CONFIG.yaml`.
- **Entornos**: aplicada y verificada en DEV (proyecto `jaltwjcipyrnmvjkdqdp`); pendiente en PROD (`xlawavqceyprraeyrmtm`).
