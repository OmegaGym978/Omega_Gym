import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  title: string
  subtitle?: string
  icon?: ReactNode
  avatar?: ReactNode
  trailing?: ReactNode
  /** Contador a la derecha, antes del chevron (p. ej. pagos pendientes). */
  badge?: number
  chevron?: boolean
  href?: string
  onClick?: () => void
  selected?: boolean
  danger?: boolean
  disabled?: boolean
  className?: string
}

function Chevron() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      className="text-text-3 shrink-0"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

/** Celda de lista agrupada: icono/avatar, título, subtítulo y chevron. */
export function ListTile({
  title,
  subtitle,
  icon,
  avatar,
  trailing,
  badge,
  chevron,
  href,
  onClick,
  selected,
  danger,
  disabled,
  className = '',
}: Props) {
  const content = (
    <>
      {(icon || avatar) && (
        <span className="shrink-0">
          {avatar ?? (
            <span className="w-9 h-9 rounded-full bg-surface2 text-text-2 flex items-center justify-center">
              <span className="w-4 h-4 flex items-center justify-center">{icon}</span>
            </span>
          )}
        </span>
      )}

      <span className="min-w-0 flex-1 text-left">
        <span className={`block text-[15px] font-medium truncate ${danger ? 'text-red-text' : 'text-text'}`}>
          {title}
        </span>
        {subtitle && (
          <span className="block text-[12px] text-text-3 truncate mt-0.5">{subtitle}</span>
        )}
      </span>

      {trailing ?? (
        <span className="flex items-center gap-2 shrink-0">
          {!!badge && badge > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-accent text-accent-contrast text-[10px] font-bold flex items-center justify-center">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
          {chevron ? <Chevron /> : null}
        </span>
      )}
    </>
  )

  const base = `w-full flex items-center gap-3 px-4 py-3.5 border-b border-divider last:border-b-0 text-left no-underline transition-opacity ${selected ? 'bg-accent-dim' : 'bg-surface'} ${className}`

  if (href) {
    return (
      <Link to={href} className={`${base} active:opacity-70`} onClick={onClick}>
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`${base} border-x-0 border-t-0 cursor-pointer active:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {content}
      </button>
    )
  }

  return <div className={base}>{content}</div>
}
