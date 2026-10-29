# TKT-OMEGYM-041: Sesiones de entrenamiento persistentes y estadísticas

## Metadata
- **Tipo**: Feature (datos + UI)
- **Prioridad**: Alta
- **Estado**: Review
- **Módulo**: workout-sessions
- **Relacionado con**: `openspec/changes/today-summary-and-sessions/`
- **OpenSpec change**: `today-summary-and-sessions` → capability `workout-sessions`
- **Ticket Externo**: — (solicitud directa del dueño del proyecto)
- **Fecha apertura**: 2026-10-29
- **Fecha cierre**: —

## Descripción
`WorkoutSession` solo marcaba series en memoria. Se añade registro real:

- Tablas `workout_sessions` y `workout_sets` con RLS **solo para el miembro dueño**.
- La sesión prellena peso/reps desde `set_details` y permite ajustarlos.
- Al finalizar se guarda encabezado + series completadas y se calcula el volumen.
- `Inicio` muestra racha, visitas de la semana (check-ins) y volumen real (o planeado como respaldo).

## Dependencias
- **Bloqueado por**: TKT-OMEGYM-037 (`set_details`), TKT-OMEGYM-040 (Inicio)
- **Bloquea a**: —

## Archivos Afectados
- `supabase/migrations/20261029000003_plan_schedule_and_sessions.sql` (tablas, índices y RLS)
- `src/services/sessions.service.ts` (nuevo)
- `src/components/workout/WorkoutSession.tsx` (reescrito)
- `src/pages/member/MyPlan.tsx` (estadísticas)
- `src/pages/member/MyRoutines.tsx` (props de sesión)

## Implementación
- [x] Tablas, índices y 8 políticas RLS
- [x] `sessionsService.saveSession` y `getWeeklyStats`
- [x] Sesión con peso/reps editables y validación
- [x] Guardado solo al finalizar; sin registro si se cierra
- [x] Racha, visitas y volumen en Inicio
- [x] Verificación de RLS con JWT simulado
- [ ] Prueba manual de UI ejecutada

## Criterios de aceptación
- [ ] Finalizar con series guarda sesión y series, y devuelve el volumen.
- [ ] Cerrar sin finalizar no deja registros.
- [ ] Un miembro no ve sesiones de otro; el staff tampoco.
- [ ] La racha cuenta días consecutivos con sesión.
- [ ] Las visitas salen de `check_ins` y el volumen de las series completadas.
- [ ] Sin sesiones, el volumen mostrado es el planeado y está etiquetado.
- [x] `npm run build` y `openspec validate` OK.

## Evidencia de Cierre
**Fecha**: 2026-10-29  
**Probado por**: Dev asistido por IA (JWT simulado vía Management API)  
**Resultado**:

| Verificación | Resultado |
|---|---|
| Tablas `workout_sessions` / `workout_sets` | ✅ creadas |
| Políticas RLS | ✅ 4 + 4 |
| RLS habilitada | ✅ en ambas |
| Miembro dueño lee su sesión | ✅ 1 fila |
| Otro miembro lee la sesión | ✅ 0 filas |
| Admin lee la sesión | ✅ 0 filas |
| Miembro inserta su sesión | ✅ 1 fila |
| Miembro inserta para otro | ✅ rechazado (42501) |
| Dueño inserta una serie en su sesión | ✅ 1 fila |
| Otro miembro inserta serie en sesión ajena | ✅ rechazado (42501) |
| Otro miembro lee series ajenas | ✅ 0 filas |
| Limpieza de datos de prueba | ✅ 0 filas |

- `WorkoutSession` con peso/reps y guardado; estadísticas en `Inicio`.
- `npm run build` OK (150 módulos) y `openspec validate` OK.
- **Pendiente**: aplicar en PROD y QA funcional en la app.

**Commit**: —
