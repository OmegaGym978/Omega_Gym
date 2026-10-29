# Design

## Context

Ver `proposal.md` — Why. Estado relevante:

- `instructions_es` llega como un párrafo con oraciones separadas por punto (verificado con el catálogo de DEV).
- La imagen y el título se renderizaban dentro de `Resumen`.
- El detalle carga ejercicio y estadísticas; no hay dependencias de notas.

## Goals / Non-Goals

**Goals:**

- Lectura por pasos con jerarquía visual y espaciado cómodo en móvil.
- Mantener imagen y título visibles en las tres pestañas sin duplicar el bloque.
- Colores theme-safe (claro y oscuro).

**Non-Goals:**

- Editar las instrucciones del catálogo.
- Notas personales (retiradas; ver reversión).
- Subir imágenes a Storage.

## Decisions

**1. Parser tolerante en cliente.**
Se prioriza: líneas → numeración inline → fin de oración. Se fusionan fragmentos sin puntuación final menores de 12 caracteres. Se descartó estructurar el backend: exigiría migrar más de 1.300 ejercicios.

**2. Área superior común.**
Se sube el bloque imagen + título sobre las pestañas. Se descartó duplicarlo en `Indicaciones`: duplicaría markup y cargaría dos veces la imagen.

**3. Tokens en lugar de colores literales.**
La primera versión usaba `text-zinc-200`/`zinc-400`, que en tema claro quedaba casi invisible sobre blanco. Se cambió a `text-text`, `text-text-2` y `text-text-3`, que se adaptan al tema.

**4. Carga en paralelo.**
Ejercicio y estadísticas se solicitan con `Promise.allSettled`; un fallo en estadísticas no rompe el detalle.

## Risks / Trade-offs

- **Parser**: abreviaturas o decimales pueden producir un corte imperfecto; se probó con muestras y el umbral de fusión reduce fragmentos.
- **Imagen alta en todas las pestañas**: consume espacio en `Historial`; se limita a `max-h-[320px]`.
- **Colores**: cualquier color literal nuevo rompería el tema claro; se revisa con grep de `zinc-`.

## Migration Plan

Sin migración. Solo cambios de UI y la eliminación del servicio/hoja de notas.

## Reversión

La sección de notas (tabla `exercise_notes`, servicio y hoja) se retiró el 2026-10-29 a solicitud del dueño. La tabla se conserva en DEV sin uso; PROD nunca la tuvo. Ver `knowledge/local/13_exercise_notes_decisions.md`.
