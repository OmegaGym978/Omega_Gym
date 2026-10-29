import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useSidebarStore } from '@/store/sidebar.store'

interface Props {
  title: string
  subtitle?: string
  /** Ruta a la que volver; `true` usa el historial. */
  back?: boolean | string
  /** Acción propia en lugar de navegar atrás. */
  onBack?: () => void
  actions?: ReactNode
  /** Muestra el botón de menú (por defecto en staff). */
  menu?: boolean
  /** Título centrado con acciones a los lados (detalle nativo). */
  centerTitle?: boolean
  wide?: boolean
  className?: string
}

/**
 * Cabecera única de pantalla. Sustituye a los breadcrumbs y a las cabeceras
 * ad-hoc de cada página.
 */
export function ScreenHeader({
  title,
  subtitle,
  back,
  onBack,
  actions,
  menu,
  centerTitle,
  wide,
  className = '',
}: Props) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const openDrawer = useSidebarStore((s) => s.open)

  const isStaff = user?.role === 'admin' || user?.role === 'trainer'
  const showMenu = menu ?? (isStaff && !back)

  const leftButton = back ? (
    <button
      type="button"
      onClick={() => {
        if (onBack) onBack()
        else if (typeof back === 'string') navigate(back)
        else navigate(-1)
      }}
      aria-label="Volver"
      className="w-9 h-9 -ml-1 rounded-full text-text-2 flex items-center justify-center cursor-pointer bg-transparent border-none active:opacity-70 transition-opacity shrink-0"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  ) : showMenu ? (
    <button
      type="button"
      onClick={openDrawer}
      aria-label="Abrir menú"
      className="w-9 h-9 -ml-1 rounded-full text-text-2 flex items-center justify-center cursor-pointer bg-transparent border-none active:opacity-70 transition-opacity shrink-0"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  ) : null

  return (
    <header className={`sticky top-0 z-30 border-b border-border/70 bg-bg/90 backdrop-blur-xl safe-top ${className}`}>
      <div
        className={`mx-auto flex h-14 w-full items-center gap-2 px-3 sm:px-4 ${wide ? 'max-w-[1100px]' : 'max-w-[560px]'}`}
      >
        {centerTitle ? (
          <div className="relative flex w-full items-center">
            <div className="relative z-10 flex items-center gap-1.5">{leftButton}</div>

            <div className="pointer-events-none absolute inset-x-0 flex justify-center">
              <h1 className="max-w-[58%] truncate text-center text-[17px] font-bold leading-tight">
                {title}
              </h1>
            </div>

            <div className="relative z-10 ml-auto flex items-center gap-1.5">{actions}</div>
          </div>
        ) : (
          <>
            {leftButton}

            <div className="min-w-0 flex-1">
              <h1 className="text-[17px] font-bold truncate leading-tight">{title}</h1>
              {subtitle && <p className="text-[11px] text-text-3 truncate mt-0.5">{subtitle}</p>}
            </div>

            {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
          </>
        )}
      </div>
    </header>
  )
}
