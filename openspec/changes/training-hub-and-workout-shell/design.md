# Design

## Context

Ver `proposal.md` — Why. Estado relevante antes del cambio:

- `MemberLayout` construye la navegación de miembro con `baseNavItems` (`Mi plan`, `Membresía`, `Asistencia` solo en DEV, `Perfil`) e inserta `Mis rutinas` solo para el rol `member`.
- `BottomNav` pinta un `nav` fijo con `bg-surface`, icono SVG inyectado por `dangerouslySetInnerHTML` y color de activo `text-accent`.
- `MyRoutines` carga rutinas propias (`routinesService.getMine`) y planes asignados (`trainingService.getByMemberAll`), muestra acciones sueltas por tarjeta y un detalle expandible agrupado por día.
- `routinesService.getMine` solo devuelve `exercise_count` (conteo agregado de PostgREST), no los nombres.
- `check_ins` existe, pero no hay tabla de sesiones de entrenamiento ni de series registradas.
- `App.tsx` redirige al miembro a `/my-plan`.

## Goals / Non-Goals

**Goals:**

- Una pantalla de entrada clara para entrenar, con acción primaria visible por rutina.
- Lista legible en una sola columna, sin depender de hover ni de expansión para entender la rutina.
- Barra inferior con jerarquía visual clara y activo en el acento del proyecto.
- Conservar todas las capacidades actuales (crear, editar, compartir, importar, visibilidad, eliminar).

**Non-Goals:**

- Persistir sesiones, series o duraciones (será otro ticket de datos).
- Medir tiempos de descanso o contar calorías.
- Cambiar las políticas RLS de rutinas personales.
- Rediseñar las pantallas de staff.

## Decisions

**1. `/my-routines` es la home del miembro.**
Se descartó mantener `/my-plan` como entrada: el plan es una vista de consulta y las rutinas son la unidad de trabajo. `/my-plan` queda a un toque en la barra inferior.

**2. El shell de sesión no persiste.**
Se descartó crear `workout_sessions` en este cambio: implicaría tablas, RLS, migración y un modelo de series que el rediseño no especifica. El shell marca series en memoria y avisa al finalizar que no se guardó. La UI queda preparada para conectar persistencia después.

**3. Una sola query para el listado.**
`getMine` incorpora `plan_exercises(exercise_name)` ordenado por `order_index` mediante `referencedTable`. Con eso el resumen de una línea no requiere una consulta por rutina ni un RPC nuevo.

**4. Acciones en menú `⋯`.**
Se descartó dejar cuatro iconos por tarjeta: en 360 px no caben junto al título. El menú conserva editar, compartir, visibilidad y eliminar; la eliminación mantiene la confirmación en dos pasos ya existente.

**5. El resumen de ejercicios es una línea, no una lista.**
Se muestran los nombres unidos por `·` con `line-clamp-1` y un contador cuando hay más de los que caben. Evita tarjetas de altura variable.

**6. Barra inferior con base `--bg`.**
Se usa el token más oscuro (#0f0f0f) con borde superior sutil y el activo en `--accent` con un indicador superior. Mantiene el tema claro funcionando (los tokens cambian, los colores no se fijan a mano).

**7. `Mi plan` se mantiene como pestaña separada.**
Se descartó fusionar "Entrenamiento" y "Mi plan": siguen teniendo propósitos distintos (mis rutinas vs. rutinas asignadas por el entrenador), y el cambio `single-page-routine-builder` ya aplana el contenido de ambas.

## Risks / Trade-offs

- **Cinco ítems en la barra inferior**: `Entrenamiento` es larga. Mitigación: `text-[10px]`, `truncate` y `flex-1`; verificación explícita en 360 px.
- **Shell sin persistencia puede confundir**: se mitiga con un aviso visible dentro de la sesión y un toast al finalizar.
- **Resumen de una línea oculta ejercicios**: se compensa con el contador total y el detalle al editar.
- **Rendimiento**: el join anidado añade una relación al payload, pero elimina N+1; el volumen por rutina es bajo (decenas de filas).
- **Cambio de home**: un miembro que esperaba "Mi plan" al entrar debe poder llegar en un toque; queda como segundo ítem.

## Migration Plan

1. Extender `getMine` con los nombres de ejercicios y manejo de error.
2. Crear `WorkoutSession` y conectarlo desde la tarjeta.
3. Reescribir `MyRoutines` con la lista apilada y el menú de acciones.
4. Reestilizar `BottomNav`, renombrar la pestaña en `MemberLayout` y cambiar `RootRedirect`.
5. Verificar build y recorrido manual en móvil y escritorio.

## Open Questions

- Ninguna bloqueante. Queda abierto, para otro ticket, si el shell de sesión debe persistir series y alimentar los gráficos del perfil.
