# Proposal

## Why

El alta de ejercicios dentro de una rutina se hace hoy desde un dropdown de selección única (`ExercisePicker`), dentro de un formulario que exige series y reps por cada ejercicio. En móvil ese patrón es lento: cada ejercicio requiere abrir el buscador, elegirlo, escribir serie/reps y confirmar, y el dropdown no permite ver la lista completa ni comparar opciones.

El rediseño móvil pide una pantalla completa de selección múltiple, con buscador, filtros por equipamiento y músculo, filas legibles y un botón flotante que confirme todos los ejercicios elegidos de una vez.

## What Changes

- **Nuevo picker full-screen** `ExerciseMultiPicker` con:
  - buscador con debounce y paginación de 40 en 40;
  - dos filtros tipo píldora (`Todo el equipamiento`, `Todos los músculos`) resueltos con los filtros ya existentes del servicio (`equipment`, `muscle_group`);
  - filas con imagen circular, nombre y grupo muscular;
  - selección múltiple con fondo resaltado y checkmark en el acento;
  - footer fijo `Agrega X ejercicios`, deshabilitado en cero.
- **Nuevo `BottomSheet`** reutilizable para los selectores de filtro y, más tarde, para la edición de un ejercicio.
- **Dedupe**: los ejercicios que ya están en la rutina no se pueden agregar dos veces; se avisa al usuario.
- **Sin cambios de datos**: no se toca el esquema ni los servicios de Supabase. Los filtros de equipamiento y músculo ya existen en `exercisesService`.
- **BREAKING (interno)**: el picker de selección única queda sin consumidores y se elimina al integrarse el builder de una página (TKT-OMEGYM-029).
- **Fuera de alcance**: crear ejercicios nuevos desde el picker, favoritos y filtros por categoría más allá de equipamiento/músculo.

## Capabilities

### New Capabilities

- `exercise-selection`: selección de ejercicios del catálogo para armar una rutina, incluyendo búsqueda, filtros, selección múltiple y confirmación en bloque.

### Modified Capabilities

<!-- Ninguna: el catálogo y sus filtros no cambian; solo la interfaz de selección. -->

## Impact

- **Código**: `src/components/routine-builder/ExerciseMultiPicker.tsx` (nuevo), `src/components/ui/molecules/BottomSheet.tsx` (nuevo). `ExercisePicker.tsx` se elimina en el cambio `single-page-routine-builder`.
- **Servicios**: `exercisesService.getAll/getEquipment/getMuscleGroups` se consumen tal cual; no se modifican.
- **Base de datos**: sin cambios.
- **UX**: desaparece el paso de configurar series/reps antes de agregar el ejercicio; esa captura pasa al bottom sheet de edición por fila (cambio `single-page-routine-builder`).
- **Performance**: una sola consulta por página de 40 filas; sin N+1 y sin cargar el catálogo completo.
