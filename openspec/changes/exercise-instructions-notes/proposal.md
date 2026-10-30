# Proposal

## Why

La pestaña `Indicaciones` del detalle mostraba el texto del catálogo como un párrafo dentro de una tarjeta. El catálogo entrega un solo párrafo con oraciones separadas por punto, así que la lectura en móvil es densa y no se percibe como instrucciones paso a paso. Además, la imagen y el título solo eran visibles en `Resumen`.

## What Changes

- **Área superior común**: imagen/GIF y título suben por encima de las pestañas y permanecen visibles en `Resumen`, `Historial` e `Indicaciones`. `Resumen` empieza directamente en el progreso.
- **Instrucciones como pasos**: nuevo parser que divide el texto por líneas, numeración inline o fin de oración, y lo renderiza como lista numerada con números en acento, espaciado amplio (`space-y-5`) y `leading-relaxed`.
- **Colores por token**: los pasos usan `text-text`, las etiquetas `text-text-2/3`; funcionan en tema claro y oscuro.
- **Sin cambios**: progreso, récords, historial, compartir y el resto del detalle.
- **Reversión**: la sección de notas personales que se había añadido en una iteración previa fue retirada a solicitud del dueño. La tabla `exercise_notes` se conserva en DEV sin uso. No hay UI ni servicio de notas.

## Capabilities

### New Capabilities

- `exercise-instructions`: presentación de las indicaciones del ejercicio como pasos numerados con imagen y título visibles.

### Modified Capabilities

<!-- `exercise-library` mantiene su contrato; solo cambia la composición de la pestaña Indicaciones. -->

## Impact

- **Base de datos**: sin cambios nuevos. `exercise_notes` existe en DEV pero no se usa; nunca se aplicó en PROD.
- **Código**: `pages/member/ExerciseDetail.tsx`, `lib/instructions.ts`.
- **Eliminado**: `components/exercises/ExerciseNoteSheet.tsx`, `services/exerciseNotes.service.ts`.
- **Datos**: sin backfill; el catálogo no se modifica.
