# Design

## Context

Ver `proposal.md` — Why. Estado relevante antes del cambio:

- `exercisesService` ya expone `getAll({ search, category, muscle_group, equipment, limit, offset })`, `getEquipment()` y `getMuscleGroups()`. El catálogo es global (tabla `exercises`) y no depende del usuario.
- `ExercisePicker` (mono-selección) mantiene estado de `query`, `selectedCategory`, paginación por bloques de 40 y `open` controlado por click-outside.
- El builder actual usa ese dropdown dentro de un formulario con `sets`, `reps`, `notes` y `reference_link` obligatorios (sets/reps) antes de agregar.
- Los tokens de diseño ya existen: `--accent` (#e85d5d), `--accent-dim`, `--surface`, `--surface2`, `--border`, `--text-3`. El proyecto soporta tema claro vía tokens.

## Goals / Non-Goals

**Goals:**

- Seleccionar N ejercicios en una sola pasada y confirmarlos de golpe.
- Mantener el costo de red acotado (paginación, debounce) y evitar duplicados.
- Reutilizar los filtros existentes sin tocar Supabase.
- Respetar la paleta y el tema (tokens, no colores literales nuevos).

**Non-Goals:**

- Persistir la selección entre sesiones o entre rutinas.
- Crear ejercicios desde el picker.
- Cambiar el catálogo, sus columnas o sus políticas RLS.
- Definir aquí los valores por defecto de series/reps (los fija el builder).

## Decisions

**1. Overlay full-screen en lugar de ruta dedicada.**
Se descartó una ruta (`/my-routines/new/exercises`) porque obliga a reconstruir el estado del builder al volver y añade navegación con historial. El overlay conserva el estado del formulario debajo.

**2. Filtros en bottom sheet, no en un `<select>`.**
Los dos botones-píldora abren un bottom sheet con la lista de opciones y una opción "Todos". Es el patrón móvil nativo y evita el control nativo de iOS que el rediseño prohíbe.

**3. Dos filtros independientes y acumulables.**
`equipment` y `muscle_group` se aplican en la misma consulta; cada uno se puede limpiar por separado. La etiqueta del botón refleja el valor activo.

**4. Dedupe por `exercise_id` contra la rutina en edición.**
Se descartó permitir duplicados: el mismo ejercicio dos veces en una rutina es casi siempre un error y complica el orden. Se avisa con toast y el checkmark aparece como "ya incluido".

**5. Selección local hasta confirmar.**
El overlay mantiene un `Set<string>` de ids; solo al confirmar devuelve el arreglo de `Exercise` al builder. Cerrar sin confirmar descarta la selección.

**6. Imagen circular con fallback.**
Se usa `gif_url` en un contenedor circular; si falta, se muestra un icono genérico sobre `--surface2`, igual que el picker actual.

## Risks / Trade-offs

- **Lista larga en móvil**: se resuelve con paginación de 40 y `Ver más` manual (mismo patrón que hoy). No se implementa scroll infinito por IntersectionObserver para no añadir complejidad no pedida.
- **Bottom sheet anidado sobre overlay**: dos capas `fixed`; se cierra primero el sheet y luego el overlay. Se maneja con `stopPropagation` y `Escape` en la capa superior.
- **Selección perdida al cerrar**: aceptado; el botón de confirmar es explícito y el contador está siempre visible.
- **Accesibilidad**: cada fila es un `button` con `aria-pressed`; el contador usa `aria-live="polite"`.

## Migration Plan

1. Crear `BottomSheet` y `ExerciseMultiPicker`.
2. Integrarlo en el builder de una página (cambio `single-page-routine-builder`).
3. Eliminar `ExercisePicker` cuando no queden referencias.
4. Verificar build y flujo manual en móvil (360 px) y escritorio.

## Open Questions

- Ninguna bloqueante.
