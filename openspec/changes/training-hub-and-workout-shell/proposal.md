# Proposal

## Why

La pantalla de rutinas del miembro (`/my-routines`) usa un patrón de panel de escritorio: breadcrumb, cabecera con acciones sueltas, tarjetas expandibles y un toggle de visibilidad. En móvil se siente ajena a una app nativa y no ofrece una acción clara para empezar a entrenar.

Tampoco existe un punto de entrada único: la home del miembro es `/my-plan` (vista día por día) y las rutinas propias viven en otra pestaña. El rediseño pide una pantalla principal de entrenamiento con lista apilada, botón `Empezar rutina` y una barra inferior con la pestaña activa resaltada.

## What Changes

- **`/my-routines` pasa a ser la home del miembro** y se llama **Entrenamiento**: `RootRedirect` envía al miembro a esta pantalla.
- **Lista apilada estilo nativo**: tarjeta por rutina con fondo oscuro, `rounded-2xl`, padding interno, título en negrita y resumen de ejercicios truncado a una línea.
- **Botón `Empezar rutina`** de ancho completo, píldora, en el acento rojo del proyecto.
- **Shell de sesión solo UI** (`WorkoutSession`): recorre los ejercicios, permite marcar series y muestra progreso en estado local. **No persiste nada**; se avisa explícitamente al finalizar.
- **Barra inferior reestilizada**: base en el negro/gris más oscuro del tema y pestaña activa en acento; nueva pestaña `Entrenamiento` con icono de mancuerna.
- **Acciones conservadas** (editar, compartir por código, visibilidad en Mi plan, eliminar) agrupadas en un menú `⋯` para no romper el layout móvil.
- **Servicio**: `routinesService.getMine` devuelve los nombres de ejercicios en la misma consulta, sin N+1.
- **Fuera de alcance**: registrar sesiones en base de datos, cronómetro de descanso, historial de entrenamientos y estadísticas de sesión.

## Capabilities

### New Capabilities

- `member-training-hub`: pantalla principal de entrenamiento del miembro, con listado de rutinas, resumen de ejercicios, inicio de sesión local y navegación inferior.

### Modified Capabilities

<!-- La navegación es parte de esta capability; no existía una spec previa de navegación. -->

## Impact

- **Código**: `src/pages/member/MyRoutines.tsx` (reescrito), `src/components/workout/WorkoutSession.tsx` (nuevo), `src/components/ui/layout/BottomNav.tsx`, `src/components/layout/MemberLayout.tsx`, `src/App.tsx`, `src/services/routines.service.ts`.
- **Navegación**: el miembro aterriza en `/my-routines`; `/my-plan` sigue disponible como vista del plan activo.
- **Base de datos**: sin cambios. El shell de sesión no escribe.
- **Roles**: admin y entrenador conservan su propio layout y sus rutas; solo cambia la navegación del miembro.
- **Riesgo**: la etiqueta `Entrenamiento` es la más larga de la barra inferior (5 ítems en 360 px); se resuelve con tipografía compacta y truncado.
