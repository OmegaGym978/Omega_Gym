# TKT-OMEGYM-031: Perfil de miembro con diseño móvil nativo

## Metadata
- **Tipo**: Feature (rediseño UI móvil)
- **Prioridad**: Media
- **Estado**: Review
- **Módulo**: members
- **Relacionado con**: `ai_work_flow/docs/specs/incremental/SPEC_001_member_shared_routines.md`
- **OpenSpec change**: `openspec/changes/native-member-profile/`
- **Ticket Externo**: — (solicitud directa del dueño del proyecto)
- **Fecha apertura**: 2026-10-29
- **Fecha cierre**: —

## Descripción
Refactorizar `MyProfile` a un diseño móvil nativo conservando estrictamente la paleta del proyecto (fondos oscuros + acento rojo/coral `#e85d5d`), sin azules de iOS:

- Cabecera sin breadcrumb: nombre a la izquierda; a la derecha iconos de lápiz (editar), compartir y engranaje (ajustes).
- Avatar circular a la izquierda + nombre a la derecha + fila de 3 estadísticas compactas (`Meses`, `Visitas`, `Entrenos`).
- Tarjeta de gráfico `rounded-2xl`: si no hay datos, icono de barras + `Aún no hay datos`.
- Fila de píldoras `Duración`, `Volumen`, `Repeticiones` con la activa en acento.
- Cuadrícula 2×2 "Información": `Estadísticas`, `Ejercicios`, `Medidas`, `Calendario`, cada botón con fondo oscuro, bordes muy redondeados, texto blanco e icono a la izquierda.
- Barra inferior con la pestaña activa `Perfil` en acento y base negra.

**Datos disponibles hoy**: solo `check_ins` (visitas) y la fecha de alta del perfil. No existen sesiones de entrenamiento, así que `Duración`, `Volumen` y `Repeticiones` no tienen fuente. Decisión acordada: la tarjeta añade una píldora `Visitas` (activa por defecto) con barras reales de los últimos 6 meses derivadas de `check_ins`; las otras tres muestran el estado vacío hasta que exista registro de sesiones (ver TKT-OMEGYM-030, shell solo UI).

## Dependencias
- **Bloqueado por**: TKT-OMEGYM-030 (barra inferior común)
- **Bloquea a**: —

## Archivos Afectados
- `src/pages/member/MyProfile.tsx` (reescrito)
- `src/components/profile/ActivityChart.tsx` (nuevo, SVG sin librerías)
- `src/pages/settings/SettingsModal.tsx` (se reutiliza desde el engranaje; sin cambios de contrato)

## Estimación
4–5 horas.

## Implementación
- [x] Diseño / estructura definida
- [x] Código implementado y tipado en TypeScript
- [x] Colores azules hardcodeados sustituidos por tokens/acento
- [x] Gráfico de visitas derivado de `check_ins`
- [ ] Prueba manual ejecutada

## Criterios de aceptación
- [ ] La pantalla no muestra breadcrumb; el nombre aparece arriba a la izquierda y los 3 iconos a la derecha.
- [ ] El lápiz abre el modal de edición existente y guardar nombre/teléfono sigue funcionando.
- [ ] Compartir usa `navigator.share` cuando está disponible y copia el enlace al portapapeles como fallback (con toast).
- [ ] El engranaje abre `SettingsModal` (tema y cerrar sesión).
- [ ] Avatar a la izquierda; nombre y 3 estadísticas (`Meses`, `Visitas`, `Entrenos`) a la derecha.
- [ ] La tarjeta de gráfico muestra barras de visitas por mes cuando hay check-ins y `Aún no hay datos` cuando no los hay.
- [ ] Las píldoras `Duración`, `Volumen`, `Repeticiones` muestran el estado vacío y la activa se pinta en acento.
- [ ] La cuadrícula 2×2 muestra `Estadísticas`, `Ejercicios`, `Medidas` y `Calendario`; `Calendario` navega a `/my-checkins` y el resto avisa "Próximamente".
- [ ] No queda ningún color azul hardcodeado en la pantalla (`rgba(59,130,246,*)`, `#60a5fa`).
- [x] `npm run build` sin errores.

## Evidencia de Cierre
**Fecha**: 2026-10-29  
**Probado por**: Dev asistido por IA  
**Resultado**:
- `MyProfile` reescrito: cabecera sin breadcrumb con lápiz/compartir/engranaje, avatar + nombre + 3 estadísticas, tarjeta de actividad y cuadrícula 2×2.
- Nuevo `ActivityChart` (barras por mes, sin librerías) alimentado por dos métodos nuevos en `checkInsService` (`countByMember`, `getSinceByMember`).
- Píldoras `Visitas` (datos reales) + `Duración` / `Volumen` / `Repeticiones` (estado vacío).
- Colores azules hardcodeados eliminados; se usan tokens/acento. Logout queda en `SettingsModal` (engranaje).
- `npm run build` OK (tsc + vite, 140 módulos).
- **Pendiente**: revisión visual en tema claro/oscuro, compartir en móvil real y validación del dueño.

**Commit**: —
