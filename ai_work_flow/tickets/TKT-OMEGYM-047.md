# TKT-OMEGYM-047: Date Picker propio con diseño iOS

## Metadata
- **Tipo**: Refactoring (UI)
- **Prioridad**: Media
- **Estado**: Review
- **Módulo**: memberships
- **Relacionado con**: `SPECIFICATION.md` (§14 Estrategia de Componentes)
- **Ticket Externo**: — (solicitud directa del dueño del proyecto)
- **Fecha apertura**: 2026-10-30
- **Fecha cierre**: —

## Descripción

El selector de fecha era el `<input type="date">` nativo. Su popup (día
seleccionado en azul con esquinas cuadradas, "Borrar" y "Hoy" en azul, cabecera
con flechas del sistema) **lo dibuja el navegador y no es estilizable**: en
`src/` no había ni una clase `blue-*` ni `#3b82f6`, así que el azul no venía de
la app.

Se reemplaza por un componente propio con el diseño móvil nativo del proyecto.

## Auditoría previa

| Punto | Hallazgo |
|---|---|
| Componentes de fecha existentes | Ninguno (`DatePicker`, `Calendar`, `DayPicker` no existían) |
| Inputs nativos | 3, todos en `Memberships.tsx` (alta + inicio/vencimiento de edición) |
| Librerías de fecha | Ninguna instalada (sin react-day-picker, date-fns, dayjs…) |
| Botones "Borrar"/"Hoy" | No existían; eran parte del popup nativo |
| Chevrions | `IconChevronLeft/Right` no existían (había polylines inline duplicados) |
| Azul en el código | Cero; sólo el preset de acento `blue` (`accent.store.ts`) |
| `.animate-picker-in` | Ya existía en `index.css` y estaba sin uso |

## Decisiones

- **Tokens en vez de valores crudos**: `bg-zinc-900` → `bg-surface` (#18181b),
  `text-zinc-400` → `text-text-2` (#a1a1aa), blanco → `text-text`. Con valores
  fijos el popup rompería `[data-theme="light"]`.
- **Acento por token**: `bg-accent` + `text-accent-contrast`, no `#FF4F4F`
  fijo, para que el calendario siga al acento elegido en Ajustes (coral por
  defecto).
- **Portal**: el panel de `BottomSheet` anima con `transform`; un `fixed`
  anidado se posicionaría respecto al panel. El popup se monta en
  `document.body` con `createPortal`.
- **Escape en `window` (capture)**: `BottomSheet` escucha `keydown` en
  `document` (capture) y cerraría también la hoja. El picker se registra antes
  y corta la propagación.
- **Semana domingo → sábado** (`do, lu, ma…`), como el calendario de iOS.
- **Sin restricción de fechas pasadas** por defecto; los props `min`/`max`
  quedan disponibles.
- **"Borrar" vacía la fecha** y deja `Guardar` deshabilitado por la validación
  existente.
- **Días de otros meses** en blanco (no se muestran ni son clicables).

## Dependencias
- **Bloqueado por**: —
- **Bloquea a**: —

## Archivos Afectados
- `src/components/ui/molecules/DatePicker.tsx` (nuevo)
- `src/lib/icons.tsx` (`IconChevronLeft`, `IconChevronRight`)
- `src/pages/dashboard/Memberships.tsx`
- `ai_work_flow/knowledge/local/19_date_picker_decisions.md` (nuevo)

## Implementación
- [x] Iconos de chevron reutilizables
- [x] Componente `DatePicker` sin dependencias
- [x] Popup con fondo `bg-surface`, `rounded-[24px]` y `p-4`
- [x] Cabecera mes/año en blanco negrita + chevrons
- [x] Días de la semana en `text-text-2` (zinc-400)
- [x] Día seleccionado: círculo `rounded-full` con acento
- [x] Día actual sin seleccionar: texto en acento
- [x] "Borrar" y "Hoy" en acento (sin azul)
- [x] Portal y manejo de Escape
- [x] `aria-modal`, `aria-label`, `aria-pressed`, `aria-current`
- [x] Reemplazados los 3 inputs nativos
- [x] `npm run build` OK

## Criterios de aceptación
- [x] No queda ningún `<input type="date">` en `src/`.
- [x] El calendario se abre por encima de la hoja de "Nueva membresía".
- [x] Escape cierra el calendario sin cerrar la hoja padre.
- [x] El día seleccionado es un círculo con el acento (coral por defecto).
- [x] "Hoy" selecciona la fecha actual; "Borrar" deja la fecha vacía.
- [x] Ningún tono azul fuera del preset de acento.
- [ ] Prueba visual en navegador (tema oscuro, tema claro y un preset distinto).

## Evidencia

**Fecha**: 2026-10-30
**Probado por**: Dev asistido por IA
**Entorno**: build local (`npm run build`)

| Verificación | Resultado |
|---|---|
| `tsc --noEmit -p tsconfig.app.json` | ✅ sin errores |
| `npm run build` | ✅ 7.26 s |
| `<input type="date">` restantes en `src/` | ✅ 0 |
| CSS generado: `z-index:95`, `border-radius:24px`, `.bg-accent`, `.text-accent-contrast`, `.animate-picker-in` | ✅ presentes |
| `#0a84ff` en el bundle | ✅ sólo dentro de `[data-accent=blue]` |

**Commit**: —

## Notas
- `MyCheckins.tsx` tiene un calendario de **sólo lectura** que ya usa
  `bg-accent`; no se tocó.
- Los chevrons inline de `Payments.tsx`, `ScreenHeader.tsx` y `ListTile.tsx`
  siguen duplicados; migrarlos a `IconChevronLeft/Right` es trabajo aparte.
