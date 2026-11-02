import type { ReactNode } from 'react'
import { BottomSheet } from './BottomSheet'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
  icon?: ReactNode
  compact?: boolean
  /** Ancho máximo del panel en escritorio (por defecto 560 / 480 px). */
  maxWidth?: string
  /** Fondo y radio del panel; por defecto `bg-bg` + `rounded-t-sheet`. */
  panelClassName?: string
}

/**
 * Compatibilidad: los antiguos modales centrados ahora se presentan como
 * bottom sheets. Se conserva la API para no tocar las páginas que los usan.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  className = '',
  icon,
  compact,
  maxWidth,
  panelClassName,
}: ModalProps) {
  const contentClassName = className.replace(/(^|\s)max-w-\[[^\]]+\]/g, ' ').trim()
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      maxWidth={maxWidth || (compact ? '480px' : '560px')}
      panelClassName={panelClassName}
      title={
        <span className="inline-flex items-center gap-2">
          {icon}
          {title}
        </span>
      }
    >
      <div className={`flex flex-col gap-4 pt-1 ${contentClassName}`}>{children}</div>
    </BottomSheet>
  )
}
