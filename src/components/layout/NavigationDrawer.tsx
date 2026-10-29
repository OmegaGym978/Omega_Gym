import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useSidebarStore } from '@/store/sidebar.store'
import type { NavSection } from './nav-config'

interface Props {
  sections: NavSection[]
  icons: Record<string, string>
  roleLabel: string
  onSettings: () => void
  pendingPayments?: number
}

/** Drawer bajo demanda que sustituye a la barra lateral fija. */
export function NavigationDrawer({ sections, icons, roleLabel, onSettings, pendingPayments = 0 }: Props) {
  const { isOpen, close } = useSidebarStore()
  const pathname = useLocation().pathname
  const user = useAuthStore((s) => s.user)
  const initials = user ? user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '??'

  return (
    <div className={`fixed inset-0 z-[60] ${isOpen ? '' : 'pointer-events-none'}`} aria-hidden={!isOpen}>
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={close}
      />

      <aside
        className={`absolute left-0 top-0 bottom-0 w-[288px] max-w-[86vw] flex flex-col border-r border-border bg-surface transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        <div className="px-5 pt-5 pb-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--logo-bg)', border: '1px solid var(--logo-border)' }}>
              <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                <text x="12" y="18" fontFamily="serif" fontSize="18" fontWeight="bold" style={{ fill: 'var(--logo-omega)' }} textAnchor="middle">Ω</text>
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-[15px] font-bold leading-tight">Omega Gym</div>
              <div className="text-[10px] text-text-3 uppercase tracking-[0.08em] mt-0.5">{roleLabel}</div>
            </div>
          </div>
          <button
            onClick={close}
            aria-label="Cerrar menú"
            className="w-9 h-9 rounded-full bg-surface2 border border-border text-text-3 flex items-center justify-center cursor-pointer transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-4 py-4 border-b border-border">
          <button
            onClick={() => { close(); onSettings() }}
            className="w-full flex items-center gap-3 bg-surface2 border border-border rounded-2xl p-3 cursor-pointer text-left border-accent/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-accent-dim text-accent flex items-center justify-center text-[13px] font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold truncate">{user?.full_name || 'Usuario'}</div>
              <div className="text-[10px] text-text-3 truncate">{user?.email || roleLabel}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-text-3 shrink-0">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {sections.map(section => (
            <div key={section.section} className="mb-5">
              <div className="text-[10px] text-text-3 tracking-[0.1em] uppercase px-2 mb-1.5 font-semibold">{section.section}</div>
              {section.items.map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const badge = item.badgeKey === 'pendingPayments' ? pendingPayments : 0
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={close}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13px] no-underline mb-0.5 transition-colors ${
                      isActive ? 'text-accent bg-accent-dim font-semibold' : 'text-text-2'
                    }`}
                  >
                    <svg
                      width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
                      strokeLinecap="round" strokeLinejoin="round"
                      className="shrink-0"
                      dangerouslySetInnerHTML={{ __html: icons[item.icon] || '' }}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {badge > 0 && (
                      <span className="bg-red-bg text-red-text text-[10px] font-bold px-2 py-0.5 rounded-full">{badge}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-border pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <button
            onClick={() => { close(); onSettings() }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13px] font-medium text-text-2 bg-transparent border-none cursor-pointer font-sans transition-colors"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
              dangerouslySetInnerHTML={{ __html: icons.settings || '' }} />
            Ajustes
          </button>
        </div>
      </aside>
    </div>
  )
}
