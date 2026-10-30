# Design

## Context

Ver `proposal.md` — Why. Estado relevante antes del cambio:

- `MyProfile` muestra breadcrumb, avatar centrado (`avatarColor`/`initials`), dos `MetricCard` (meses/visitas) y una lista con email, teléfono y fecha de alta; incluye logout y dos modales (editar, eliminar cuenta).
- `SettingsModal` ya existe y contiene tema claro/oscuro, "Ver perfil" y cerrar sesión.
- `checkInsService.getByMember(id)` devuelve los check-ins del miembro (con `check_in_time`), suficiente para agregar visitas por mes.
- No existen tablas de sesiones, series ni medidas corporales.
- La barra inferior y sus tokens se reestilizan en el cambio `training-hub-and-workout-shell`.
- El proyecto soporta tema claro; los colores literales (azules) rompen ambos temas.

## Goals / Non-Goals

**Goals:**

- Estructura móvil nativa con acciones en iconos y jerarquía clara.
- Un único acento (rojo/coral) en toda la pantalla.
- Gráfico de actividad con datos reales disponibles (visitas) y estados vacíos honestos para el resto.
- Reutilizar los flujos existentes (editar perfil, ajustes, eliminar cuenta).

**Non-Goals:**

- Implementar Estadísticas, Medidas o Ejercicios (quedan como accesos "Próximamente").
- Persistir sesiones de entrenamiento o medidas corporales.
- Subir avatar a Storage.
- Cambiar el modelo de autenticación o el correo.

## Decisions

**1. Tokens en lugar de `bg-zinc-900`.**
Se descartó fijar `zinc` literal: el proyecto ya tiene `--surface` (#181818), `--surface2` y un tema claro. Usar tokens mantiene coherencia y evita una pantalla ilegible en modo claro.

**2. Una píldora extra `Visitas`.**
La especificación pide `Duración`, `Volumen` y `Repeticiones`, pero ninguna tiene fuente de datos. Se añade `Visitas` como pestaña activa por defecto, alimentada por `check_ins`, para que la tarjeta tenga valor real. Las tres pedidas se mantienen visibles con su estado vacío.

**3. Gráfico SVG propio.**
Se descartó añadir una librería de charts: son 6 barras mensuales y una escala simple. Un componente SVG de ~80 líneas evita peso y dependencias.

**4. Compartir con fallback.**
`navigator.share` cuando existe (móvil); en escritorio se copia el enlace de la app al portapapeles con toast. No se comparte información sensible del miembro.

**5. Cuadrícula con destinos reales donde existen.**
`Calendario` → `/my-checkins` (página de asistencias existente). `Estadísticas`, `Ejercicios` y `Medidas` no tienen pantalla; se muestran como botón con aviso "Próximamente" en lugar de enlaces rotos.

**6. Logout en Ajustes.**
El engranaje abre `SettingsModal`, que ya contiene "Cerrar sesión" y el tema. Se elimina el botón grande duplicado del perfil para respetar la estructura pedida.

**7. Se conserva el modal de edición.**
Email sigue siendo de solo lectura; el modal mantiene nombre y teléfono con la misma validación de 10 dígitos.

## Risks / Trade-offs

- **Pérdida del email/teléfono visibles**: siguen accesibles desde el lápiz; aceptado por la nueva estructura.
- **Gráfico vacío para miembros nuevos**: se muestra el estado `Aún no hay datos` con icono de barras, tal como pide el diseño.
- **"Próximamente" puede percibirse como incompleto**: se marca visualmente como etiqueta en el botón, no como error.
- **Compartir en escritorio**: el fallback depende de permisos del portapapeles; si falla, se muestra el enlace para copiar manualmente.
- **Doble fuente de logout**: se elimina del perfil; si el usuario no encuentra Ajustes, la barra inferior sigue mostrando `Perfil` y el engranaje está visible en la cabecera.

## Migration Plan

1. Crear `ActivityChart` con la agregación por mes y el estado vacío.
2. Reescribir `MyProfile` (cabecera, identidad, estadísticas, gráfico, cuadrícula).
3. Conectar editar, compartir y ajustes.
4. Verificar build y recorrido manual en móvil y escritorio, en tema claro y oscuro.

## Open Questions

- Ninguna bloqueante. Queda para otro ticket decidir si `Entrenos` se alimenta del shell de sesión cuando exista persistencia.
