# TKT-OMEGYM-049: Exportar pagos — rango de meses y PDF con vista previa

## Metadata
- **Tipo**: Feature (UI + exportación)
- **Prioridad**: Media
- **Estado**: Closed
- **Módulo**: payments
- **Relacionado con**: `SPECIFICATION.md` (§11.3 Membresías y Pagos)
- **Ticket Externo**: — (solicitud directa del dueño del proyecto)
- **Fecha apertura**: 2026-10-30
- **Fecha cierre**: 2026-10-30

## Descripción

Flujo de exportación a PDF desde la pantalla de Pagos. Evolución del alcance:

1. **v1** — sólo maquetación con rango de fechas (Desde/Hasta). Descartado.
2. **v2** — un solo mes. Descartado: el negocio pidió rangos.
3. **v3** — rango de meses con tabla dibujada a mano con `doc.text`.
4. **v4 (actual)** — mismo rango, pero el reporte se rediseña con
   **`jspdf-autotable`**: cabecera coral, cifras alineadas a la derecha,
   tarjetas de resumen y colores por estado.

## Alcance

**Dentro**
- Botón de descarga en la cabecera (junto al de opciones).
- Hoja con dos filas de mes (Desde / Hasta) separadas por una línea sutil.
- Validación: si «Desde» > «Hasta», mensaje y botón deshabilitado.
- Consulta de los pagos del periodo y PDF con resumen y tabla.
- PDF: cabecera de marca, tarjetas de métricas, tabla con aire y colores por estado.
- Escritorio: vista previa en pestaña nueva. Móvil: descarga directa.

**Fuera**
- Envío por correo, compartir nativo, CSV.
- Filtros por estado o método dentro del reporte.

## Diseño del PDF

| Elemento | Implementación |
|---|---|
| Cabecera | «Omega Gym» 18 pt bold, «REPORTE DE PAGOS» y `Periodo: …` en gris 9.5 pt, línea coral de 0.8 mm |
| Métricas | Tres tarjetas `roundedRect` con relleno `[245,245,245]`, etiqueta 7.5 pt gris y monto 13.5 pt bold |
| Separación | `startY = tarjetas + 12 mm` (aire entre cifras y tabla) |
| Cabecera de tabla | `headStyles: { fillColor: [255,79,79], textColor: 255, fontStyle: 'bold' }` |
| Aire | `cellPadding: { top: 6, right: 3, bottom: 6, left: 3 }` |
| Monto | `columnStyles[5].halign: 'right'` + `didParseCell` fuerza `halign: 'right'` en la cabecera |
| Zebra | `didParseCell` pinta filas impares con `[250,250,250]` (`theme: 'plain'`) |
| Estado | Pagado `[21,128,61]`, Pendiente `[194,65,12]`, Cancelado `[185,28,28]`, en bold |

## Decisiones

- **`bg-surface` (#18181b)** en el panel = `bg-zinc-900` del brief, respetando
  `[data-theme="light"]`. Título en `text-text`, subtítulo en `text-text-2`.
- **Sin morado**: «Exportar» usa `bg-accent` + `text-accent-contrast` (píldora),
  «Cancelar» `text-accent`.
- **Dos `MonthPicker` en `variant="list"`** dentro de `bg-surface2` (zinc-800) +
  `rounded-[24px]`, separados por `border-surface3` (zinc-700).
- **Comparación por índice de mes** (`year * 12 + month`): exacta, sin zonas
  horarias y cubre el cambio de año.
- **`rangeBounds` como única fuente**: alimenta la consulta, el título y el
  nombre del archivo.
- **`periodLabel`**: «Octubre 2026» si los extremos coinciden;
  «Enero 2026 - Diciembre 2026» si no.
- **autoTable en import dinámico** junto con jspdf: chunks aparte (399 kB +
  30 kB) que sólo se descargan al exportar.
- **`cellPadding` asimétrico** (mm, porque el documento usa `unit: 'mm'`): 6 mm
  arriba/abajo para dar aire entre filas (lo que pedía el brief) y 3 mm a los
  lados. Con 6 mm en las cuatro direcciones, «ESTADO» y «Pagado» se partían en
  dos líneas («ESTAD» / «O»). Un mes de ~30 pagos ocupa 3 páginas y 80 filas
  llegan a 6.
- **Ventana de vista previa abierta antes del `await`** para que el navegador no
  la bloquee; se cierra si no hay pagos o si falla.
- **Limpieza**: `URL.revokeObjectURL(url)` a los 60 s.

## Archivos Afectados
- `src/lib/payments-pdf.ts`
- `src/pages/dashboard/Payments.tsx`
- `src/components/ui/molecules/MonthPicker.tsx` (`variant="list"`, `label`)
- `package.json` (`jspdf` 4.2.1, `jspdf-autotable` 5.0.9)

## Implementación
- [x] Botón de exportar en la cabecera
- [x] Hoja con fondo oscuro, título blanco y subtítulo «Selecciona el rango de meses»
- [x] Filas «Desde» y «Hasta» con `MonthPicker`, separadas por línea sutil
- [x] Validación de rango con mensaje y botón deshabilitado
- [x] Cálculo primer día / último día del periodo
- [x] Consulta de los pagos del periodo (hasta 1000 filas)
- [x] Tabla con autoTable: cabecera coral, padding 6, monto a la derecha
- [x] Tarjetas de resumen con fondo claro y montos grandes
- [x] Colores condicionales por estado en `didParseCell`
- [x] Escritorio: blob + pestaña nueva; móvil: `doc.save()`
- [x] `URL.revokeObjectURL` diferido
- [x] Fallback a descarga si el navegador bloquea la pestaña

## Criterios de aceptación
- [x] El modal tiene dos filas de mes, no de fecha.
- [x] Si «Desde» > «Hasta», aparece el error y «Exportar» se deshabilita.
- [x] El PDF filtra del 01 del mes inicial al último día del mes final.
- [x] El subtítulo muestra «Periodo: Enero 2026 - Diciembre 2026».
- [x] La cabecera de la tabla es coral con texto blanco (sin gris genérico).
- [x] La columna MONTO está alineada a la derecha, incluida su cabecera.
- [x] Las métricas están en tarjetas con fondo claro y hay aire antes de la tabla.
- [x] «Pagado» sale en verde y «Pendiente» en naranja.
- [x] Escritorio abre pestaña; móvil descarga.
- [ ] Prueba manual en navegador (escritorio y móvil reales).

## Evidencia

**Fecha**: 2026-10-30
**Probado por**: Dev asistido por IA
**Entorno**: build local + generación headless con Node

| Verificación | Resultado |
|---|---|
| `tsc --noEmit -p tsconfig.app.json` | ✅ sin errores |
| `eslint src/lib/payments-pdf.ts` | ✅ sin errores |
| `npm run build` | ✅ 7.40 s, chunks `jspdf` (399 kB) y `autotable` (30 kB) |
| `rangeBounds(2026, 0, 2026, 11)` | ✅ `2026-01-01` → `2026-12-31` |
| `periodLabel` (mismo mes / rango) | ✅ `Octubre 2026` / `Enero 2026 - Diciembre 2026` |
| Nombre de archivo | ✅ `omega-pagos-2026-01_a_2026-12.pdf` |
| PDF 80 pagos (ene–dic) | ✅ válido, 6 páginas, 108 257 bytes |
| PDF 3 pagos (oct) | ✅ válido, 1 página, 11 472 bytes |
| Etiquetas de cabecera y estados completas (sin cortes) | ✅ 15/15 |
| Colores en el flujo del PDF | ✅ coral `1 .31 .31`, verde `0.082 0.502 0.239`, naranja `0.761 0.255 0.047`, tarjetas `0.96 g` |

**Commit**: —

## Notas
- `buildPaymentsDoc` se exporta para generar el PDF en pruebas sin DOM.
- El pie de página se dibuja después de `autoTable` recorriendo las páginas.
- Errores de lint restantes en `Payments.tsx` son preexistentes y estructurales.
