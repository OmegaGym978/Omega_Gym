# Tasks

## 1. Modelo y servicios

- [x] 1.1 Cambiar `ExerciseInput.day` a `number | null` y escribir `day: null` en `trainingService.upsertExercises` y `routinesService.saveExercises`
- [x] 1.2 Eliminar los `order('day')` de `trainingService.getById`, `trainingService.getExercises` y `routinesService.getDetail`
- [x] 1.3 Quitar `days` de `PlanListItem` y de su mapeo en `trainingService.getAll`
- [x] 1.4 Documentar la columna legacy en `knowledge/local/10_dayless_routines_decisions.md` y en `data/supabase/DATABASE_CONFIG.yaml`

## 2. Builder de una página

- [x] 2.1 Reescribir `RoutineBuilder.tsx`: header de tres acciones, título transparente, estado vacío con mancuerna y lista apilada
- [x] 2.2 Crear `ExerciseConfigSheet.tsx` (series, reps, notas y link) y conectarlo a la fila
- [x] 2.3 Integrar `ExerciseMultiPicker` con defaults 3 × 12 y `reference_link` del GIF
- [x] 2.4 Implementar reordenar con flechas, eliminar fila y confirmación al cancelar con cambios
- [x] 2.5 Eliminar pasos, barra de progreso, tabs de días y `ExercisePicker.tsx`

## 3. Vistas afectadas

- [x] 3.1 `MyPlan.tsx`: quitar tabs Lun–Dom y el estado `day`; lista plana con contador total
- [x] 3.2 `TrainingPlans.tsx`: quitar `groupByDay`, tabs de día, `weekBar` y chip de días; detalle plano
- [x] 3.3 `MyRoutines.tsx`: detalle plano y mapeo de edición sin día

## 4. Verificación

- [x] 4.1 Crear rutina personal con 5 ejercicios, editar series/reps, reordenar y guardar
- [x] 4.2 Editar una rutina antigua con días y verificar que queda con `day = null`
- [x] 4.3 Regresión staff: crear plan → asignar a 2 miembros → ver en Mi plan y en la ficha del miembro → editar → duplicar
- [x] 4.4 Ejecutar `npm run build` sin errores

## 5. Cierre

- [x] 5.1 Registrar el ticket `TKT-OMEGYM-029`
- [ ] 5.2 Validación manual del dueño del proyecto antes de cerrar el ticket
