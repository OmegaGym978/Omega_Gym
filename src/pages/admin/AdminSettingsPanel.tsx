import { useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'
import { authService } from '@/services/auth.service'
import { Button } from '@/components/ui/atoms/Button'
import { ListGroup } from '@/components/ui/molecules/ListGroup'
import { ListTile } from '@/components/ui/molecules/ListTile'
import { Modal } from '@/components/ui/molecules/Modal'
import { getErrorMessage } from '@/lib/helpers'
import { IconDumbbell, IconLock, IconMail, IconMemberships } from '@/lib/icons'

const INPUT_CLASS =
  'w-full rounded-2xl border border-border bg-surface2 px-4 py-3 font-sans text-[15px] text-text outline-none transition-colors placeholder:text-text-3 focus:border-accent disabled:opacity-40'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.08em] text-text-3">
      {children}
    </div>
  )
}

/**
 * Panel de configuración del administrador (perfil): cuenta y seguridad y
 * ajustes del gimnasio, con listas agrupadas estilo iOS.
 */
export function AdminSettingsPanel() {
  const user = useAuthStore((s) => s.user)

  const [passwordOpen, setPasswordOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  async function handleChangePassword() {
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== passwordConfirm) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setSavingPassword(true)
    try {
      await authService.updatePassword(password)
      toast.success('Contraseña actualizada')
      setPasswordOpen(false)
      setPassword('')
      setPasswordConfirm('')
      setShowPassword(false)
    } catch (e) {
      toast.error(getErrorMessage(e, 'No se pudo cambiar la contraseña.'))
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <>
      {/* Bloque 1 — Cuenta y seguridad */}
      <section className="mt-5 animate-slide-up stagger-2">
        <SectionLabel>Cuenta y seguridad</SectionLabel>
        <ListGroup>
          <ListTile
            title="Correo electrónico"
            icon={<IconMail />}
            trailing={
              <span className="max-w-[58%] shrink-0 truncate text-[13px] text-text-3">
                {user?.email ?? '—'}
              </span>
            }
          />
          <ListTile
            title="Cambiar contraseña"
            icon={<IconLock />}
            chevron
            onClick={() => setPasswordOpen(true)}
          />
        </ListGroup>
      </section>

      {/* Bloque 2 — Ajustes de Omega Gym */}
      <section className="mt-5 animate-slide-up stagger-3">
        <SectionLabel>Ajustes de Omega Gym</SectionLabel>
        <ListGroup>
          <ListTile
            title="Precios de membresías"
            subtitle="Costos base de los planes"
            icon={<IconMemberships />}
            chevron
            href="/membership-types"
          />
          <ListTile
            title="Gestión de entrenadores"
            subtitle="Personal con acceso al sistema"
            icon={<IconDumbbell />}
            chevron
            href="/members?role=trainer"
          />
        </ListGroup>
      </section>

      {/* Cambiar contraseña */}
      <Modal
        open={passwordOpen}
        onClose={() => { if (!savingPassword) setPasswordOpen(false) }}
        title="Cambiar contraseña"
        compact
        icon={<IconLock width="16" height="16" />}
      >
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold text-text-3">Nueva contraseña</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={savingPassword}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              className={`${INPUT_CLASS} pr-24`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 h-9 -translate-y-1/2 rounded-full border-none bg-surface3/50 px-3 font-sans text-[11px] font-semibold text-text-2 transition-opacity active:opacity-70"
            >
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold text-text-3">Confirmar contraseña</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            disabled={savingPassword}
            placeholder="Repite la contraseña"
            autoComplete="new-password"
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col gap-1 pt-1">
          <Button
            variant="primary"
            className="w-full"
            onClick={handleChangePassword}
            disabled={savingPassword || !password || !passwordConfirm}
          >
            {savingPassword ? 'Guardando…' : 'Guardar contraseña'}
          </Button>
          <button
            type="button"
            onClick={() => setPasswordOpen(false)}
            disabled={savingPassword}
            className="h-11 w-full rounded-full border-none bg-transparent font-sans text-[14px] font-semibold text-text-2 transition-opacity active:opacity-70 disabled:opacity-40"
          >
            Cancelar
          </button>
        </div>
      </Modal>
    </>
  )
}
