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
}

/**
 * Compatibilidad: los antiguos modales centrados ahora se presentan como
 * bottom sheets. Se conserva la API para no tocar las páginas que los usan.
 */
export function Modal({ open, onClose, title, children, className = '', icon, compact }: ModalProps) {
  const contentClassName = className.replace(/(^|\s)max-w-\[[^\]]+\]/g, ' ').trim()
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      maxWidth={compact ? '480px' : '560px'}
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
