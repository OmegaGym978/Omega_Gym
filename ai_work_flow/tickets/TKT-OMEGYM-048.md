# TKT-OMEGYM-048: Pagos — integración al diseño inset grouped y navegación por mes

## Metadata
- **Tipo**: Refactoring (UI/UX)
- **Prioridad**: Media
- **Estado**: Review
- **Módulo**: payments
- **Relacionado con**: `SPECIFICATION.md` (§11.3 Membresías y Pagos, §14 Componentes)
- **Ticket Externo**: — (solicitud directa del dueño del proyecto)
- **Fecha apertura**: 2026-10-30
- **Fecha cierre**: —

## Descripción

La pantalla de Pagos tenía un navegador de mes con texto flotante
(`< Octubre De 2026 >`), un buscador y filtros apilados en dos filas, KPIs con
el monto coloreado y el menú hamburguesa en la cabecera. Se integra al diseño
móvil nativo del resto de la app.

## Auditoría previa

| Punto | Hallazgo |
|---|---|
| Color púrpura | **No existe en `Payments.tsx`**: cero clases `purple-*` y cero `#a855f7`. El filtro activo usa `bg-accent`. El único morado posible es el **preset de acento `violet`** guardado en `localStorage` (`accent.store.ts:20`), no un color de la pantalla. |
| Fondo oscuro | Ya era `--color-bg: #000000` en tema oscuro. |
| KPIs | `MetricCard` ya usaba `bg-surface` + `rounded-[24px]`, pero pintaba el monto con el color semántico. |
| Navegador de mes | Texto + dos chevrons inline, sin forma de saltar a un mes concreto. |
| Buscador | `bg-surface2 rounded-full`, en fila propia. |
| Menú hamburguesa | `ScreenHeader` lo muestra por defecto al staff (`menu ?? (isStaff && !back)`). `/payments` es **solo admin** (`App.tsx`) y Pagos está en el `more` del Bottom Tab Bar, así que la hamburguesa es redundante. |

## Decisiones

- **Acento por token** (`bg-accent` / `text-accent`): no se fija coral literal.
  Si se ve morado, es el preset "Morado brillante" de Ajustes → Color de acento;
  cambiarlo a "Rojo coral" lo corrige en toda la app.
- **Monto en blanco** con `neutralValue` en `MetricCard`; el color queda sólo en
  el icono.
- **`MonthPicker`** nuevo (contrato `(year, month)`) en lugar de reutilizar
  `DatePicker` (contrato `YYYY-MM-DD`): Pagos filtra por mes completo.
- **`PickerPopup`** extraído de `DatePicker` para compartir portal, backdrop y
  el manejo de Escape en `window` capture; `MonthPicker` lo reutiliza.
- **Scroll horizontal con `.no-scrollbar`**: utilidad nueva en `index.css`; el
  buscador mantiene ancho fijo en móvil y crece en escritorio.
- **`menu={false}`** en la cabecera: la ruta es admin-only y accesible desde el
  tab "Más".
- **Menú de opciones** (tres puntos) con acciones reales: mes actual, recargar y
  limpiar filtros. No se inventaron funciones que no existen.

## Archivos Afectados
- `src/pages/dashboard/Payments.tsx`
- `src/components/ui/molecules/MonthPicker.tsx` (nuevo)
- `src/components/ui/molecules/PickerPopup.tsx` (nuevo)
- `src/components/ui/molecules/DatePicker.tsx` (usa `PickerPopup`)
- `src/components/ui/molecules/SearchInput.tsx` (`variant`)
- `src/components/ui/molecules/TabBar.tsx` (`className`)
- `src/components/ui/atoms/MetricCard.tsx` (`neutralValue`)
- `src/lib/icons.tsx` (`IconChevronDown`, `IconDots`, `IconRefresh`)
- `src/index.css` (`.no-scrollbar`)

## Implementación
- [x] Cabecera sin hamburguesa + botón de opciones arriba a la derecha
- [x] KPIs con monto blanco y color sólo en el icono
- [x] Píldora `Octubre 2026` con chevron que abre el calendario de meses
- [x] Botones circulares de mes anterior / siguiente
- [x] Buscador + filtros en una sola fila con scroll horizontal sin barra
- [x] Buscador `bg-surface` + `rounded-xl`
- [x] Menú de opciones (mes actual / recargar / limpiar filtros)
- [x] Contenedor de la tabla con `rounded-[24px]`
- [x] `npm run build` OK

## Criterios de aceptación
- [x] No hay texto de mes duplicado en la cabecera ni flotando en la fila.
- [x] La píldora muestra `Mes Año` y abre el popup de meses.
- [x] El mes seleccionado se marca en acento; el mes actual en texto acento.
- [x] Los chevrons circulares cambian de mes y reinician la paginación.
- [x] Buscador y píldoras comparten fila con scroll horizontal en móvil.
- [x] Los montos de los KPI son blancos.
- [x] No aparece la hamburguesa en Pagos.
- [x] Ningún color púrpura propio de la pantalla.
- [ ] Prueba visual en navegador (móvil 390px y escritorio).

## Evidencia

**Fecha**: 2026-10-30
**Probado por**: Dev asistido por IA
**Entorno**: build local

| Verificación | Resultado |
|---|---|
| `tsc --noEmit -p tsconfig.app.json` | ✅ sin errores |
| `npm run build` | ✅ 7.87 s |
| `eslint` sobre los archivos nuevos | ✅ sin errores |
| `.no-scrollbar`, `.rounded-xl`, `.rounded-[24px]`, `.bg-surface`, `.bg-accent` en el CSS | ✅ presentes |
| Errores de lint restantes en `Payments.tsx` | ⚠️ 3 preexistentes (`catch (e: any)`, setState en efecto de preview, dep `cache`) |

**Commit**: —

## Notas
- El icono de tres puntos es `IconDots`; el chevron de la píldora es
  `IconChevronDown`. Ambos quedan reutilizables.
- `DatePicker` se refactorizó sobre `PickerPopup` en este mismo ticket: mismo
  comportamiento, menos duplicación.
