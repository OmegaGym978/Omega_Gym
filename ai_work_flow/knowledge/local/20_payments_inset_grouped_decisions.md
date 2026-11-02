# 20_payments_inset_grouped_decisions.md

## Decisión: Pagos como lista inset grouped con navegación por mes

**Fecha**: 2026-10-30
**Contexto**: Omega Gym — Dashboard → Pagos (TKT-OMEGYM-048)
**Autor**: Dev asistido por IA

### Problema

La pantalla de Pagos acumulaba patrones de web de escritorio: navegador de mes
como texto flotante, buscador y filtros en dos filas, montos coloreados y menú
hamburguesa en la cabecera, aunque la navegación principal ya vive en el Bottom
Tab Bar.

### Opciones Evaluadas

#### Opción 1: Reutilizar `DatePicker` para elegir el mes
**Pros**:
- ✅ Un solo componente de calendario.
**Contras**:
- ❌ Su contrato es `YYYY-MM-DD`; Pagos necesita `(año, mes)`.
- ❌ Obligaría a "elegir un día cualquiera" para cambiar de mes: confuso.

#### Opción 2: `MonthPicker` propio sobre un `PickerPopup` compartido
**Pros**:
- ✅ Contrato limpio `(year, month)`.
- ✅ Reutiliza portal, backdrop y Escape de `DatePicker`.
- ✅ Sigue el mismo lenguaje visual (tokens, acento, radios).
**Contras**:
- ❌ Un componente más.

### Decisión Final
**Selección**: Opción 2.

### Detalles

**Sobre el "púrpura" del filtro activo**

En `Payments.tsx` nunca hubo púrpura: el chip activo usa `bg-accent`. El morado
sólo puede venir del preset de acento `violet`
(`accent.store.ts:20`, persistido en `localStorage['omega-gym-accent']`).
Regla: la UI consume `bg-accent` / `text-accent`, nunca un hex. Si un mockup
pide "coral estricto", se cambia el preset en Ajustes, no el componente; fijar
`#FF4F4F` en la pantalla rompería el sistema de acento del resto de la app.

**Montos neutros**

`MetricCard` acepta `neutralValue` para dejar el número en `text-text` y
conservar el color semántico sólo en el icono. Las demás pantallas siguen con el
comportamiento anterior porque el valor por defecto es `false`.

**Administrar la cabecera**

`ScreenHeader` muestra la hamburguesa al staff por defecto. Se apaga con
`menu={false}` sólo donde la ruta es alcanzable desde el Bottom Tab Bar. Antes de
apagarla hay que comprobar dos cosas: que el rol que entra a la ruta tenga el
destino en `nav-config.ts` (`tabs` o `more`) y que la ruta esté protegida para
ese rol en `App.tsx`.

**Scroll horizontal sin barra**

`.no-scrollbar` vive en `index.css` y se combina con
`-mx-4 px-4` para que la fila sangre hasta los bordes en móvil. El buscador debe
llevar ancho fijo con `shrink-0` (si usa `flex-1` no se puede desplazar) y
`TabBar` recibe `overflow-visible` para que el scroll lo haga el contenedor y no
la barra.

### Aplicación
- Ticket: TKT-OMEGYM-048
- Archivos: `src/pages/dashboard/Payments.tsx`,
  `src/components/ui/molecules/MonthPicker.tsx`,
  `src/components/ui/molecules/PickerPopup.tsx`
- Cualquier pantalla que filtre por mes debe usar `MonthPicker`, no `DatePicker`.

---

## Addendum (2026-10-30): exportación a PDF del periodo

**Rango de meses, no de fechas.** El brief evolucionó de un rango de fechas a un
rango de meses: dos filas «Desde»/«Hasta» con `MonthPicker` y el PDF va del
**primer día del mes inicial** al **último día del mes final**. Un rango de
fechas obligaba a dos calendarios de día y a validar `desde <= hasta` en días;
con meses alcanza una comparación de índices.

**Comparar meses, no fechas.** La validación usa `year * 12 + month`. Comparar
strings `YYYY-MM` funciona, pero el índice es explícito y no depende del formato
de entrada.

**Una sola fuente para el rango.** `rangeBounds(fromYear, fromMonth, toYear,
toMonth)` calcula los extremos y lo usan la consulta, el título del PDF y el
nombre del archivo. Si se calculara por separado, un cambio futuro en el filtro
podría dejar el PDF mostrando un periodo distinto al consultado.

**jspdf entra con import dinámico.** `await import('jspdf')` dentro de
`src/lib/payments-pdf.ts` deja el paquete en un chunk aparte (399 kB) que sólo
se descarga al exportar. Importarlo arriba habría engordado el bundle inicial,
que ya supera los 500 kB.

**El bloqueador de pestañas rompe el `window.open` tardío.** Si se llama después
de `await` (consulta + generación), el navegador ya no lo considera un gesto del
usuario y lo bloquea. Solución: abrir la pestaña en blanco dentro del handler
del clic (`window.open('', '_blank')`), pasarla a `exportPaymentsPdf` y
asignarle `location.href` cuando el blob esté listo. Si el navegador la bloquea
(`null`) o no hay pagos, se cierra y se cae a `doc.save()`.

**Ciclo de vida del blob.** `URL.createObjectURL` mantiene el PDF en memoria
mientras el visor lo carga; revocarlo de inmediato deja una pestaña en blanco.
Se libera con `setTimeout(..., 60_000)`.

**Detección de dispositivo.** `window.innerWidth >= 768` como pidió el brief.
Es suficiente para este caso, pero si algún día hay tablets con visor limitado,
convendrá moverlo a un hook con `matchMedia` y un fallback por user-agent.

**Prueba sin navegador.** `buildPaymentsDoc` se exporta y se ejecuta con
`node --experimental-strip-types`, generando el PDF real. Fue lo que permitió
verificar el salto de página (con la tabla manual, 80 filas daban 3 páginas) y
el periodo impreso sin poder iniciar sesión en la app.

---

## Addendum 2 (2026-10-30): reporte PDF con autoTable

**Tabla dibujada a mano → `jspdf-autotable`.** La versión anterior calculaba
coordenadas y cortaba texto con `doc.getTextWidth`; cada columna nueva era
código nuevo y el salto de página se gestionaba a mano. `autoTable` resuelve
paginación, cabecera repetida y ajuste de texto. Añade 30 kB al chunk de
exportación (que ya carga 399 kB de jspdf), así que el coste es marginal.

**`cellPadding` está en unidades del documento.** Con `unit: 'mm'`, un
`cellPadding: 6` son **6 mm por celda**, no 6 pt. Y si se aplica a los cuatro
lados, el ancho útil de cada columna se reduce 12 mm: con 22 mm de columna,
«ESTAD» y «O» se partían en dos líneas. La solución es asimétrico —
`{ top: 6, right: 3, bottom: 6, left: 3 }` — que da el aire vertical buscado sin
romper el texto. 80 filas → 6 páginas.

**Verificar el PDF generado, no sólo que compile.** Los cortes de palabra no
aparecen en el código ni en `tsc`: se detectaron leyendo el flujo de contenido
del PDF y comprobando que «ESTADO» y «Pagado» figuraran como cadenas completas.
Con jsPDF sin compresión los textos y los operadores `rg`/`g` son legibles
directamente en el archivo.

**La cabecera coral va en `headStyles`, no en `styles`.** `styles` aplica a
cuerpo y cabecera; si se pone `fillColor` ahí, toda la tabla queda rellena.
`theme: 'plain'` no dibuja líneas ni zebra, por eso la alternancia se pinta en
`didParseCell` (`data.row.index % 2 === 1`).

**Alinear el monto en la cabecera también.** `columnStyles[5].halign` alinea el
cuerpo, pero para la cabecera se fuerza en `didParseCell` con
`data.cell.styles.halign = 'right'`. Sin eso, el título «MONTO» queda a la
izquierda sobre una columna de cifras a la derecha.

**Colores por estado en `didParseCell`.** Se compara `String(data.cell.raw)`
contra las etiquetas visibles (`Pagado` / `Pendiente` / `Cancelado`), no contra
el valor crudo de la base (`paid`…), porque la tabla ya se construye con las
etiquetas traducidas. Si se cambian las etiquetas, hay que cambiar el hook.

**El resumen son tarjetas, no texto suelto.** `doc.roundedRect(..., 'F')` con
relleno `[245,245,245]` y `startY` de la tabla 12 mm por debajo de las tarjetas.
Tres columnas de ancho `(contenido - 2*gap) / 3`; con más métricas hay que
recalcular el ancho, no sumar tarjetas a lo ancho.



