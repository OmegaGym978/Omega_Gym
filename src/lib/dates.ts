export const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const

/** Índice de día con lunes = 0 … domingo = 6. */
export function weekdayIndex(date: Date = new Date()): number {
  const day = date.getDay()
  return day === 0 ? 6 : day - 1
}

/** Devuelve el lunes a las 00:00 de la semana de `date`. */
export function startOfWeek(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - weekdayIndex(d))
  d.setHours(0, 0, 0, 0)
  return d
}

/** Clave local YYYY-MM-DD (sin UTC, para comparar días). */
export function localDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatSchedule(days: number[] | null | undefined): string {
  if (!days || days.length === 0) return 'Sin programar'
  return [...days].sort((a, b) => a - b).map(d => DAY_LABELS[d] ?? '?').join(' · ')
}

export function todayLabel(date: Date = new Date()): string {
  return date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
}
