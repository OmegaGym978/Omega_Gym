import { useEffect, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'

interface PickerPopupProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** Etiqueta accesible del diálogo. */
  label: string
  maxWidth?: string
  cardRef?: RefObject<HTMLDivElement | null>
}

/**
 * Contenedor compartido de los popups de selección (fecha, mes).
 *
 * - Se monta en `document.body`: el panel de `BottomSheet` anima con `transform`
 *   y un `fixed` anidado se posicionaría respecto a ese ancestro.
 * - Escape se escucha en `window` con capture para ejecutarse antes del listener
 *   de `document` que usa `BottomSheet` y no cerrar también la hoja padre.
 */
export function PickerPopup({
  open,
  onClose,
  children,
  label,
  maxWidth = '340px',
  cardRef,
}: PickerPopupProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        className="animate-picker-in relative w-full rounded-[24px] bg-surface p-4 shadow-2xl"
        style={{ maxWidth }}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}
