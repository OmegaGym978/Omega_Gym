import { useAuthStore } from '@/store/auth.store'
import { useThemeStore } from '@/store/theme.store'
import { ACCENT_PRESETS, useAccentStore } from '@/store/accent.store'
import { initials, avatarColor } from '@/lib/helpers'
import { BottomSheet } from '@/components/ui/molecules/BottomSheet'
import { ListGroup } from '@/components/ui/molecules/ListGroup'
import { ListTile } from '@/components/ui/molecules/ListTile'
import { Switch } from '@/components/ui/atoms/Switch'

interface Props {
  open: boolean
  onClose: () => void
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  trainer: 'Entrenador',
  member: 'Miembro',
}

export function SettingsModal({ open, onClose }: Props) {
  const user = useAuthStore((s) => s.user)
  const { theme, toggle } = useThemeStore()
  const { accent, setAccent } = useAccentStore()

  const col = avatarColor(user?.id || '')
  const isDark = theme === 'dark'

  return (
    <BottomSheet open={open} onClose={onClose} title="Ajustes" maxWidth="480px">
      {/* Usuario */}
      <div className="flex items-center gap-3 p-4 bg-surface2 rounded-tile">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-bold shrink-0"
          style={{ background: col.bg, color: col.fg }}
        >
          {user ? initials(user.full_name) : '??'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold truncate">{user?.full_name || 'Usuario'}</div>
          <div className="text-[12px] text-text-3 truncate">{user?.email || '—'}</div>
        </div>
        <span className="shrink-0 px-2.5 py-1 rounded-full bg-surface3 text-text-2 text-[10px] font-semibold uppercase tracking-[0.06em]">
          {ROLE_LABEL[user?.role || 'member'] || user?.role}
        </span>
      </div>

      {/* Preferencias */}
      <div className="mt-4">
        <ListGroup>
          <ListTile
            title="Tema oscuro"
            subtitle="Cambiar apariencia"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            }
            trailing={
              <Switch checked={isDark} onChange={toggle} label="Tema oscuro" />
            }
          />
        </ListGroup>
      </div>

      {/* Acento */}
      <div className="mt-5">
        <div className="text-[12px] font-semibold text-text-2 px-1 mb-2">Color de acento</div>
        <div className="bg-surface rounded-card p-5 grid grid-cols-4 gap-4 place-items-center">
          {ACCENT_PRESETS.map(preset => {
            const active = accent === preset.key
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => setAccent(preset.key)}
                aria-label={`Acento ${preset.label}`}
                aria-pressed={active}
                title={preset.label}
                className="w-11 h-11 rounded-full cursor-pointer transition-transform active:scale-95 border-none flex items-center justify-center"
                style={{ background: preset.color }}
              >
                {active && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={preset.contrast} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Cuenta */}
      <div className="mt-5">
        <ListGroup>
          <ListTile
            title="Cerrar sesión"
            danger
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            }
            onClick={() => {
              useAuthStore.getState().logout()
              window.location.href = '/login'
            }}
          />
        </ListGroup>
      </div>
    </BottomSheet>
  )
}
