import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fmtDate } from '@/lib/helpers'
import { IconCalendar, IconChevronLeft, IconChevronRight } from '@/lib/icons'
import { PickerPopup } from './PickerPopup'

/** Semana en orden domingo → sábado, como en el calendario nativo de iOS. */
const WEEKDAY_LABELS = ['do', 'lu', 'ma', 'mi', 'ju', 'vi', 'sá'] as const

const MONTH_LABELS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
] as const

export interface DatePickerProps {
  /** Fecha en formato `YYYY-MM-DD`. Cadena vacía = sin fecha. */
  value: string
  onChange: (value: string) => void
  /**
   * `row` = fila plana dentro de una hoja;
   * `field` = celda compacta con borde;
   * `list` = fila de lista inset grouped (etiqueta a la izquierda).
   */
  variant?: 'row' | 'field' | 'list'
  /** Etiqueta visible a la izquierda; sólo aplica a `variant="list"`. */
  label?: string
  placeholder?: string
  /** Límites opcionales en `YYYY-MM-DD`. */
  min?: string
  max?: string
  /** Muestra la acción "Borrar" en el pie del calendario. */
  clearable?: boolean
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

function toKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function parseKey(key: string): Date | null {
  if (!key) return null
  const [y, m, d] = key.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/**
 * Selector de fecha propio, sin dependencias externas.
 *
 * Sustituye a `<input type="date">` para poder aplicar el diseño de la app: el
 * popup nativo del navegador (día seleccionado en azul, "Borrar"/"Hoy" azules)
 * no es estilizable. Todos los colores salen de los tokens del tema, de modo
 * que respeta el tema claro y el acento configurable.
 */
export function DatePicker({
  value,
  onChange,
  variant = 'row',
  label,
  placeholder = 'Elegir fecha',
  min,
  max,
  clearable = false,
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const justOpenedRef = useRef(false)

  const selectedDate = parseKey(value)
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(selectedDate ?? new Date()))

  const todayKey = toKey(new Date())

  const closePicker = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus({ preventScroll: true })
  }, [])

  const openPicker = useCallback(() => {
    if (disabled) return
    setViewMonth(startOfMonth(parseKey(value) ?? new Date()))
    justOpenedRef.current = true
    setOpen(true)
  }, [disabled, value])

  // Al abrir, el foco va al día seleccionado o, si no hay selección, al primer
  // día visible. Sólo al abrir: si se moviera al cambiar de mes, un usuario de
  // teclado perdería el foco del chevron.
  useEffect(() => {
    if (!open) return
    if (!justOpenedRef.current) return
    justOpenedRef.current = false
    const card = cardRef.current
    if (!card) return
    const target =
      card.querySelector<HTMLButtonElement>('[data-selected="true"]') ??
      card.querySelector<HTMLButtonElement>('[data-day]:not([disabled])')
    target?.focus({ preventScroll: true })
  }, [open, viewMonth])

  const cells = useMemo(() => {
    const year = viewMonth.getFullYear()
    const month = viewMonth.getMonth()
    const firstWeekday = new Date(year, month, 1).getDay() // 0 = domingo
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const out: (Date | null)[] = []
    for (let i = 0; i < firstWeekday; i++) out.push(null)
    for (let day = 1; day <= daysInMonth; day++) out.push(new Date(year, month, day))
    while (out.length % 7 !== 0) out.push(null)
    return out
  }, [viewMonth])

  const isOutOfRange = useCallback((date: Date) => {
    const key = toKey(date)
    if (min && key < min) return true
    if (max && key > max) return true
    return false
  }, [min, max])

  const shiftMonth = useCallback((delta: number) => {
    setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1))
  }, [])

  const pick = useCallback((date: Date) => {
    onChange(toKey(date))
    closePicker()
  }, [onChange, closePicker])

  const triggerClass = variant === 'field'
    ? 'w-full flex items-center justify-between gap-2 bg-surface2 border border-border2 text-text text-[13px] px-3 py-2 rounded-2xl font-sans text-left outline-none cursor-pointer transition-shadow duration-150 focus-visible:ring-2 focus-visible:ring-accent/40 active:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed'
    : variant === 'list'
      ? 'w-full flex items-center justify-between gap-3 bg-transparent border-none text-text text-[13px] font-medium px-4 py-3.5 font-sans text-left outline-none cursor-pointer active:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed'
      : 'w-full flex items-center justify-between gap-2 bg-transparent border-none text-text text-[14px] p-0 font-sans text-left cursor-pointer outline-none active:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed'

  const monthLabel = `${MONTH_LABELS[viewMonth.getMonth()]} ${viewMonth.getFullYear()}`

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={openPicker}
        disabled={disabled}
        aria-label={ariaLabel ?? 'Seleccionar fecha'}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`${triggerClass} ${className}`}
      >
        {variant === 'list' && label && (
          <span className="text-[13px] font-normal text-text-2">{label}</span>
        )}
        <span className={`flex items-center gap-1.5 ${variant === 'list' && label ? '' : 'w-full justify-between'}`}>
          <span className={value ? '' : 'text-text-3'}>
            {value ? fmtDate(value) : placeholder}
          </span>
          <IconCalendar
            width={variant === 'field' ? 14 : 16}
            height={variant === 'field' ? 14 : 16}
            className="text-text-3 shrink-0"
          />
        </span>
      </button>

      <PickerPopup open={open} onClose={closePicker} label="Seleccionar fecha" cardRef={cardRef}>
            {/* Cabecera: mes y año + chevrons */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label="Mes anterior"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface2 text-text-2 border-none cursor-pointer active:opacity-70 transition-colors"
              >
                <IconChevronLeft width="16" height="16" />
              </button>

              <div className="text-[15px] font-semibold text-text capitalize tracking-tight">
                {monthLabel}
              </div>

              <button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="Mes siguiente"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface2 text-text-2 border-none cursor-pointer active:opacity-70 transition-colors"
              >
                <IconChevronRight width="16" height="16" />
              </button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className="text-center text-[11px] text-text-2 font-medium">
                  {label}
                </div>
              ))}
            </div>

            {/* Cuadrícula */}
            <div className="grid grid-cols-7 gap-y-1">
              {cells.map((date, index) => {
                if (!date) return <div key={`blank-${index}`} aria-hidden="true" />

                const key = toKey(date)
                const isSelected = key === value
                const isToday = key === todayKey
                const isDisabled = isOutOfRange(date)

                // Las clases de color son mutuamente excluyentes: si se
                // concatenaran, el ganador dependería del orden del CSS.
                const dayTone = isDisabled
                  ? 'bg-transparent text-text-4 opacity-40 cursor-not-allowed'
                  : isSelected
                    ? 'bg-accent text-accent-contrast font-semibold active:opacity-70'
                    : isToday
                      ? 'bg-transparent text-accent font-semibold active:opacity-70'
                      : 'bg-transparent text-text font-normal active:opacity-70'

                return (
                  <button
                    key={key}
                    type="button"
                    data-day={key}
                    data-selected={isSelected ? 'true' : undefined}
                    aria-pressed={isSelected}
                    aria-current={isToday ? 'date' : undefined}
                    disabled={isDisabled}
                    onClick={() => pick(date)}
                    className={`w-9 h-9 mx-auto flex items-center justify-center rounded-full text-[14px] border-none cursor-pointer outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 ${dayTone}`}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>

            {/* Acciones */}
            <div className="mt-2 flex items-center justify-between px-1">
              {clearable ? (
                <button
                  type="button"
                  onClick={() => { onChange(''); closePicker() }}
                  className="text-[13px] font-semibold text-accent bg-transparent border-none cursor-pointer p-0 active:opacity-70 transition-opacity"
                >
                  Borrar
                </button>
              ) : (
                <span aria-hidden="true" />
              )}

              <button
                type="button"
                onClick={() => {
                  const now = new Date()
                  setViewMonth(startOfMonth(now))
                  onChange(toKey(now))
                  closePicker()
                }}
                className="text-[13px] font-semibold text-accent bg-transparent border-none cursor-pointer p-0 active:opacity-70 transition-opacity"
              >
                Hoy
              </button>
            </div>
      </PickerPopup>
    </>
  )
}
