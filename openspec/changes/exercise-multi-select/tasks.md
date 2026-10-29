# Tasks

## 1. Componentes base

- [x] 1.1 Crear `src/components/ui/molecules/BottomSheet.tsx` (overlay inferior, `Escape`, click fuera, `stopPropagation`, safe-area)
- [x] 1.2 Crear `src/components/routine-builder/ExerciseMultiPicker.tsx` con buscador, paginación de 40 y estado de selección local
- [x] 1.3 Conectar los filtros `equipment` y `muscle_group` con `getEquipment()` / `getMuscleGroups()` y los filtros de `getAll()`

## 2. Interacción

- [x] 2.1 Implementar filas seleccionables con fondo `accent-dim`, checkmark en acento y `aria-pressed`
- [x] 2.2 Implementar dedupe por `exercise_id` contra los ejercicios ya presentes en la rutina (aviso y estado "ya incluido")
- [x] 2.3 Implementar footer `Agrega X ejercicios` con singular/plural y estado deshabilitado en 0
- [x] 2.4 Cubrir el catálogo vacío y los errores de carga (estado con reintento)

## 3. Integración y verificación

- [x] 3.1 Integrar el picker en `RoutineBuilder` (cambio `single-page-routine-builder`)
- [x] 3.2 Eliminar `ExercisePicker.tsx` y verificar que no quedan referencias
- [x] 3.3 Verificar en móvil (360 px) y escritorio: buscador, filtros, scroll, contador y confirmación
- [x] 3.4 Ejecutar `npm run build` sin errores

## 4. Cierre

- [x] 4.1 Registrar el ticket `TKT-OMEGYM-028` con criterios y evidencia
- [ ] 4.2 Validación manual del dueño del proyecto (móvil real) antes de cerrar el ticket
