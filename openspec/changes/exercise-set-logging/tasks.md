# Tasks

## 1. Base de datos

- [x] 1.1 Escribir `supabase/migrations/20261029000002_plan_exercise_set_details.sql` (`set_details JSONB`, `COMMENT` y `CHECK` de arreglo)
- [x] 1.2 Recrear `import_routine_by_code` para copiar `set_details`
- [x] 1.3 Aplicar la migración en DEV y verificar la restricción (2026-10-29: columna, CHECK, RPC e historial verificados)
- [ ] 1.4 Aplicar en PROD y recargar PostgREST (token actual solo expone DEV)
- [ ] 1.5 Verificar un import por código entre dos cuentas conservando las series

## 2. Tipos y servicios

- [x] 2.1 Añadir `PlanSet` y `set_details` a `PlanExercise` y `ExerciseInput`
- [x] 2.2 Persistir `set_details` en `trainingService.upsertExercises` y `routinesService.saveExercises`
- [x] 2.3 Copiar `set_details` en `trainingService.duplicate`
- [x] 2.4 Propagar `set_details` en el mapeo de edición de `MyRoutines`

## 3. Builder por series

- [x] 3.1 Tipos locales `BuilderSet` y reconstrucción desde `sets`/`reps` cuando no hay `set_details`
- [x] 3.2 Tarjeta por ejercicio con imagen circular, nombre y menú `⋮` (mover, enlace, quitar)
- [x] 3.3 Píldoras `Descanso` y `Nota` conectadas a `rest_seconds` y `notes`
- [x] 3.4 Encabezado `SERIE · KGS · REPS` y filas con inputs de peso/reps
- [x] 3.5 `+ Agregar serie` (copia la anterior) y eliminar serie (mínimo una)
- [x] 3.6 Una serie inicial al agregar un ejercicio (reps 12, peso vacío)
- [x] 3.7 Validación: peso sin reps bloquea, filas vacías se descartan, agregados recalculados
- [x] 3.8 Crear `ExerciseMetaSheet` y eliminar `ExerciseConfigSheet`
- [x] 3.9 `+ Agregar ejercicio` en píldora de acento

## 4. Verificación

- [x] 4.1 `npm run build` sin errores
- [x] 4.2 `openspec validate exercise-set-logging --strict`
- [ ] 4.3 Crear rutina con 3 series, guardar, reabrir y comprobar peso/reps
- [ ] 4.4 Comprobar `sets`/`reps` agregados en Mi plan y en el detalle de Planes
- [ ] 4.5 Editar una rutina antigua sin `set_details` y verificar la generación de filas
- [ ] 4.6 Validación manual del dueño en móvil (inputs numéricos y menús)

## 5. Cierre

- [x] 5.1 Registrar `TKT-OMEGYM-037`
- [ ] 5.2 Cerrar el ticket con evidencia de DEV/PROD y QA
