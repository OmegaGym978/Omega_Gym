import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'
import { avatarColor, initials } from '@/lib/helpers'
import { Badge } from '@/components/ui/atoms/Badge'
import { LoadingSpinner } from '@/components/ui/atoms/LoadingSpinner'
import { Modal } from '@/components/ui/molecules/Modal'
import { ActivityChart } from '@/components/profile/ActivityChart'
import { SettingsModal } from '@/pages/settings/SettingsModal'
import { membershipsService } from '@/services/memberships.service'
import { checkInsService } from '@/services/checkIns.service'

const SHOW_DELETE_ACCOUNT = false

const METRICS = [
  { key: 'visits', label: 'Visitas' },
  { key: 'duration', label: 'Duración' },
  { key: 'volume', label: 'Volumen' },
  { key: 'reps', label: 'Repeticiones' },
] as const

type MetricKey = typeof METRICS[number]['key']

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  trainer: 'Entrenador',
  member: 'Miembro',
}

export default function MyProfilePage() {
  const user = useAuthStore(s => s.user)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [membership, setMembership] = useState<any>(null)
  const [checkinCount, setCheckinCount] = useState(0)
  const [visitTimes, setVisitTimes] = useState<string[]>([])
  const [activeMetric, setActiveMetric] = useState<MetricKey>('visits')

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const [deleting, setDeleting] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    let ignore = false

    const since = new Date()
    since.setMonth(since.getMonth() - 5)
    since.setDate(1)
    since.setHours(0, 0, 0, 0)

    ;(async () => {
      const [countRes, timesRes, membershipRes] = await Promise.allSettled([
        checkInsService.countByMember(user.id),
        checkInsService.getSinceByMember(user.id, since.toISOString()),
        membershipsService.getActiveWithType(user.id),
      ])
      if (ignore) return

      setCheckinCount(countRes.status === 'fulfilled' ? countRes.value : 0)
      setVisitTimes(timesRes.status === 'fulfilled' ? timesRes.value : [])
      if (membershipRes.status === 'fulfilled') setMembership(membershipRes.value)
      setLoading(false)
    })()

    return () => { ignore = true }
  }, [user])

  const months = useMemo(() => {
    const now = new Date()
    const base: { key: string; label: string; value: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      base.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString('es-MX', { month: 'short' }),
        value: 0,
      })
    }
    const index = new Map(base.map(point => [point.key, point]))
    for (const iso of visitTimes) {
      const d = new Date(iso)
      const point = index.get(`${d.getFullYear()}-${d.getMonth()}`)
      if (point) point.value += 1
    }
    return base
  }, [visitTimes])

  if (!user) {
    return (
      <div className="p-4 sm:p-7 flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-sm text-text-3">Inicia sesión para ver tu perfil.</div>
      </div>
    )
  }

  if (loading) return <LoadingSpinner text="Cargando perfil…" />

  const ac = avatarColor(user.full_name)
  const inits = initials(user.full_name)

  const memberSince = new Date(user.created_at)
  const now = new Date()
  const monthsAsMember = Math.max(
    0,
    (now.getFullYear() - memberSince.getFullYear()) * 12 + now.getMonth() - memberSince.getMonth(),
  )

  const hasVisits = months.some(point => point.value > 0)

  const openEdit = () => {
    setEditName(user.full_name)
    setEditPhone(user.phone || '')
    setEditOpen(true)
  }

  const handleShare = async () => {
    const url = window.location.origin
    const shareData = {
      title: 'Omega Gym',
      text: `Perfil de ${user.full_name} en Omega Gym`,
      url,
    }

    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> }
    if (typeof nav.share === 'function') {
      try {
        await nav.share(shareData)
      } catch {
        // El usuario canceló la hoja de compartir: no hacemos nada.
      }
      return
    }

    const clipboard = (navigator as Navigator).clipboard
    try {
      await clipboard.writeText(url)
      toast.success('Enlace copiado al portapapeles')
    } catch {
      toast.error('No se pudo copiar el enlace. Cópialo manualmente: ' + url)
    }
  }

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    if (editPhone.trim() && !isValidPhone(editPhone)) {
      toast.error('Ingresa un teléfono válido de 10 dígitos')
      return
    }
    setEditSaving(true)
    try {
      await useAuthStore.getState().updateProfile({
        full_name: editName.trim(),
        phone: editPhone.replace(/[\s\-()]/g, '') || null,
      })
      toast.success('Perfil actualizado')
      setEditOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar el perfil')
    } finally {
      setEditSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await useAuthStore.getState().deleteAccount()
      toast.success('Tu cuenta ha sido eliminada')
      navigate('/login')
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar la cuenta')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  function formatPhone(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 10)
    if (d.length <= 3) return d
    if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  }

  function isValidPhone(v: string) {
    return /^\d{10}$/.test(v.replace(/[\s\-()]/g, ''))
  }

  const nameMatches = confirmName.trim() === user.full_name

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur safe-top">
        <div className="mx-auto flex h-14 w-full max-w-[560px] items-center justify-between gap-3 px-4 sm:px-5">
          <h1 className="text-[17px] font-bold truncate">{user.full_name}</h1>
          <div className="flex items-center gap-1 shrink-0">
          <HeaderAction label="Editar perfil" onClick={openEdit}>
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </HeaderAction>
          <HeaderAction label="Compartir perfil" onClick={handleShare}>
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </HeaderAction>
          <HeaderAction label="Ajustes" onClick={() => setSettingsOpen(true)}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </HeaderAction>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-5 py-5 pb-10 flex-1 max-w-[560px] mx-auto w-full">
        {/* Identidad + estadísticas */}
        <section className="flex items-center gap-4 animate-slide-up">
          <div
            className="w-[72px] h-[72px] shrink-0 rounded-full flex items-center justify-center text-[24px] font-semibold"
            style={{ background: ac.bg, color: ac.fg }}
          >
            {inits}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[16px] font-bold truncate">{user.full_name}</span>
              <Badge variant="accent">{ROLE_LABEL[user.role] || user.role}</Badge>
              {membership && (
                <Badge variant="green" dot>{membership.membership_types?.name || 'Activo'}</Badge>
              )}
            </div>

            <div className="flex items-center gap-5 mt-2.5">
              <Stat value={monthsAsMember} label="Meses" />
              <Stat value={checkinCount} label="Visitas" />
              <Stat value={0} label="Entrenos" />
            </div>
          </div>
        </section>

        {/* Actividad */}
        <section className="mt-5 bg-surface  rounded-2xl p-4 animate-slide-up stagger-2">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="text-[13px] font-semibold">Actividad</div>
            <div className="text-[10px] uppercase tracking-[0.08em] text-text-3 font-bold">Últimos 6 meses</div>
          </div>

          {activeMetric === 'visits' && hasVisits ? (
            <ActivityChart data={months} />
          ) : (
            <div className="h-[132px] flex flex-col items-center justify-center gap-2">
              <div className="w-11 h-11 rounded-full bg-surface2 text-text-3 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <line x1="6" y1="20" x2="6" y2="13" /><line x1="12" y1="20" x2="12" y2="6" /><line x1="18" y1="20" x2="18" y2="10" />
                </svg>
              </div>
              <div className="text-[12px] text-text-3">Aún no hay datos</div>
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto mt-4 pb-0.5">
            {METRICS.map(metric => {
              const isActive = activeMetric === metric.key
              return (
                <button
                  key={metric.key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveMetric(metric.key)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold border cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-accent text-accent-contrast border-accent'
                      : 'bg-surface2 text-text-3 border-border text-text-2'
                  }`}
                >
                  {metric.label}
                </button>
              )
            })}
          </div>
        </section>

        {/* Accesos */}
        <section className="mt-5 animate-slide-up stagger-3">
          <div className="text-[10px] uppercase tracking-[0.08em] text-text-3 font-bold mb-2">Información</div>
          <div className="grid grid-cols-2 gap-3">
            <GridAction
              label="Estadísticas"
              icon={<><line x1="6" y1="20" x2="6" y2="14" /><line x1="12" y1="20" x2="12" y2="6" /><line x1="18" y1="20" x2="18" y2="10" /></>}
              onClick={() => toast.info('Estadísticas estará disponible próximamente')}
            />
            <GridAction
              label="Ejercicios"
              icon={<path d="M6.5 6.5l11 11M4 9v6M20 9v6M7 7v10M17 7v10" />}
              onClick={() => navigate('/my-profile/exercises')}
            />
            <GridAction
              label="Medidas"
              icon={<><path d="M4 4v16h16" /><path d="M8 16l4-5 3 3 4-6" /></>}
              onClick={() => toast.info('Medidas estará disponible próximamente')}
            />
            <GridAction
              label="Calendario"
              icon={<><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>}
              onClick={() => navigate('/my-checkins')}
            />
          </div>
        </section>

        {SHOW_DELETE_ACCOUNT && (
          <div className="mt-6">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-[13px] font-medium cursor-pointer transition-all duration-150"
              style={{ background: 'rgba(220,38,38,0.06)', color: 'rgba(248,113,113,0.7)', border: '1px solid rgba(220,38,38,0.12)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Eliminar cuenta
            </button>
          </div>
        )}
      </main>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Editar perfil */}
      <Modal
        open={editOpen}
        onClose={() => { if (!editSaving) setEditOpen(false) }}
        title="Editar perfil"
        compact
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}>
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[11px] text-text-3 font-semibold mb-1.5 block">Nombre completo</label>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              disabled={editSaving}
              className="w-full bg-transparent border border-border rounded-2xl px-4 py-3 text-sm font-medium text-text outline-none transition-all duration-150 placeholder:text-text-3 disabled:opacity-40 focus:border-accent"
            />
          </div>

          <div>
            <label className="text-[11px] text-text-3 font-semibold mb-1.5 block">Teléfono</label>
            <input
              type="text"
              inputMode="numeric"
              value={editPhone}
              onChange={e => setEditPhone(formatPhone(e.target.value))}
              disabled={editSaving}
              placeholder="10 dígitos"
              className="w-full bg-transparent border border-border rounded-2xl px-4 py-3 text-sm font-medium text-text outline-none transition-all duration-150 placeholder:text-text-3 disabled:opacity-40 focus:border-accent"
            />
          </div>

          <div>
            <label className="text-[11px] text-text-3 font-semibold mb-1.5 block">Email</label>
            <input
              type="email"
              value={user.email || ''}
              disabled
              className="w-full bg-surface2 border border-border rounded-2xl px-4 py-3 text-sm font-medium text-text-3 outline-none disabled:opacity-60"
            />
            <p className="text-[11px] text-text-3 mt-1.5">El correo no se puede editar desde aquí.</p>
          </div>

          <div className="h-px bg-border" />

          <div className="flex gap-2.5">
            <button
              onClick={() => setEditOpen(false)}
              disabled={editSaving}
              className="flex-1 py-3 rounded-2xl text-[13px] font-semibold cursor-pointer transition-all duration-150 disabled:opacity-40"
              style={{ background: 'var(--surface2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={editSaving}
              className="flex-1 py-3 rounded-2xl text-[13px] font-bold cursor-pointer transition-all duration-150 disabled:opacity-40"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {editSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Eliminar cuenta */}
      <Modal
        open={showDeleteModal}
        onClose={() => { if (!deleting) { setShowDeleteModal(false); setConfirmName('') } }}
        title="Eliminar cuenta"
        compact
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: '#f87171' }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        }
      >
        <div className="text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(220,38,38,0.12)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>

          <p className="text-sm font-semibold text-text mb-1">¿Eliminar tu cuenta?</p>
          <p className="text-xs text-text-3 leading-relaxed">
            Perderás acceso a tu cuenta. Tus membresías, pagos e historial se conservarán para que el administrador pueda re-vincular tu perfil después.
          </p>
        </div>

        <div className="h-px bg-border" />

        <div className="flex flex-col gap-3">
          <label className="text-[11px] text-text-3 font-semibold">
            Escribe <strong className="text-text">"{user.full_name}"</strong> para confirmar
          </label>
          <input
            type="text"
            value={confirmName}
            onChange={e => setConfirmName(e.target.value)}
            placeholder={user.full_name}
            disabled={deleting}
            className="w-full bg-transparent border border-border rounded-2xl px-4 py-3 text-sm font-medium text-text outline-none transition-all duration-150 placeholder:text-text-3 disabled:opacity-40"
          />
        </div>

        <button
          onClick={handleDeleteAccount}
          disabled={!nameMatches || deleting}
          className="w-full py-3 rounded-2xl text-[13px] font-bold cursor-pointer transition-all duration-150 disabled:cursor-not-allowed"
          style={{
            background: nameMatches && !deleting ? 'rgba(220,38,38,0.9)' : 'rgba(220,38,38,0.15)',
            color: nameMatches && !deleting ? '#fff' : 'rgba(248,113,113,0.4)',
            border: nameMatches && !deleting ? '1px solid rgba(220,38,38,0.4)' : '1px solid rgba(220,38,38,0.08)',
          }}
        >
          {deleting ? 'Eliminando...' : 'Eliminar mi cuenta'}
        </button>
      </Modal>
    </>
  )
}

function HeaderAction({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="w-9 h-9 rounded-full bg-surface2 border border-border text-text-2 flex items-center justify-center cursor-pointer transition-colors"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col min-w-0">
      <span className="text-[16px] font-bold leading-none">{value}</span>
      <span className="text-[10px] text-text-3 mt-1 truncate">{label}</span>
    </div>
  )
}

function GridAction({ label, icon, onClick }: { label: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-surface  rounded-2xl p-4 flex items-center gap-3 text-left cursor-pointer border-accent/30 transition-colors"
    >
      <span className="w-9 h-9 rounded-full bg-accent-dim text-accent flex items-center justify-center shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </span>
      <span className="text-[12px] font-semibold text-text truncate">{label}</span>
    </button>
  )
}
