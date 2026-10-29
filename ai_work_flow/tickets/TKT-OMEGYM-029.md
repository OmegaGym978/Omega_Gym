# TKT-OMEGYM-029: Builder de rutina en una sola página sin selector de días

## Metadata
- **Tipo**: Refactoring + Feature (rediseño UI móvil)
- **Prioridad**: Alta
- **Estado**: Review
- **Módulo**: training-plans
- **Relacionado con**: `ai_work_flow/docs/specs/incremental/SPEC_001_member_shared_routines.md`
- **OpenSpec change**: `openspec/changes/single-page-routine-builder/`
- **Ticket Externo**: — (solicitud directa del dueño del proyecto)
- **Fecha apertura**: 2026-10-29
- **Fecha cierre**: —

## Descripción
Refactorizar el flujo de creación/edición de rutinas: fuera el wizard de dos pasos (Información → Ejercicios), fuera la barra de progreso y fuera el selector de días de la semana. Todo pasa a una sola pantalla vertical, tanto para las rutinas personales (`kind = 'personal'`) como para los planes del staff (`kind = 'trainer'`).

Alcance decidido con el dueño del proyecto: **el día desaparece de todo el sistema**, no solo de las rutinas personales. `plan_exercises.day` queda como columna legacy (nullable, deja de escribirse) y no se ejecuta migración ni se borran datos históricos.

Estructura pedida:
- Header: `Cancelar` a la izquierda (texto acento), `Crear rutina` / `Editar rutina` al centro (blanco), `Guardar` a la derecha (acento).
- Input de título transparente, sin bordes, tipografía grande y placeholder sutil.
- Estado vacío: icono de mancuerna centrado + `Empieza agregando un ejercicio a tu rutina`.
- Botón de ancho completo `+ Agregar ejercicio` (píldora acento) que abre el selector múltiple del TKT-OMEGYM-028.
- Lista apilada de ejercicios; tocar una fila abre un bottom sheet para series, reps, notas y link (defaults 3 × 12).
- Sin selector de días de la semana.

## Dependencias
- **Bloqueado por**: TKT-OMEGYM-028 (picker multi-selección)
- **Bloquea a**: TKT-OMEGYM-030 (la lista "Entrenamiento" muestra el resumen de ejercicios de estas rutinas)

## Archivos Afectados
- `src/components/routine-builder/RoutineBuilder.tsx` (reescrito)
- `src/components/routine-builder/ExerciseConfigSheet.tsx` (nuevo)
- `src/components/routine-builder/ExercisePicker.tsx` (eliminado)
- `src/services/training.service.ts` (`ExerciseInput.day` nullable; sin `order('day')`)
- `src/services/routines.service.ts` (detalle sin orden por día)
- `src/pages/dashboard/TrainingPlans.tsx` (sin tabs de día, sin `weekBar`, sin chip de días)
- `src/pages/member/MyPlan.tsx` (lista plana, sin tabs Lun–Dom)
- `src/pages/member/MyRoutines.tsx` (detalle plano y mapeo de edición sin día)
- `ai_work_flow/knowledge/local/10_dayless_routines_decisions.md` (nuevo)

## Estimación
6–8 horas.

## Implementación
- [x] Diseño / estructura definida
- [x] Código implementado y tipado en TypeScript
- [x] `ExerciseInput.day` acepta `null` y la escritura guarda `null`
- [x] Tabs de día eliminados de `/training-plans` y de `/my-plan`
- [ ] Prueba manual ejecutada

## Criterios de aceptación
- [ ] Crear una rutina: título vacío → `Guardar` deshabilitado; con título y 0 ejercicios pide confirmación antes de guardar.
- [ ] `+ Agregar ejercicio` abre el selector múltiple; al confirmar 5 ejercicios aparecen como 5 filas con `3 × 12` por defecto.
- [ ] Tocar una fila permite editar series, reps, notas y link; los cambios persisten al guardar.
- [ ] Reordenar con las flechas cambia el orden y se refleja en el detalle y en "Mi plan".
- [ ] `Cancelar` con cambios sin guardar pide confirmación.
- [ ] Editar una rutina antigua con días: se muestra plana; al guardar, todas las filas quedan con `day = null`.
- [ ] `/training-plans`: el detalle de un plan muestra una lista plana (sin tabs Lun–Dom, sin chip "N días").
- [ ] `/my-plan`: sin tabs de día; muestra la lista completa del plan seleccionado.
- [ ] Crear plan del staff → asignarlo a un miembro → el miembro lo ve completo en "Mi plan" → editar y duplicar siguen funcionando.
- [x] `npm run build` sin errores.

## Evidencia de Cierre
**Fecha**: 2026-10-29  
**Probado por**: Dev asistido por IA  
**Resultado**:
- `RoutineBuilder` reescrito a una sola pantalla (header Cancelar / Crear-Editar / Guardar, título transparente, estado vacío con mancuerna, botón píldora y filas configurables).
- Nuevo `ExerciseConfigSheet` (series, reps, notas, link) con defaults 3 × 12 al agregar desde el selector múltiple.
- `plan_exercises.day` deja de escribirse (`day: null`) y de ordenarse; columna legacy documentada en `knowledge/local/10_dayless_routines_decisions.md` y `DATABASE_CONFIG.yaml`.
- `TrainingPlans`, `MyPlan` y el detalle de `MyRoutines` pasan a lista plana; se eliminó `ExercisePicker.tsx`.
- `npm run build` OK (tsc + vite, 140 módulos).
- **Pendiente**: regresión manual del flujo staff (asignar a 2 miembros, ver en Mi plan y en la ficha) y validación del dueño.

**Commit**: —

## Nota posterior (2026-10-29)
El reparto por **ejercicio** sigue eliminado. En TKT-OMEGYM-040 se añadió programación **a nivel de plan**
(`training_plans.scheduled_days`, 0=lun…6=dom) para alimentar el "Resumen de Hoy" de Inicio. No se
reactivó `plan_exercises.day`. Ver `knowledge/local/11_plan_schedule_and_sessions_decisions.md`.
