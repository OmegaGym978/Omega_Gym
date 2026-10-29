import { useEffect, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title?: ReactNode
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  showClose?: boolean
  maxWidth?: string
  className?: string
}

/**
 * Bottom sheet nativo: sube desde abajo, esquinas superiores muy redondeadas
 * y un indicador de arrastre en el centro.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  showClose = true,
  maxWidth = '560px',
  className = '',
}: Props) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', handler, true)
    return () => document.removeEventListener('keydown', handler, true)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div
        className={`animate-sheet-in relative w-full flex flex-col max-h-[90vh] bg-bg rounded-t-3xl pb-[env(safe-area-inset-bottom,0px)] ${className}`}
        style={{ maxWidth }}
      >
        {/* Indicador de arrastre */}
        <div className="pt-2.5 pb-1 flex justify-center shrink-0">
          <span className="w-12 h-1.5 rounded-full bg-surface3" aria-hidden="true" />
        </div>

        {(title || showClose) && (
          <div className="flex items-start justify-between gap-3 px-5 pt-1 pb-3 shrink-0">
            <div className="min-w-0">
              {title && <div className="text-[17px] font-semibold truncate">{title}</div>}
              {subtitle && <div className="text-[12px] text-text-3 mt-0.5">{subtitle}</div>}
            </div>
            {showClose && (
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="w-8 h-8 shrink-0 rounded-full bg-surface2 text-text-3 flex items-center justify-center border-none cursor-pointer active:opacity-70 transition-opacity"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 pb-5">{children}</div>

        {footer && <div className="shrink-0 px-5 py-3 border-t border-divider">{footer}</div>}
      </div>
    </div>
  )
}
