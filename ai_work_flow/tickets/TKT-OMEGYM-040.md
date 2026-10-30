# TKT-OMEGYM-040: Inicio como Resumen de Hoy y programación semanal

## Metadata
- **Tipo**: Feature (UI + datos)
- **Prioridad**: Alta
- **Estado**: Review
- **Módulo**: training-plans / app-shell
- **Relacionado con**: `openspec/changes/today-summary-and-sessions/`
- **OpenSpec change**: `today-summary-and-sessions` → capability `today-summary`
- **Ticket Externo**: — (solicitud directa del dueño del proyecto)
- **Fecha apertura**: 2026-10-29
- **Fecha cierre**: —

## Descripción
`Inicio` mostraba la lista plana del plan activo, igual que `Entrenamiento`. Se reescribe como **Resumen de Hoy**:

- Con rutina programada: hero con nombre, ejercicios, series y volumen planeado; `Empezar rutina` y `Ver rutina`.
- Sin rutina: estado de descanso con racha, visitas y volumen.
- Selector "Otra rutina de hoy" si hay varias programadas.

Como el reparto por ejercicio se eliminó en TKT-029, se añade programación **a nivel de plan** (`scheduled_days`), configurable por el miembro (rutinas propias) y por el staff (planes del entrenador).

## Dependencias
- **Bloqueado por**: TKT-OMEGYM-030 (Entrenamiento), TKT-OMEGYM-029 (builder sin días)
- **Bloquea a**: TKT-OMEGYM-041 (las estadísticas reales dependen de las sesiones)

## Archivos Afectados
- `supabase/migrations/20261029000003_plan_schedule_and_sessions.sql` (columna y CHECK)
- `src/lib/dates.ts` (nuevo)
- `src/components/schedule/ScheduleSheet.tsx` (nuevo)
- `src/pages/member/MyPlan.tsx` (reescrito)
- `src/pages/member/MyRoutines.tsx` (programar + etiqueta)
- `src/pages/dashboard/TrainingPlans.tsx` (programar + etiqueta)
- `src/services/training.service.ts`, `src/services/routines.service.ts`

## Implementación
- [x] `scheduled_days` en planes con validación y índice
- [x] `ScheduleSheet` y acciones en Entrenamiento y Planes
- [x] Inicio con hero, descanso, "Otra rutina de hoy" y estados vacíos
- [x] Etiqueta de días en tarjetas
- [x] Migración aplicada en DEV y registrada
- [ ] Migración aplicada en PROD
- [ ] Prueba manual de UI ejecutada

## Criterios de aceptación
- [ ] Un plan programado para hoy aparece en Inicio; si no, estado de descanso.
- [ ] El miembro programa rutinas propias y el staff planes asignados.
- [ ] `Ver rutina` muestra los ejercicios en hoja sin duplicar la biblioteca.
- [ ] "Otra rutina de hoy" cambia la rutina mostrada.
- [ ] Quitar los días oculta la rutina de Inicio.
- [ ] `npm run build` y `openspec validate` OK.

## Evidencia de Cierre
**Fecha**: 2026-10-29  
**Probado por**: Dev asistido por IA  
**Resultado**:
- Migración `20261029000003` aplicada en DEV: columna `scheduled_days` (ARRAY), CHECK y GIN; versión registrada en `schema_migrations`.
- Programación integrada en Entrenamiento y en el detalle de Planes; etiquetas de días en ambos listados.
- `MyPlan` reescrito como Resumen de Hoy.
- `npm run build` OK (150 módulos) y `openspec validate` OK.
- **Pendiente**: PROD y QA visual/funcional.

**Commit**: —
