# 19_date_picker_decisions.md

## Decisión: Date Picker propio en lugar de `<input type="date">`

**Fecha**: 2026-10-30
**Contexto**: Omega Gym — Dashboard → Membresías
**Autor**: Dev asistido por IA

### Problema

El alta y la edición de membresías usaban `<input type="date">`. El popup que
se abre al pulsarlo lo dibuja el navegador: día seleccionado en azul con
esquinas cuadradas, "Borrar" y "Hoy" en azul, flechas del sistema. Ese popup
**no es estilizable por CSS**, así que no puede adoptar el diseño móvil nativo
del proyecto ni respetar el acento configurable.

### Opciones Evaluadas

#### Opción 1: Instalar `react-day-picker` + `date-fns`
**Pros**:
- ✅ Componente maduro, accesible, con navegación y rangos.
- ✅ Menos código que escribir.

**Contras**:
- ❌ Dos dependencias nuevas para usar ~10% de su API.
- ❌ Su CSS parte de estilos propios que habría que sobrescribir por completo.
- ❌ El proyecto no tiene ninguna librería de fechas y `bundle` ya supera 500 kB.

#### Opción 2: Componente propio con `Date` nativo
**Pros**:
- ✅ Cero dependencias.
- ✅ Control total del estilo con los tokens del tema.
- ✅ Se ajusta al patrón de hojas/átomos existente.

**Contras**:
- ❌ Hay que escribir la cuadrícula, la navegación y la accesibilidad.

### Decisión Final
**Selección**: Opción 2 — `src/components/ui/molecules/DatePicker.tsx`.

**Razones**:
1. El proyecto ya resuelve toda la UI con componentes propios; una librería
   rompería la consistencia visual.
2. Sólo se necesita seleccionar un día suelto: no hay rangos ni recurrencia.
3. Evita sumar dependencias a un bundle ya grande.

### Detalles técnicos que hay que recordar

**Mapeo de color (nunca valores crudos)**

| Valor de diseño | Token | Dark / Light |
|---|---|---|
| `bg-zinc-900` | `bg-surface` | `#18181b` / `#ffffff` |
| `text-zinc-400` | `text-text-2` | `#a1a1aa` / `#52525b` |
| blanco | `text-text` | `#fafafa` / `#09090b` |
| azul de selección | `bg-accent` + `text-accent-contrast` | coral `#FF4F4F` / `#ffffff` |

Usar `zinc-*` o `blue-*` literales rompe `[data-theme="light"]` y deja de seguir
el acento que el usuario elija en Ajustes.

**Portal obligatorio**

El panel de `BottomSheet` anima con `transform` (`animate-sheet-in`). Un
`position: fixed` dentro de un ancestro transformado se posiciona respecto al
ancestro, no al viewport. El popup se monta con
`createPortal(..., document.body)` y `z-[95]`, por encima del `z-[80]` de la
hoja.

**Escape sin cerrar la hoja padre**

`BottomSheet` registra `keydown` en `document` con `capture: true` y cierra la
hoja. Como los listeners del mismo target se ejecutan en orden de registro, el
picker no puede ganar ahí: registra el suyo en **`window`** con capture (se
ejecuta antes) y llama `stopPropagation()`.

**Clases de color mutuamente excluyentes**

No concatenar `text-text` + `text-text-4`: con la misma especificidad gana el
orden del CSS generado, no el orden en el atributo `class`. Calcular una sola
cadena de tono por celda.

**Semana domingo primero**

`src/lib/dates.ts` define `DAY_LABELS` de lunes a domingo y `MyCheckins` pinta
de domingo a sábado. El DatePicker usa domingo primero (`do, lu, ma…`), que es
la convención del calendario de iOS. Si se unifica el criterio, hay que tocar
los tres a la vez.

### Aplicación
- Ticket: TKT-OMEGYM-047
- Archivos: `src/components/ui/molecules/DatePicker.tsx`,
  `src/lib/icons.tsx`, `src/pages/dashboard/Memberships.tsx`
- Cualquier selector de fecha futuro (`Payments`, filtros de reportes) debe
  reutilizar este componente en lugar de un `<input type="date">`.
