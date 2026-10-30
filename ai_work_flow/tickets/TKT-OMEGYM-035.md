# TKT-OMEGYM-035: Reescribir Planes de Entrenamiento sin CSS propio

## Metadata
- **Tipo**: Refactoring (UI)
- **Prioridad**: Alta
- **Estado**: Review
- **Módulo**: staff-screens
- **Relacionado con**: `openspec/changes/mobile-native-shell/`
- **OpenSpec change**: `mobile-native-shell` → capability `staff-screens`
- **Fecha apertura**: 2026-10-29
- **Fecha cierre**: —

## Descripción
`TrainingPlans` dependía de `src/styles/training-plans.css` (690 líneas, medidas en píxeles, master-detail de escritorio y 12 colores hexadecimales). Era la única pantalla que no podía seguir el shell móvil. Se reconstruye con Tailwind y tokens: lista apilada, detalle a pantalla completa y los mismos flujos de gestión.

## Dependencias
- **Bloqueado por**: TKT-OMEGYM-032 y 033
- **Bloquea a**: —

## Archivos Afectados
- `src/pages/dashboard/TrainingPlans.tsx` (reescrito)
- `src/styles/training-plans.css` (eliminado)

## Implementación
- [x] Lista apilada de planes (grid de 2 columnas en escritorio) con buscador y filtros píldora
- [x] Detalle a pantalla completa con volver, duplicar, editar y eliminar
- [x] Asignados con selector múltiple y retiro individual
- [x] Detalle de ejercicio en modal redondeado
- [x] Sin colores hexadecimales ni CSS propio
- [x] Conservados crear, editar, duplicar, asignar, quitar y eliminar

## Criterios de aceptación
- [ ] Crear plan desde "+ Nuevo" → aparece en la lista.
- [ ] Abrir un plan → detalle a pantalla completa con asignados y ejercicios.
- [ ] Asignar 2 miembros desde el detalle → aparecen y el plan pasa a "Asignado".
- [ ] Quitar un miembro pide confirmación y actualiza la lista.
- [ ] Duplicar y editar abren sus flujos y refrescan el detalle.
- [ ] Eliminar pide confirmación y borra plan y ejercicios.
- [ ] No existe `src/styles/training-plans.css` ni hex hardcodeados.
- [x] `npm run build` sin errores.

## Evidencia de Cierre
**Fecha**: 2026-10-29  
**Probado por**: Dev asistido por IA  
**Resultado**:
- `TrainingPlans.tsx` reescrito con Tailwind, `ScreenHeader` y detalle `fixed inset-0`.
- Modales de asignación, vista rápida, eliminar, quitar y detalle de ejercicio en el nuevo estilo.
- `src/styles/training-plans.css` eliminado; sin referencias.
- `npm run build` OK (141 módulos).
- **Pendiente**: regresión manual de asignaciones en DEV.

**Commit**: —
