# TKT-OMEGYM-030: "Entrenamiento" — lista móvil de rutinas, bottom nav y shell de sesión

## Metadata
- **Tipo**: Feature (rediseño UI móvil)
- **Prioridad**: Alta
- **Estado**: Review
- **Módulo**: training-plans
- **Relacionado con**: `ai_work_flow/docs/specs/incremental/SPEC_001_member_shared_routines.md`
- **OpenSpec change**: `openspec/changes/training-hub-and-workout-shell/`
- **Ticket Externo**: — (solicitud directa del dueño del proyecto)
- **Fecha apertura**: 2026-10-29
- **Fecha cierre**: —

## Descripción
`/my-routines` pasa a ser la pantalla principal del miembro y se llama **Entrenamiento**. El diseño actual de tarjetas con breadcrumb, acciones sueltas y detalle expandible se sustituye por una lista apilada vertical estilo app nativa:

- Contenedor por rutina con fondo oscuro (`--surface`), `rounded-2xl` y padding interno.
- Título en negrita arriba y resumen de ejercicios truncado a **una línea** en gris.
- Botón `Empezar rutina` de ancho completo, píldora (`rounded-full`), en el acento rojo actual.
- Barra de navegación inferior fija con la pestaña activa (`Entrenamiento`) resaltada en rojo.
- Menú `⋯` por rutina para conservar editar, compartir, visibilidad en Mi plan y eliminar.

**Empezar rutina** abre un shell de sesión **solo UI**: recorre los ejercicios, permite marcar series y muestra progreso en estado local. No hay tabla nueva ni persistencia (decisión explícita: el registro real de sesiones sería otro ticket de datos).

## Dependencias
- **Bloqueado por**: TKT-OMEGYM-029 (builder y modelo sin días)
- **Bloquea a**: TKT-OMEGYM-031 (el perfil reutiliza el bottom nav y la base negra)

## Archivos Afectados
- `src/pages/member/MyRoutines.tsx` (reescrito)
- `src/services/routines.service.ts` (`getMine` devuelve nombres de ejercicios; manejo de error)
- `src/components/workout/WorkoutSession.tsx` (nuevo)
- `src/components/ui/layout/BottomNav.tsx` (estilo base + activo en acento)
- `src/components/layout/MemberLayout.tsx` (pestaña `Entrenamiento` con icono mancuerna)
- `src/App.tsx` (`RootRedirect` del miembro → `/my-routines`)

## Estimación
5–7 horas.

## Implementación
- [x] Diseño / estructura definida
- [x] Código implementado y tipado en TypeScript
- [x] Una sola query para el listado (sin N+1) con nombres de ejercicios
- [x] Shell de sesión en estado local
- [ ] Prueba manual ejecutada

## Criterios de aceptación
- [ ] Al iniciar sesión como miembro, `/` redirige a `/my-plan` (Inicio); `Entrenamiento` es una pestaña de la barra inferior.
- [ ] La barra inferior muestra `Entrenamiento`, `Mi plan`, `Membresía`, `Perfil` (y `Asistencia` solo en DEV), con fondo negro/gris más oscuro y la pestaña activa en acento.
- [ ] Cada rutina se ve como tarjeta `rounded-2xl` con título en negrita y una línea de ejercicios truncada (singular/plural correcto).
- [ ] El botón `Empezar rutina` ocupa el ancho completo, es píldora y abre el shell de sesión con los ejercicios de la rutina.
- [ ] En el shell se puede marcar/desmarcar cada serie, el progreso avanza y `Finalizar` cierra avisando que no se guardó.
- [ ] El menú `⋯` conserva editar, compartir por código, visibilidad en Mi plan y eliminar (con confirmación en dos pasos).
- [ ] La sección "Asignadas por tu entrenador" usa el mismo lenguaje visual y mantiene su toggle de visibilidad.
- [ ] Errores de carga muestran un mensaje y permiten reintentar (sin pantalla en blanco).
- [x] `npm run build` sin errores.

## Evidencia de Cierre
**Fecha**: 2026-10-29  
**Probado por**: Dev asistido por IA  
**Resultado**:
- `MyRoutines` reescrito: tarjetas `rounded-2xl`, título en negrita, resumen de ejercicios en una línea, botón `Empezar rutina` píldora y menú `⋯` con editar/compartir/visibilidad/eliminar.
- `routinesService.getMine` devuelve `exercise_names` en la misma consulta (sin N+1).
- Nuevo `WorkoutSession` (solo UI, estado local, aviso explícito de que no se guarda).
- `BottomNav` con base `--bg`, indicador y activo en acento; pestaña `Entrenamiento` con icono de mancuerna en `MemberLayout`.
- `RootRedirect` del miembro → `/my-routines`.
- `npm run build` OK (tsc + vite, 140 módulos).
- **Pendiente**: recorrido manual en móvil (360 px) y validación del dueño.

**Commit**: —
