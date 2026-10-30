# 12_custom_exercises_and_progress_decisions.md

## Decisión: ejercicios personales y progreso por ejercicio

**Fecha**: 2026-10-29  
**Contexto**: Omega Gym — Perfil → Ejercicios (TKT-OMEGYM-042/043)  
**Autor**: Dev asistido por IA, aprobado por el dueño del proyecto

### Problema

El catálogo de ejercicios era global y de solo lectura para los miembros. No existía una vista de miembro para explorarlo ni un detalle con progreso, aunque desde TKT-041 ya se guardaban las series con peso y reps.

### Opciones Evaluadas

#### Dónde viven los ejercicios personales
1. **Misma tabla `exercises` con `created_by`**: conserva las FKs de `plan_exercises` y `workout_sets` y permite usarlos en rutinas.
2. **Tabla `member_exercises`**: separación limpia, pero rompe las FKs y obliga a duplicar el catálogo en el selector.
3. **No permitir crear**: menos alcance, pero el flujo pedido incluye "Crear".

#### Datos de progreso
1. **Calcular desde `workout_sets`**: real, sin nuevas tablas; agregación en cliente.
2. **Tabla de récords materializada**: consultas más rápidas, pero sincronización y migración extra.

### Decisión Final

- **Opción 1** para ejercicios personales: `exercises.created_by` (NULL = global). RLS de lectura global/propia y escritura propia; el staff no ve ejercicios personales.
- **Opción 1** para progreso: cálculos en cliente desde `workout_sets` (máx. 200 sesiones), con **1RM Epley** (`peso × (1 + reps/30)`).
- **FK segura**: `plan_exercises.exercise_id` pasa a `ON DELETE SET NULL` para permitir borrar ejercicios personales sin romper rutinas.
- **Detalle**: tabs `Resumen`, `Historial`, `Indicaciones`; compartir, agregar a rutina y eliminar.
- **Rutas**: `/my-profile/exercises` y `/my-profile/exercises/:id` dentro del MemberLayout.

### Aplicación

- Migración `20261029000004_custom_exercises.sql` (columna, RLS y FK).
- `services/exerciseStats.service.ts`, `pages/member/MyExercises.tsx`, `pages/member/ExerciseDetail.tsx`.
- `ExerciseFilterSheet` compartido con el selector de rutinas.

### Consecuencia conocida

El historial se calcula sobre las últimas 200 sesiones; si el volumen crece, se moverá a un RPC con agregación en SQL. El borrado de un ejercicio personal deja `exercise_id = NULL` en rutinas y series, pero conserva el nombre denormalizado para no perder el texto.
