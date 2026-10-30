# Proposal

## Why

El builder de rutinas muestra cada ejercicio como una barra compacta con el resumen `3 × 12`. Ese resumen viene de dos columnas agregadas (`plan_exercises.sets` y `plan_exercises.reps`) y no permite planificar peso ni repeticiones distintas por serie, que es justo lo que un entrenador necesita al armar una rutina.

El rediseño móvil pide el patrón nativo de registro por series: cabecera del ejercicio con imagen y menú, descanso y nota como acciones rápidas, y una tabla de series con entradas de peso y repeticiones.

## What Changes

- **Nueva columna `plan_exercises.set_details JSONB`** con la forma `[{ weight, reps }]`. Sin cambios de RLS (la tabla ya está protegida). Restricción `CHECK` para exigir arreglo JSON o `NULL`.
- **Builder por series**: cada ejercicio pasa de barra compacta a tarjeta con:
  - imagen circular, nombre y menú `⋮` (mover arriba/abajo, enlace de referencia, quitar);
  - píldoras `Descanso: --` (escribe `rest_seconds`) y `Nota` (escribe `notes`);
  - columnas `SERIE · KGS · REPS` y filas con número de serie e inputs de peso/reps;
  - `+ Agregar serie` (copia la anterior) y eliminación de serie (mínimo una).
- **Se mantienen los agregados**: al guardar, `sets = número de series` y `reps = reps de la primera serie con valor`. Así `Mi plan`, el detalle de Planes y la sesión de entrenamiento siguen funcionando sin cambios.
- **Unidad fija KGS** (decisión del proyecto): sin preferencia LBS ni conversiones.
- **Compatibilidad**: las rutinas sin `set_details` se abren generando filas desde `sets`/`reps`.
- **Importación por código**: se recrea `import_routine_by_code` para copiar `set_details`.
- **BREAKING (interno)**: se elimina `ExerciseConfigSheet`; sus funciones se reparten entre las píldoras y el menú.
- **Fuera de alcance**: mostrar el detalle por serie en Mi plan, el panel de staff o la sesión; registro real de entrenamientos.

## Capabilities

### New Capabilities

- `exercise-set-logging`: planificación de series por ejercicio (peso, repeticiones, descanso y nota) dentro del builder de rutinas, con persistencia y compatibilidad con rutinas existentes.

### Modified Capabilities

<!-- `routine-builder` (change pendiente) mantiene su contrato de pantalla única; aquí solo cambia el detalle de cada ejercicio. -->

## Impact

- **Base de datos**: migración `supabase/migrations/20261029000002_plan_exercise_set_details.sql` (columna, `CHECK` y RPC de importación). Sin políticas nuevas.
- **Código**: `routine-builder/types.ts`, `RoutineBuilder.tsx`, `ExerciseMetaSheet.tsx` (nuevo), `ExerciseConfigSheet.tsx` (eliminado), `training.service.ts`, `routines.service.ts`, `MyRoutines.tsx`.
- **Datos**: sin backfill; `set_details = NULL` significa rutina anterior.
- **Entornos**: migración escrita; pendiente de aplicar en DEV y PROD.
