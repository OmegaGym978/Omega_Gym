# Proposal

## Why

El alta y edición de rutinas usa un wizard de dos pasos (Información → Ejercicios) con barra de progreso y un selector de siete días. En móvil obliga a navegar entre pasos, y el selector de días añade una decisión que el gym no usa hoy: las rutinas se ejecutan completas, no repartidas por día de la semana.

Además, el formulario por ejercicio exige series/reps antes de poder agregarlo, lo que impide aprovechar la selección múltiple del nuevo picker.

## What Changes

- **Un solo builder de una página** para rutinas personales (`kind='personal'`) y planes del staff (`kind='trainer'`):
  - header con `Cancelar` (izquierda, acento), `Crear rutina` / `Editar rutina` (centro, blanco) y `Guardar` (derecha, acento);
  - input de título transparente y sin bordes, tipografía grande;
  - estado vacío con icono de mancuerna y `Empieza agregando un ejercicio a tu rutina`;
  - botón de ancho completo `+ Agregar ejercicio` (píldora acento) que abre el selector múltiple;
  - lista apilada de ejercicios; tocar una fila abre un bottom sheet con series, reps, notas y link;
  - defaults `3 × 12` al agregar y `reference_link` tomado del GIF del catálogo.
- **BREAKING**: se elimina el selector de días en **todo** el sistema. `plan_exercises.day` deja de escribirse (`null`) y de leerse; la columna queda como legacy nullable. Sin migración ni borrado de datos históricos.
- **Consecuencias de UI**:
  - `/my-plan` deja de tener tabs Lun–Dom y muestra la lista completa del plan activo;
  - `/training-plans` deja de agrupar por día en el detalle y elimina el chip "N días" y el mini gráfico semanal;
  - el detalle de "Mis rutinas" se muestra plano.
- **Fuera de alcance**: registro de sesiones de entrenamiento, duplicar ejercicios dentro de una rutina y arrastrar para reordenar (se mantienen flechas arriba/abajo).

## Capabilities

### New Capabilities

- `routine-builder`: creación y edición de una rutina o plan en una sola pantalla, con título, ejercicios configurables y sin reparto por días.

### Modified Capabilities

<!-- `training-plans` (existente en openspec/changes/hide-personal-routines-from-staff) no cambia su contrato de acceso; aquí solo cambia la estructura de edición y visualización. -->

## Impact

- **Código**: `src/components/routine-builder/RoutineBuilder.tsx` (reescrito), `ExerciseConfigSheet.tsx` (nuevo), `ExercisePicker.tsx` (eliminado), `training.service.ts`, `routines.service.ts`, `TrainingPlans.tsx`, `MyPlan.tsx`, `MyRoutines.tsx`.
- **Modelo de datos**: `plan_exercises.day` pasa a legacy (nullable, sin escrituras). No hay migración.
- **Datos existentes**: las rutinas con `day` cargado se leen planas; al editarlas y guardar quedan con `day = null`.
- **Documentación**: `ai_work_flow/knowledge/local/10_dayless_routines_decisions.md` y nota en `data/supabase/DATABASE_CONFIG.yaml`.
- **Riesgo funcional**: los planes del staff pierden el reparto por día (decisión explícita del dueño del proyecto).
