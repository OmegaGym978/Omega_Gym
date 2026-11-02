import { useEffect, useState } from 'react'

export interface SelectOption<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
  ariaLabel: string
  /** Ancho mínimo del menú desplegable. */
  menuWidth?: string
  className?: string
}

/**
 * Selector desplegable propio, sin `<select>` nativo: así el menú conserva el
 * tema oscuro (el nativo inyecta fondo blanco y resaltado azul del sistema).
 *
 * Estilo: menú `bg-surface2` (zinc-800) con `rounded-2xl`, opciones en texto
 * claro, hover `bg-surface3` (zinc-700) y check en el acento para la activa.
 */
export function SelectMenu<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  menuWidth = '180px',
  className = '',
}: Props<T>) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)

  // Escape cierra solo el menú. Se captura en `window` para adelantarse al
  // listener del BottomSheet, que escucha en `document` en fase de captura.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [open])

  return (
    <div className={`relative flex items-center justify-end ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="inline-flex items-center gap-1.5 bg-transparent border-none outline-none text-[13px] text-text font-sans cursor-pointer active:opacity-70 transition-opacity"
      >
        {selected?.label}
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-text-3 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <>
          {/* Capa para cerrar al tocar fuera, sin oscurecer el modal. */}
          <div className="fixed inset-0 z-10" aria-hidden="true" onClick={() => setOpen(false)} />
          <div
            role="listbox"
            aria-label={ariaLabel}
            className="absolute right-0 top-full z-50 mt-2 rounded-2xl border border-border bg-surface2 p-1"
            style={{ minWidth: menuWidth, boxShadow: '0 18px 40px rgba(0, 0, 0, 0.55)' }}
          >
            {options.map((opt) => {
              const active = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border-none bg-transparent px-3 py-2.5 text-left text-[13px] font-sans cursor-pointer transition-colors ${
                    active ? 'text-text' : 'text-text-2'
                  } hover:bg-surface3`}
                >
                  {opt.label}
                  {active && (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-accent"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
