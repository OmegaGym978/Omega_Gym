import type { PaymentListItem } from '@/services/payments.service'

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
] as const

const METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
}

const STATUS_LABELS: Record<string, string> = {
  paid: 'Pagado',
  pending: 'Pendiente',
  cancelled: 'Cancelado',
}

/** Paleta del reporte (RGB). */
const C = {
  ink: [24, 24, 27] as const,
  muted: [113, 113, 122] as const,
  card: [245, 245, 245] as const,
  zebra: [250, 250, 250] as const,
  accent: [255, 79, 79] as const,
  paid: [21, 128, 61] as const,
  pending: [194, 65, 12] as const,
  cancelled: [185, 28, 28] as const,
}

/** Primer y último día del mes, en `YYYY-MM-DD`. */
export function monthBounds(year: number, month: number): { from: string; to: string } {
  const mm = String(month + 1).padStart(2, '0')
  const lastDay = new Date(year, month + 1, 0).getDate()
  return {
    from: `${year}-${mm}-01`,
    to: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
  }
}

/** Rango completo: primer día del mes inicial → último día del mes final. */
export function rangeBounds(
  fromYear: number,
  fromMonth: number,
  toYear: number,
  toMonth: number
): { from: string; to: string } {
  return {
    from: monthBounds(fromYear, fromMonth).from,
    to: monthBounds(toYear, toMonth).to,
  }
}

function monthTitle(year: number, month: number): string {
  const name = MONTH_NAMES[month] ?? ''
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`
}

/** «Octubre 2026» o «Enero 2026 - Diciembre 2026». */
export function periodLabel(
  fromYear: number,
  fromMonth: number,
  toYear: number,
  toMonth: number
): string {
  const start = monthTitle(fromYear, fromMonth)
  const end = monthTitle(toYear, toMonth)
  return start === end ? start : `${start} - ${end}`
}

export function paymentsPdfFilename(
  fromYear: number,
  fromMonth: number,
  toYear: number,
  toMonth: number
): string {
  // Nombre legible para el usuario final (y para el gestor de descargas del SO):
  // «Reporte_Pagos_Noviembre_2026.pdf» en lugar de un Blob UUID.
  const start = monthTitle(fromYear, fromMonth).replace(' ', '_')
  const end = monthTitle(toYear, toMonth).replace(' ', '_')
  return start === end
    ? `Reporte_Pagos_${start}.pdf`
    : `Reporte_Pagos_${start}_a_${end}.pdf`
}

/**
 * Logo de marca en data URL para `doc.addImage`. Se cachea en memoria: el
 * archivo vive en `public/brand/` y se pide una sola vez por sesión.
 * Devuelve `null` si el asset no está disponible (el reporte nunca se rompe).
 */
let cachedLogo: string | null | undefined

async function loadLogoDataUrl(): Promise<string | null> {
  if (cachedLogo !== undefined) return cachedLogo
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}brand/omega-logo.png`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    cachedLogo = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
  } catch {
    cachedLogo = null
  }
  return cachedLogo
}

function money(value: number): string {
  return `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function shortDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y.slice(2)}`
}

interface ReportInput {
  fromYear: number
  fromMonth: number
  toYear: number
  toMonth: number
  payments: PaymentListItem[]
}

export async function buildPaymentsDoc({
  fromYear,
  fromMonth,
  toYear,
  toMonth,
  payments,
}: ReportInput) {
  // Import dinámico: jspdf y autoTable sólo se descargan al exportar.
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentWidth = pageWidth - margin * 2

  const period = periodLabel(fromYear, fromMonth, toYear, toMonth)

  const paid = payments.filter((p) => p.status === 'paid')
  const pending = payments.filter((p) => p.status === 'pending')
  const totalPaid = paid.reduce((acc, p) => acc + Number(p.amount), 0)
  const totalPending = pending.reduce((acc, p) => acc + Number(p.amount), 0)

  // ---- Cabecera corporativa ----
  const logo = await loadLogoDataUrl()
  const headerTop = 12
  const logoSize = 15
  const headerBottom = headerTop + logoSize + 5

  if (logo) {
    try {
      doc.addImage(logo, 'PNG', margin, headerTop, logoSize, logoSize, undefined, 'MEDIUM')
    } catch {
      // Un logo ilegible no debe impedir generar el reporte.
    }
  }

  // Con logo, el bloque de texto se alinea a su derecha; sin logo vuelve al margen.
  const textX = logo ? margin + logoSize + 5.5 : margin
  const titleY = logo ? headerTop + 7.5 : 18

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...C.ink)
  doc.text('Omega Gym', textX, titleY)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...C.muted)
  doc.text('REPORTE DE PAGOS', textX, titleY + 5.5)
  doc.text(`Periodo: ${period}`, textX, titleY + 10.5)

  doc.setDrawColor(...C.accent)
  doc.setLineWidth(0.8)
  doc.line(margin, headerBottom, pageWidth - margin, headerBottom)

  // ---- Tarjetas de resumen ----
  const cardsTop = headerBottom + 7
  const cardGap = 4
  const cardWidth = (contentWidth - cardGap * 2) / 3
  const cardHeight = 21

  const cards = [
    { label: 'RECAUDADO', value: money(totalPaid) },
    { label: 'PENDIENTE', value: money(totalPending) },
    { label: 'PAGOS', value: String(payments.length) },
  ]

  cards.forEach((card, index) => {
    const x = margin + index * (cardWidth + cardGap)

    doc.setFillColor(...C.card)
    doc.roundedRect(x, cardsTop, cardWidth, cardHeight, 2.5, 2.5, 'F')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...C.muted)
    doc.text(card.label, x + 5, cardsTop + 7)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13.5)
    doc.setTextColor(...C.ink)
    doc.text(card.value, x + 5, cardsTop + 16)
  })

  // ---- Tabla ----
  const head = [['MIEMBRO', 'CONCEPTO', 'FECHA', 'MÉTODO', 'ESTADO', 'MONTO']]
  const body = payments.map((payment) => [
    payment.member_name,
    payment.concept,
    shortDate(payment.date),
    METHOD_LABELS[payment.method] ?? payment.method,
    STATUS_LABELS[payment.status] ?? payment.status,
    money(Number(payment.amount)),
  ])

  // Espacio deliberado entre las tarjetas y la tabla.
  const tableTop = cardsTop + cardHeight + 12

  autoTable(doc, {
    startY: tableTop,
    margin: { left: margin, right: margin, top: 18, bottom: 18 },
    head,
    body,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      // Aire vertical entre filas (lo que pedía el brief) sin comerse el ancho
      // de las columnas: con 6 mm a los lados, «ESTADO» y «Pagado» se partían.
      cellPadding: { top: 6, right: 3, bottom: 6, left: 3 },
      textColor: [...C.ink],
      lineWidth: 0,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [...C.accent],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: { top: 5, right: 3, bottom: 5, left: 3 },
    },
    columnStyles: {
      0: { cellWidth: 46 },
      1: { cellWidth: 34 },
      2: { cellWidth: 20 },
      3: { cellWidth: 28 },
      4: { cellWidth: 26 },
      5: { halign: 'right', cellWidth: 'auto' },
    },
    didParseCell: (data) => {
      // El monto se alinea a la derecha también en la cabecera.
      if (data.column.index === 5) {
        data.cell.styles.halign = 'right'
        if (data.section === 'body') data.cell.styles.fontStyle = 'bold'
      }

      if (data.section !== 'body') return

      // Zebra sutil: `theme: plain` no la trae.
      if (data.row.index % 2 === 1) data.cell.styles.fillColor = [...C.zebra]

      if (data.column.index === 4) {
        const status = String(data.cell.raw)
        if (status === 'Pagado') data.cell.styles.textColor = [...C.paid]
        else if (status === 'Pendiente') data.cell.styles.textColor = [...C.pending]
        else if (status === 'Cancelado') data.cell.styles.textColor = [...C.cancelled]
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  if (payments.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...C.muted)
    doc.text('No hay pagos registrados en este periodo.', margin, tableTop + 14)
  }

  // ---- Pie de página ----
  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(161, 161, 170)
    doc.text(
      `Generado el ${new Date().toLocaleDateString('es-MX')} · omega gym`,
      margin,
      pageHeight - 10
    )
    doc.text(`${page} / ${pages}`, pageWidth - margin, pageHeight - 10, { align: 'right' })
  }

  return doc
}

/**
 * Genera el PDF del periodo y lo entrega según el modo.
 *
 * - `download`: `<a download="Reporte_Pagos_….pdf">`. Es el nombre real del
 *   archivo en el sistema operativo, sin UUID del blob.
 * - `preview`: escribe en la pestaña (abierta por el llamador de forma síncrona)
 *   un HTML con `<title>` legible y el PDF en un `<iframe>`. El visor nativo
 *   toma el título de la pestaña, no del Blob URL.
 *
 * Si la pestaña no está disponible (bloqueada por el navegador) la vista previa
 * cae a descarga para no perder el reporte.
 */
export async function exportPaymentsPdf(
  input: ReportInput,
  mode: 'download' | 'preview' = 'download',
  previewWindow?: Window | null
): Promise<'preview' | 'download'> {
  const doc = await buildPaymentsDoc(input)
  const filename = paymentsPdfFilename(
    input.fromYear,
    input.fromMonth,
    input.toYear,
    input.toMonth
  )

  const url = URL.createObjectURL(doc.output('blob'))

  if (mode === 'preview' && previewWindow && !previewWindow.closed) {
    try {
      previewWindow.document.open()
      previewWindow.document.write(previewHtml(filename, url))
      previewWindow.document.close()
      // El iframe necesita el blob vivo mientras se visualiza.
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
      return 'preview'
    } catch {
      // Origen no accesible: se descarga.
    }
  }

  downloadUrl(url, filename)
  setTimeout(() => URL.revokeObjectURL(url), mode === 'preview' ? 60_000 : 2_000)
  return 'download'
}

function downloadUrl(url: string, filename: string): void {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => {
    switch (char) {
      case '&': return '&amp;'
      case '<': return '&lt;'
      case '>': return '&gt;'
      default: return '&quot;'
    }
  })
}

function previewHtml(title: string, url: string): string {
  const safeTitle = escapeHtml(title)
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle}</title>
<style>
  html, body { margin: 0; height: 100%; background: #525659; }
  iframe { display: block; width: 100%; height: 100%; border: 0; background: #fff; }
</style>
</head>
<body>
<iframe src="${url}" title="${safeTitle}"></iframe>
</body>
</html>`
}
