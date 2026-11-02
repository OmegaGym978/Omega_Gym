import { useCallback, useEffect, useRef, useState } from 'react'
import { IconChevronDown, IconChevronLeft, IconChevronRight } from '@/lib/icons'
import { PickerPopup } from './PickerPopup'

const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const

export interface MonthPickerProps {
  /** Año seleccionado (p. ej. 2026). */
  year: number
  /** Mes seleccionado, 0 = enero. */
  month: number
  onChange: (year: number, month: number) => void
  /**
   * `pill` = píldora compacta (por defecto);
   * `list` = fila de lista inset grouped con etiqueta a la izquierda.
   */
  variant?: 'pill' | 'list'
  /** Etiqueta visible a la izquierda; sólo aplica a `variant="list"`. */
  label?: string
  disabled?: boolean
  className?: string
}

/**
 * Selector de mes: píldora compacta que abre un popup con la cuadrícula de
 * meses. Comparte el aspecto de `DatePicker` (mismos tokens y `PickerPopup`),
 * pero el contrato es `(year, month)` porque la pantalla de Pagos filtra por
 * mes completo, no por día.
 */
export function MonthPicker({
  year,
  month,
  onChange,
  variant = 'pill',
  label: rowLabel,
  disabled = false,
  className = '',
}: MonthPickerProps) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(year)
  const justOpenedRef = useRef(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const today = new Date()

  const closePicker = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus({ preventScroll: true })
  }, [])

  const openPicker = useCallback(() => {
    if (disabled) return
    setViewYear(year)
    justOpenedRef.current = true
    setOpen(true)
  }, [disabled, year])

  // El foco va al mes seleccionado sólo al abrir; al cambiar de año se queda
  // en los chevrons para no interrumpir la navegación por teclado.
  useEffect(() => {
    if (!open || !justOpenedRef.current) return
    justOpenedRef.current = false
    cardRef.current
      ?.querySelector<HTMLButtonElement>('[data-selected="true"]')
      ?.focus({ preventScroll: true })
  }, [open, viewYear])

  const pick = useCallback((targetMonth: number) => {
    onChange(viewYear, targetMonth)
    closePicker()
  }, [onChange, viewYear, closePicker])

  const label = `${MONTH_LABELS[month]} ${year}`

  const triggerClass = variant === 'list'
    ? 'w-full flex items-center justify-between gap-3 bg-transparent border-none px-4 py-3.5 text-[13px] font-medium text-text font-sans text-left cursor-pointer outline-none active:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed'
    : 'flex items-center gap-1.5 h-9 px-4 rounded-full bg-surface2 text-text text-[14px] font-semibold border-none cursor-pointer font-sans whitespace-nowrap outline-none transition-colors active:opacity-70 focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-40 disabled:cursor-not-allowed'

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={openPicker}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Mes seleccionado: ${label}. Abrir calendario`}
        className={`${triggerClass} ${className}`}
      >
        {variant === 'list' && rowLabel && (
          <span className="text-[13px] font-normal text-text-2">{rowLabel}</span>
        )}
        <span className="flex items-center gap-1.5">
          {label}
          <IconChevronDown width="14" height="14" className="text-text-2 shrink-0" />
        </span>
      </button>

      <PickerPopup
        open={open}
        onClose={closePicker}
        label="Seleccionar mes"
        maxWidth="300px"
        cardRef={cardRef}
      >
        {/* Año */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setViewYear((current) => current - 1)}
            aria-label="Año anterior"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface2 text-text-2 border-none cursor-pointer active:opacity-70 transition-colors"
          >
            <IconChevronLeft width="16" height="16" />
          </button>

          <div className="text-[15px] font-semibold text-text tracking-tight">{viewYear}</div>

          <button
            type="button"
            onClick={() => setViewYear((current) => current + 1)}
            aria-label="Año siguiente"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface2 text-text-2 border-none cursor-pointer active:opacity-70 transition-colors"
          >
            <IconChevronRight width="16" height="16" />
          </button>
        </div>

        {/* Meses */}
        <div className="grid grid-cols-3 gap-1.5">
          {MONTH_LABELS.map((name, index) => {
            const isSelected = viewYear === year && index === month
            const isCurrent = viewYear === today.getFullYear() && index === today.getMonth()

            const tone = isSelected
              ? 'bg-accent text-accent-contrast font-semibold active:opacity-70'
              : isCurrent
                ? 'bg-transparent text-accent font-semibold active:opacity-70'
                : 'bg-surface2 text-text font-medium active:opacity-70'

            return (
              <button
                key={name}
                type="button"
                data-selected={isSelected ? 'true' : undefined}
                aria-pressed={isSelected}
                aria-current={isCurrent ? 'date' : undefined}
                onClick={() => pick(index)}
                className={`h-10 rounded-full text-[13px] border-none cursor-pointer outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 ${tone}`}
              >
                {name}
              </button>
            )
          })}
        </div>

        {/* Acción */}
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={() => {
              onChange(today.getFullYear(), today.getMonth())
              closePicker()
            }}
            className="text-[13px] font-semibold text-accent bg-transparent border-none cursor-pointer p-0 active:opacity-70 transition-opacity"
          >
            Mes actual
          </button>
        </div>
      </PickerPopup>
    </>
  )
}
