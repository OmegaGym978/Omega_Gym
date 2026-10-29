# Design

## Context

Ver `proposal.md` — Why. Estado relevante antes del cambio:

- `RoutineBuilder` es un modal de dos pasos con estado `step: 1 | 2`, barra de progreso, `exercisesByDay: Record<number, LocalExercise[]>`, `selectedDay` y un formulario por ejercicio (`exName`, `exSets`, `exReps`, `exNotes`, `exLink`).
- El mismo componente lo usan `MyRoutines` (kind `personal`) y `TrainingPlans` (kind `trainer`).
- `trainingService.upsertExercises` borra todos los ejercicios del plan y los reinserta; `ExerciseInput.day` es obligatorio (`number`).
- `plan_exercises.day` es `INTEGER` nullable con `CHECK (day >= 0 AND day <= 6)`.
- `MyPlan` y `TrainingPlans` agrupan por `day ?? 0`, por lo que un ejercicio sin día cae siempre en lunes.
- Los estilos del proyecto son tokens de Tailwind v4 (`--surface`, `--accent`, etc.) con tema claro alternativo.

## Goals / Non-Goals

**Goals:**

- Una sola pantalla de edición, sin pasos ni días.
- Agregar varios ejercicios de golpe y ajustar series/reps después, por fila.
- Mantener el modelo de datos intacto (columna legacy, sin migración).
- Que "Mi plan", el detalle del panel y la ficha del miembro muestren listas planas coherentes.

**Non-Goals:**

- Registrar sesiones de entrenamiento.
- Reordenar por drag & drop.
- Migrar o limpiar los valores históricos de `day`.
- Cambiar el contrato de RLS ni los permisos de las rutinas personales.

## Decisions

**1. Un único builder para ambos tipos de plan.**
Se descartó mantener dos builders. El día no aporta valor al uso real del gym y duplicar el componente obligaría a mantener dos flujos y dos validaciones. El tipo (`kind`) solo decide el permiso y el destino de guardado.

**2. `day = null` y columna legacy, sin migración.**
Se descartó `DROP COLUMN`: hay datos históricos y un rollback costoso. Se deja nullable y se documenta como legacy. `ExerciseInput.day` pasa a `number | null` y `upsertExercises`/`saveExercises` escriben `null`. Los `order()` por `day` se eliminan para no depender de una columna inerte.

**3. "Mi plan" sin tabs de día.**
Ya no hay reparto semanal, así que los tabs serían decorativos. Se elimina el estado `day` y se muestra la lista completa del plan seleccionado (con el contador total de ejercicios).

**4. Detalle del panel de staff plano.**
`groupByDay`, `weekBar` y el chip "N días" (`p.days || 5`, que además mostraba 5 por defecto) se eliminan. El detalle muestra la lista ordenada por `order_index`.

**5. Configuración por fila en bottom sheet.**
Al confirmar la selección múltiple se agregan filas con `sets = 3`, `reps = 12`, `notes = null`, `reference_link = gif_url`. Tocar la fila abre `ExerciseConfigSheet` con los campos actuales (series, reps, notas, link). Se descartó volver a pedir los datos uno por uno: anula el beneficio de la selección múltiple.

**6. Título obligatorio, ejercicios opcionales con confirmación.**
`Guardar` se habilita con título; si no hay ejercicios pide confirmación explícita. Se descartó bloquear el guardado sin ejercicios: permitir guardar un borrador es útil y no rompe nada.

**7. Sin `step` no hay validación diferida.**
Se elimina `triedStep1`; la validación de título y de series/reps vive en la pantalla y en el sheet, con mensajes inline como hoy.

**8. Confirmación al cancelar con cambios.**
Se compara un snapshot serializado del estado inicial contra el actual; si difieren, se pide confirmación antes de cerrar.

## Risks / Trade-offs

- **Regresión en planes del staff**: pierden el reparto por día. Mitigación: checklist manual (crear → asignar a 2 miembros → ver en Mi plan y en `/members/:id` → editar → duplicar).
- **Rutinas antiguas**: conservan `day` en BD hasta que se editen; la UI las muestra planas y `order_index` sigue definiendo el orden visible.
- **Pérdida de la captura "por día"**: aceptada por decisión del proyecto; si se necesitara en el futuro, se reharía como etiqueta opcional, no como tabs.
- **`upsertExercises` borra e inserta**: si el insert falla tras el delete, la rutina queda sin ejercicios. Es el comportamiento previo; se mantiene y se documenta como deuda conocida.
- **Nombres de campo**: `ExerciseInput.day` se conserva (nullable) para no tocar los llamadores existentes ni el RPC de importación.

## Migration Plan

1. Ajustar tipos y servicios (`day` nullable, sin `order('day')`).
2. Reescribir el builder y crear el sheet de configuración.
3. Integrar el picker múltiple y eliminar el picker mono-selección.
4. Aplanar `MyPlan`, `TrainingPlans` y el detalle de `MyRoutines`.
5. `npm run build` + regresión manual del flujo staff y del miembro.

## Open Questions

- Ninguna bloqueante. Queda como deuda conocida la falta de transacción en `upsertExercises`.
