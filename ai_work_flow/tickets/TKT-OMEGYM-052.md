# TKT-OMEGYM-052: "Mi membresía" — layout unificado y recibos integrados

## Metadata
- **Tipo**: Refactoring (UI/UX)
- **Prioridad**: Media
- **Estado**: Review
- **Módulo**: memberships / payments (vista del miembro)
- **Relacionado con**: `SPECIFICATION.md` (§11.3 Membresías y Pagos, §14 Estrategia de Componentes)
- **Ticket Externo**: — (solicitud directa del dueño del proyecto)
- **Fecha apertura**: 2026-11-02
- **Fecha cierre**: —

## Descripción

"Mi membresía" rompía el lenguaje del resto de la app: usaba un `h1` propio de
34 px y un `SegmentedControl` grande ("Mi membresía" / "Pagos") justo debajo,
mientras **Inicio** y **Entrenamiento** usan `ScreenHeader` (título 17 px +
subtítulo en gris). Además, el historial de recibos vivía en una pestaña
separada segundo plano, y el acento de la barra de progreso seguía el preset de
Ajustes (se veía amarillo con "Amarillo vibrante" / "Naranja atardecer").

## Alcance

**Dentro**
- Cabecera única `ScreenHeader` con título y subtítulo ("Detalles de tu plan actual").
- Eliminación del `SegmentedControl` y de la lógica de pestañas (`?tab=pagos`).
- Historial de recibos como tarjeta al final de la página, bajo los detalles.
- Tarjetas del periodo y de detalles con el padding de las tarjetas de rutinas.
- Acento de la pantalla fijo en rojo/coral.

**Fuera**
- Cambios en `paymentsService` / `membershipsService` o en la base de datos.
- Exportar recibos a PDF (eso es de la vista de staff).
- Eliminar el componente `SegmentedControl` (queda disponible como molécula).

## Decisiones

- **Cabecera**: `ScreenHeader title="Mi membresía" subtitle="Detalles de tu plan actual"`,
  idéntico a `Inicio` (`ScreenHeader` + `PageContainer`) y a `Entrenamiento`
  (`ScreenHeader` con acciones). Sin acciones: esta vista no tiene alta propia.
- **Skeleton en vez de spinner**: la carga se muestra con tres tarjetas
  `skeleton` dentro del `PageContainer`, como Inicio y Entrenamiento, en lugar
  del `LoadingSpinner` a pantalla completa que ocultaba la cabecera.
- **Radios y padding del sistema**: las tarjetas usan `rounded-card` + `p-5`,
  exactamente como las tarjetas de rutinas (`MyRoutines`). El brief pedía
  `rounded-[24px]`, un valor fuera de la escala iOS del proyecto
  (`knowledge/local/14_ios_radius_scale_decisions.md`): se usa `rounded-card`
  (28 px) para no introducir un radio huérfano.
- **`bg-surface` en vez de `bg-zinc-900`**: mismo color (`#18181b`) pero por
  token, así la tarjeta respeta el tema claro.
- **Acento fijo rojo/coral**: la fecha de vencimiento, el porcentaje, la barra
  del periodo, los glows decorativos y los iconos del recibo usan `text-red` /
  `bg-red` / `bg-red-bg` y `var(--color-red)` (#ef4444, equivalente a
  `red-500`). La barra ya **no** cambia a ámbar a los 7 días: la urgencia la
  comunica el aviso superior.
- **Ámbar solo donde es semántico**: el aviso "Vence en N días" y los estados de
  pago "Pendiente" lo conservan porque comunican estado, no marca.
- **Historial de recibos integrado**: una sola tarjeta con el resumen
  (`N recibos · $total pagado`) y una fila por recibo que abre el modal de
  comprobante. Se eliminan las dos `MetricCard` y la tarjeta "Último pago": el
  primer recibo de la lista ya es el último pago y el modal da el detalle.
- **Historial de membresías corregido**: la lista de anteriores excluye la
  membresía vigente (antes la mostraba como "Cancelada" cuando había más de una).
- **Deep link conservado**: `/my-payments` ahora redirige a
  `/my-membership#pagos` y la página hace `scrollIntoView` de la tarjeta de
  recibos. Era la única referencia externa a la pestaña eliminada.

## Archivos Afectados
- `src/pages/member/MyMembership.tsx` (reescrito)
- `src/App.tsx` (redirección `/my-payments`)

## Implementación
- [x] `ScreenHeader` + subtítulo, sin `h1` propio ni pestañas
- [x] Sección de pagos integrada como tarjeta con filas clicables → modal de recibo
- [x] Tarjetas del periodo/detalles con `rounded-card p-5`
- [x] Rojo/coral fijo en progreso, vencimiento y recibos
- [x] Skeletons de carga y `#pagos` con scroll automático
- [x] Historial de membresías sin la vigente

## Criterios de Aceptación
- [x] La cabecera se ve igual que en Inicio y Entrenamiento (título + subtítulo gris).
- [x] No existen los botones de pestaña "Mi membresía" / "Pagos".
- [x] Los recibos aparecen en la misma pantalla, debajo de los detalles, y abren el comprobante.
- [x] La barra del periodo y el porcentaje son rojo/coral aunque el acento guardado sea otro.
- [x] Las tarjetas del periodo y de detalles usan el mismo padding/radio que las de rutinas.
- [x] `npm run build` y `npm run lint` pasan sin errores.
- [ ] Validación visual con sesión de miembro (con y sin membresía, con y sin pagos).

## Evidencia

**Fecha**: 2026-11-02
**Probado por**: Agente (build/lint); validación visual pendiente
**Resultado**:
- `npm run build` ✓ 10.8 s · `npm run lint` (`--max-warnings 0`) ✓ sin salida.
- `grep accent|amber` en `MyMembership.tsx`: solo quedan usos semánticos
  (`text-amber-text` del aviso de vencimiento y del estado "Pendiente").
- `--color-red` está emitido en el CSS compilado, así que los
  `radial-gradient(... var(--color-red) ...)` resuelven en runtime.
- Sin referencias a `tab=pagos` en el código.
**Commit**: `refactor(memberships): layout unificado y recibos integrados (#TKT-OMEGYM-052)`
