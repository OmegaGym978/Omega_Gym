# Proposal

## Why

La cuadrícula del Perfil tenía un acceso a "Ejercicios" que solo mostraba "próximamente". El catálogo existía, pero no había una vista de miembro para explorarlo, ni detalle por ejercicio, ni forma de crear ejercicios propios. Tampoco se aprovechaba el historial de series que ya se guarda desde TKT-041 para mostrar progreso.

## What Changes

- **Dos pantallas nativas** dentro de `MemberLayout`:
  - `/my-profile/exercises`: lista con búsqueda, filtros y celdas tipo iOS.
  - `/my-profile/exercises/:exerciseId`: detalle con tabs `Resumen`, `Historial`, `Indicaciones`.
- **Ejercicios personales**: columna `created_by` en `exercises`; el catálogo global sigue visible para todos y los personales solo para su dueño. Formulario "Crear" en hoja inferior.
- **Progreso real**: desde `workout_sets` se calculan Mayor Peso, 1RM (Epley) y Mejor Volumen por sesión, con gráfico de barras, récords personales e historial.
- **Acciones**: compartir por enlace, agregar el ejercicio a una rutina propia, ver historial y eliminar ejercicios personales.
- **Borrado seguro**: el FK `plan_exercises.exercise_id` pasa a `ON DELETE SET NULL` para no bloquear la eliminación.
- **Sin cambios** en Entrenamiento, en el selector de rutinas (salvo reutilizar el filtro) ni en las sesiones.

## Capabilities

### New Capabilities

- `exercise-library`: exploración y creación de ejercicios para el miembro, con lista, filtros y detalle por pestañas.
- `exercise-progress`: estadísticas por ejercicio (progreso, récords e historial) a partir de las sesiones registradas.

### Modified Capabilities

<!-- `workout-sessions` no cambia: solo se consulta lo ya guardado. -->

## Impact

- **Base de datos**: migración `20261029000004_custom_exercises.sql` (`created_by`, índice, políticas de catálogo/propios y FK `SET NULL`). Sin backfill.
- **Código**: `pages/member/MyExercises.tsx`, `pages/member/ExerciseDetail.tsx`, `components/exercises/*`, `services/exerciseStats.service.ts`, `exercises.service.ts`, `ScreenHeader` (título centrado), rutas y acceso desde el Perfil.
- **Entornos**: DEV aplicada y verificada; PROD pendiente (token actual solo expone DEV).
- **Riesgo**: reemplazo de la política de lectura del catálogo; se probó con JWT simulado.
