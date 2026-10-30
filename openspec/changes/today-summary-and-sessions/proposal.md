# Proposal

## Why

La pestaña `Inicio` mostraba lo mismo que `Entrenamiento`: una lista de planes y ejercicios. No respondía a la pregunta que el miembro se hace al abrir la app —"¿qué toca hoy?"— y no existía ninguna forma de programar rutinas por día desde que se eliminó el reparto por ejercicio (TKT-029).

Tampoco se registraba nada al entrenar: `WorkoutSession` era solo UI, así que no había historial, racha ni volumen real.

## What Changes

- **Programación a nivel de plan**: nueva columna `training_plans.scheduled_days SMALLINT[]` (0=lun … 6=dom) con `CHECK` y índice GIN. El miembro programa sus rutinas desde Entrenamiento; el staff programa los planes desde el detalle de Planes. `plan_exercises.day` sigue legacy (los días no vuelven por ejercicio).
- **`Inicio` = Resumen de Hoy** (`/my-plan`):
  - Con rutina programada: hero con nombre, ejercicios, series y volumen planeado; CTA `Empezar rutina` y `Ver rutina`.
  - Sin rutina: estado de descanso + racha, visitas de la semana y volumen (real o planeado).
  - Selector "Otra rutina de hoy" cuando hay varias programadas.
  - La lista completa de ejercicios deja de vivir en Inicio; se consulta temporalmente en un sheet y permanentemente en Entrenamiento.
- **Sesiones persistentes**: nuevas tablas `workout_sessions` y `workout_sets`. `WorkoutSession` registra peso y reps por serie (prellenados desde `set_details`) y guarda al finalizar. Una sesión cerrada sin finalizar no se guarda.
- **Estadísticas**: racha de días consecutivos con sesión, visitas de la semana (`check_ins`) y volumen semanal (`Σ peso × reps` de series completadas), con el volumen planeado como respaldo.
- **Privacidad**: RLS de sesiones solo para el miembro dueño; el staff no accede a los registros.
- **Sin cambios**: `Entrenamiento` sigue siendo la biblioteca; no cambia su contenido ni sus acciones (solo suma "Programar días").

## Capabilities

### New Capabilities

- `today-summary`: resumen de acción inmediata del miembro con la rutina programada para hoy y un estado de descanso con estadísticas.
- `workout-sessions`: registro de sesiones y series de entrenamiento, privado por miembro, y estadísticas derivadas.

### Modified Capabilities

<!-- `routine-builder` no cambia: el detalle por serie y la edición siguen igual. -->

## Impact

- **Base de datos**: migración `20261029000003_plan_schedule_and_sessions.sql` (columna, `CHECK`, GIN, dos tablas, índices y 8 políticas RLS).
- **Código**: `services/sessions.service.ts` (nuevo), `lib/dates.ts` (nuevo), `components/schedule/ScheduleSheet.tsx` (nuevo), `MyPlan` reescrito, `WorkoutSession` con registro, `MyRoutines` y `TrainingPlans` con programación, tipos y servicios de planes.
- **Entornos**: DEV aplicada y verificada; PROD pendiente (el token actual solo expone DEV).
- **Datos**: sin backfill. Los planes existentes quedan sin días programados hasta que se programen.
