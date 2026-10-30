# TKT-OMEGYM-028: Selector de ejercicios multi-selección a pantalla completa

## Metadata
- **Tipo**: Feature (rediseño UI móvil)
- **Prioridad**: Media
- **Estado**: Review
- **Módulo**: training-plans
- **Relacionado con**: `ai_work_flow/docs/specs/incremental/SPEC_001_member_shared_routines.md`
- **OpenSpec change**: `openspec/changes/exercise-multi-select/`
- **Ticket Externo**: — (solicitud directa del dueño del proyecto)
- **Fecha apertura**: 2026-10-29
- **Fecha cierre**: —

## Descripción
Hoy `ExercisePicker` es un dropdown de selección única incrustado en el formulario de un ejercicio del `RoutineBuilder`. El rediseño móvil nativo pide una pantalla completa de selección múltiple:

- Buscador superior con fondo gris oscuro.
- Dos botones de filtro (`Todo el equipamiento`, `Todos los músculos`) con bordes redondeados.
- Filas simples: imagen circular a la izquierda, nombre en blanco y grupo muscular en gris.
- Estado de selección con cambio sutil de fondo y checkmark en el acento rojo.
- Botón flotante inferior `Agrega X ejercicios`.

La paleta no cambia: se usan los tokens existentes (`--accent` #e85d5d, `--surface`, `--surface2`). No se introducen colores de iOS ni azules.

## Dependencias
- **Bloqueado por**: —
- **Bloquea a**: TKT-OMEGYM-029 (el builder de una página consume este picker)

## Archivos Afectados
- `src/components/routine-builder/ExerciseMultiPicker.tsx` (nuevo)
- `src/components/ui/molecules/BottomSheet.tsx` (nuevo, reutilizable para filtros y edición de ejercicio)
- `src/components/routine-builder/ExercisePicker.tsx` (queda sin consumidores; se elimina en TKT-OMEGYM-029)
- `src/services/exercises.service.ts` (sin cambios: ya expone `getEquipment()`, `getMuscleGroups()` y los filtros `equipment` / `muscle_group`)

## Estimación
4–6 horas.

## Implementación
- [x] Diseño / estructura definida (overlay full-screen + bottom sheet de filtros)
- [x] Código implementado y tipado en TypeScript
- [x] Búsqueda con debounce y paginación por bloques de 40
- [x] Filtros de equipamiento y músculo conectados al servicio
- [x] Selección múltiple con dedupe contra los ejercicios ya presentes en la rutina
- [ ] Prueba manual ejecutada

## Criterios de aceptación
- [ ] Escribir en el buscador filtra por `name` / `name_es` en menos de ~400 ms.
- [ ] `Todo el equipamiento` abre un selector con las opciones distintas de `exercises.equipment`; al elegir una, el botón muestra la opción activa y la lista se filtra.
- [ ] `Todos los músculos` se comporta igual con `exercises.muscle_group`.
- [ ] Tocar una fila alterna la selección: fondo `accent-dim` + checkmark en acento; el contador del botón inferior se actualiza.
- [ ] El botón inferior dice `Agrega 1 ejercicio` / `Agrega N ejercicios` y está deshabilitado en 0.
- [ ] Un ejercicio que ya está en la rutina no se puede volver a agregar (se muestra aviso).
- [ ] Al confirmar se devuelven las N selecciones al builder y la pantalla se cierra conservando el scroll del builder.
- [x] `npm run build` sin errores.

## Evidencia de Cierre
**Fecha**: 2026-10-29  
**Probado por**: Dev asistido por IA  
**Resultado**:
- Implementado `ExerciseMultiPicker` + `BottomSheet` + `lib/exercise-labels.ts`.
- Filtros reutilizan `exercisesService.getEquipment()` / `getMuscleGroups()` (sin cambios de BD).
- `npm run build` OK: `tsc -b && vite build`, 140 módulos, PWA generada.
- **Pendiente**: recorrido manual del dueño en móvil real (buscador, filtros, contador y confirmación) para pasar a `Closed`.

**Commit**: —
