# 10_dayless_routines_decisions.md

## Decisión: eliminar el reparto de rutinas por día de la semana

**Fecha**: 2026-10-29  
**Contexto**: Omega Gym — builder de rutinas y planes de entrenamiento (TKT-OMEGYM-029)  
**Autor**: Dev asistido por IA, aprobado por el dueño del proyecto

### Problema

El builder de rutinas era un wizard de dos pasos con un selector de siete días (Lun–Dom). Cada ejercicio se guardaba con `plan_exercises.day`, y tanto "Mi plan" como el detalle de `/training-plans` agrupaban por ese valor. En la operación real del gym las rutinas se ejecutan completas, no repartidas por día, y el selector añadía fricción en móvil (dos pasos + día + formulario por ejercicio).

### Opciones Evaluadas

#### Opción 1: quitar el selector de días solo en rutinas personales
**Pros**: ✅ Cero impacto en los planes del staff y en la asignación por miembro.  
**Contras**: ❌ Mantiene dos builders y dos modelos mentales; "Mi plan" seguiría mostrando tabs de día para los planes del entrenador y no para las rutinas propias.

#### Opción 2: eliminar el día en todo el sistema (elegida)
**Pros**: ✅ Un solo builder y una sola forma de leer un plan; menos pasos; coherente con el uso real.  
**Contras**: ❌ Regresión funcional para los planes del staff, que pierden el reparto semanal (se acepta explícitamente).

#### Opción 3: migrar la columna (DROP COLUMN / NOT NULL)
**Pros**: ✅ Modelo limpio.  
**Contras**: ❌ Coste alto de rollback, pérdida de datos históricos y migración innecesaria: la columna ya es nullable.

### Decisión Final
**Selección**: Opción 2 — el día desaparece de todo el sistema.

**Razones**:
1. El gimnasio no programa rutinas por día; el dato no se usaba para operar.
2. Un único builder reduce duplicación y bugs (una sola validación, un solo guardado).
3. Se preserva el histórico: `plan_exercises.day` queda como **columna legacy** (nullable), deja de escribirse (`day = null`) y deja de leerse; el orden visible pasa a ser `order_index`.

### Aplicación
- `src/components/routine-builder/RoutineBuilder.tsx`: builder de una página, sin pasos ni días.
- `src/services/training.service.ts` y `src/services/routines.service.ts`: `day: null` al escribir y sin `order('day')`.
- `src/pages/member/MyPlan.tsx`: lista plana del plan activo.
- `src/pages/dashboard/TrainingPlans.tsx`: detalle plano, sin tabs de día ni chip "N días".
- **Sin migración**: no se borran datos históricos ni se altera el esquema. El `CHECK (day BETWEEN 0 AND 6)` sigue vigente y `null` es válido.

### Consecuencia conocida
Un plan creado antes del cambio conserva sus valores de `day` en base de datos hasta que se edite; la UI lo muestra plano y, al guardarlo desde el builder, todas las filas quedan con `day = null`. No hay pérdida de ejercicios.

### Addendum (2026-10-29)
El reparto por ejercicio sigue eliminado. Para el "Resumen de Hoy" (TKT-OMEGYM-040) se añadió programación
**a nivel de plan** con `training_plans.scheduled_days` (0=lun … 6=dom). Es una decisión distinta: la rutina
se programa como unidad y `plan_exercises.day` permanece legacy. Ver `11_plan_schedule_and_sessions_decisions.md`.
