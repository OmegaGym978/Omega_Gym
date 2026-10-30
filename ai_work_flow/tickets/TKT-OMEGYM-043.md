# TKT-OMEGYM-043: Detalle de ejercicio con progreso e historial

## Metadata
- **Tipo**: Feature (UI + estadísticas)
- **Prioridad**: Alta
- **Estado**: Review
- **Módulo**: exercise-progress
- **Relacionado con**: `openspec/changes/member-exercise-library/`
- **OpenSpec change**: `member-exercise-library` → capability `exercise-progress`
- **Ticket Externo**: — (solicitud directa del dueño del proyecto)
- **Fecha apertura**: 2026-10-29
- **Fecha cierre**: —

## Descripción
Segunda pantalla del flujo: detalle del ejercicio en `/my-profile/exercises/:id`.

- Header centrado con volver, compartir y menú `⋯`.
- Tabs `Resumen`, `Historial`, `Indicaciones` con activo en acento.
- Resumen con GIF a ancho completo, músculo, tarjeta de progreso, píldoras de métrica y récords personales.
- Progreso real desde `workout_sets`: Mayor Peso, 1RM (Epley) y Mejor Volumen por sesión.
- Historial por sesión y acciones de compartir, agregar a rutina y eliminar (solo ejercicios propios).

## Dependencias
- **Bloqueado por**: TKT-OMEGYM-042, TKT-OMEGYM-041
- **Bloquea a**: —

## Archivos Afectados
- `src/pages/member/ExerciseDetail.tsx`
- `src/services/exerciseStats.service.ts`
- `src/components/ui/layout/ScreenHeader.tsx` (`centerTitle`)
- `src/App.tsx`

## Implementación
- [x] Servicio de estadísticas por ejercicio (PR, 1RM, volumen, historial)
- [x] Header centrado con compartir y menú
- [x] Tabs con subrayado en acento
- [x] Resumen con GIF, tarjeta de progreso y estado vacío
- [x] Píldoras de métrica y gráfico de barras
- [x] Récords personales e historial real
- [x] Compartir, agregar a rutina y eliminar con confirmación
- [ ] Prueba manual de UI ejecutada

## Criterios de aceptación
- [ ] El detalle muestra GIF, nombre y músculo primario.
- [ ] Sin sesiones: "Aún no hay datos" y récords en `—`.
- [ ] Con sesiones: gráfico, récords e historial con datos reales.
- [ ] Las píldoras cambian la métrica del gráfico y la activa va en acento.
- [ ] Compartir funciona con `navigator.share` o portapapeles.
- [ ] Agregar a una rutina propia añade el ejercicio con 1 serie de 12.
- [ ] Eliminar un ejercicio propio regresa a la lista y no rompe rutinas.
- [x] `npm run build` y `openspec validate` OK.

## Evidencia de Cierre
**Fecha**: 2026-10-29  
**Probado por**: Dev asistido por IA  
**Resultado**:
- `exerciseStatsService` agrega series completadas por sesión y calcula PR de peso, 1RM Epley y volumen.
- Detalle con tabs, gráfico (`ActivityChart`), récords e historial.
- Menú con agregar a rutina (1×12), ver historial y eliminar (solo propios, con `ConfirmSheet`).
- Compartir con `navigator.share` y fallback al portapapeles.
- `npm run build` OK (155 módulos) y `openspec validate` OK.
- **Pendiente**: QA funcional con sesiones reales y validación visual.

**Commit**: —
