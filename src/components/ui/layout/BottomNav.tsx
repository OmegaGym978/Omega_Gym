import { Link, useLocation } from 'react-router-dom'
import type { NavLink } from '@/components/layout/nav-config'

export interface BottomNavItem extends NavLink {
  badge?: number
}

interface Props {
  items: BottomNavItem[]
  icons: Record<string, string>
  onMore?: () => void
  moreActive?: boolean
}

/**
 * Barra inferior fija. En móvil ocupa el ancho completo con área segura;
 * en escritorio flota como píldora centrada.
 */
export function BottomNav({ items, icons, onMore, moreActive }: Props) {
  const pathname = useLocation().pathname
  // Con cinco pestañas el espacio por ítem baja; reducimos un punto la etiqueta.
  const slotCount = items.length + (onMore ? 1 : 0)
  const compact = slotCount >= 5
  const labelClass = compact ? 'text-[9px]' : 'text-[10px]'

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full lg:max-w-[600px] lg:mb-4 lg:rounded-full lg:border border-t border-border bg-bg/90 backdrop-blur-xl flex items-stretch pb-[env(safe-area-inset-bottom,0px)] lg:pb-0 lg:shadow-[0_12px_48px_rgba(0,0,0,0.55)]">
        {items.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              to={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-1 flex-col items-center justify-center gap-1 pt-2.5 pb-2 px-1 min-w-0 no-underline active:opacity-70 transition-opacity`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-full bg-accent" />
              )}
              <span className={`relative w-10 h-7 rounded-full flex items-center justify-center transition-colors ${
                isActive ? 'bg-accent-dim text-accent' : 'text-text-3'
              }`}>
                <svg
                  width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth={isActive ? 2.2 : 1.8}
                  strokeLinecap="round" strokeLinejoin="round"
                  dangerouslySetInnerHTML={{ __html: icons[item.icon] || '' }}
                />
                {!!item.badge && item.badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 rounded-full bg-accent text-accent-contrast text-[9px] font-bold flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </span>
              <span className={`${labelClass} font-semibold leading-none truncate max-w-full px-0.5 ${
                isActive ? 'text-accent' : 'text-text-3'
              }`}>
                {item.label}
              </span>
            </Link>
          )
        })}

        {onMore && (
          <button
            type="button"
            onClick={onMore}
            aria-label="Más secciones"
            aria-expanded={moreActive}
            className="relative flex flex-1 flex-col items-center justify-center gap-1 pt-2.5 pb-2 px-1 min-w-0 bg-transparent border-none cursor-pointer font-sans"
          >
            {moreActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-full bg-accent" />
            )}
            <span className={`w-10 h-7 rounded-full flex items-center justify-center transition-colors ${
              moreActive ? 'bg-accent-dim text-accent' : 'text-text-3'
            }`}>
              <svg
                width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={moreActive ? 2.2 : 1.8}
                strokeLinecap="round" strokeLinejoin="round"
                dangerouslySetInnerHTML={{ __html: icons.more || '' }}
              />
            </span>
            <span className={`${labelClass} font-semibold leading-none truncate max-w-full px-0.5 ${
              moreActive ? 'text-accent' : 'text-text-3'
            }`}>
              Más
            </span>
          </button>
        )}
      </div>
    </nav>
  )
}
