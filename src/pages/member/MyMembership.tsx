import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { membershipsService, type ActiveMembership, type MembershipWithType } from '@/services/memberships.service'
import { paymentsService, type Payment } from '@/services/payments.service'
import { Badge } from '@/components/ui/atoms/Badge'
import { Modal } from '@/components/ui/molecules/Modal'
import { ScreenHeader } from '@/components/ui/layout/ScreenHeader'
import { PageContainer } from '@/components/ui/layout/PageContainer'
import { fmtDate, fmtMoney } from '@/lib/helpers'

const METHOD_LABEL: Record<string, string> = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia' }

const staggerClass = (i: number) => {
  const map = ['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4', 'stagger-5']
  return map[i] || ''
}

/**
 * Mi membresía: mismo shell que Inicio y Entrenamiento (cabecera simple +
 * tarjetas apiladas). Sin pestañas: el historial de recibos vive en una tarjeta
 * al final de la página.
 */
export default function MyMembershipPage() {
  const user = useAuthStore(s => s.user)
  const location = useLocation()
  const paymentsRef = useRef<HTMLElement | null>(null)

  const [loading, setLoading] = useState(true)
  const [membership, setMembership] = useState<ActiveMembership | null>(null)
  const [history, setHistory] = useState<MembershipWithType[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [receipt, setReceipt] = useState<Payment | null>(null)

  useEffect(() => {
    if (!user) return
    const ctrl = { ignore: false }
    ;(async () => {
      try {
        const [active, all, pays] = await Promise.all([
          membershipsService.getActiveWithType(user.id),
          membershipsService.getByMember(user.id),
          paymentsService.getByMember(user.id),
        ])
        if (ctrl.ignore) return
        if (active) setMembership(active)
        setHistory(all || [])
        setPayments(pays || [])
      } catch {
        // silencioso: las secciones muestran sus estados vacíos
      }
      if (!ctrl.ignore) setLoading(false)
    })()
    return () => { ctrl.ignore = true }
  }, [user])

  // Deep link heredado (/my-payments) y enlaces con #pagos: baja a los recibos.
  useEffect(() => {
    if (loading || location.hash !== '#pagos') return
    paymentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [loading, location.hash])

  const now = new Date()
  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const daysRemaining = membership
    ? Math.max(0, Math.round((new Date(membership.end_date).getTime() - todayLocal.getTime()) / 86400000))
    : 0

  const totalDays = membership
    ? Math.round((new Date(membership.end_date).getTime() - new Date(membership.start_date).getTime()) / 86400000)
    : 1
  const progressPct = totalDays > 0 ? Math.min(100, Math.round(((totalDays - daysRemaining) / totalDays) * 100)) : 0

  const paidTotal = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  // La membresía vigente ya se muestra arriba; el historial es de las anteriores.
  const previousMemberships = history.filter(m => m.id !== membership?.id)

  return (
    <>
      <ScreenHeader title="Mi membresía" subtitle="Detalles de tu plan actual" />

      <PageContainer className="flex-1">
        {loading ? (
          <div className="flex flex-col gap-4">
            <div className="h-52 rounded-card skeleton" />
            <div className="h-40 rounded-card skeleton" />
            <div className="h-44 rounded-card skeleton" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {!membership ? (
              <section className={`bg-surface rounded-card p-6 flex flex-col items-center gap-4 text-center animate-slide-up ${staggerClass(1)}`}>
                <div className="w-14 h-14 rounded-full bg-red-bg text-red flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><path d="M16 16s-1.5-2-4-2-4 2-4 2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
                  </svg>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="text-[17px] font-bold text-text">Sin membresía activa</div>
                  <div className="text-[13px] text-text-2 leading-relaxed max-w-[260px]">
                    Acércate a recepción para contratar una membresía.
                  </div>
                </div>
              </section>
            ) : (
              <>
                {daysRemaining <= 7 && (
                  <div className={`bg-amber-bg rounded-card p-4 flex items-start gap-2.5 animate-slide-up ${staggerClass(1)}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5 text-amber-text">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <div>
                      <div className="text-[13px] font-semibold text-amber-text">Vence en {daysRemaining} días</div>
                      <div className="text-[12px] text-amber-text/80 mt-0.5">Habla con el gym para renovar tu membresía</div>
                    </div>
                  </div>
                )}

                {/* Plan actual + barra del periodo */}
                <section className={`bg-surface rounded-card p-5 relative overflow-hidden animate-slide-up ${staggerClass(1)}`}>
                  <div
                    className="absolute -top-10 -right-10 w-[120px] h-[120px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, var(--color-red), transparent 70%)', opacity: 0.07 }}
                  />
                  <div
                    className="absolute -bottom-12 left-8 w-[140px] h-[140px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, var(--color-red), transparent 70%)', opacity: 0.05 }}
                  />

                  <div className="flex justify-between items-start gap-3 mb-5 relative">
                    <div className="min-w-0">
                      <div className="text-[10px] text-text-3 uppercase tracking-[0.5px]">Tipo de membresía</div>
                      <div className="text-[20px] font-medium mt-1 truncate">{membership.membership_types?.name || 'Membresía'}</div>
                    </div>
                    <Badge variant="green" dot>Activa</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 relative">
                    <div>
                      <div className="text-[10px] text-text-3 uppercase tracking-[0.3px]">Inicio</div>
                      <div className="text-[14px] font-medium mt-1">{fmtDate(membership.start_date)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-text-3 uppercase tracking-[0.3px]">Vence</div>
                      <div className="text-[14px] font-medium mt-1 text-red">{fmtDate(membership.end_date)}</div>
                    </div>
                  </div>

                  <div className="mt-[18px] relative">
                    <div className="flex justify-between text-[11px] text-text-3 mb-1.5">
                      <span>Período</span>
                      <span className="font-mono text-red">{progressPct}%</span>
                    </div>
                    <div className="h-1 bg-surface2 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-red transition-all duration-500" style={{ width: `${progressPct}%` }} />
                    </div>
                    <div className="text-[11px] text-text-3 mt-1.5">{daysRemaining} días restantes de {totalDays}</div>
                  </div>
                </section>

                {/* Detalles */}
                <section className={`bg-surface rounded-card p-5 animate-slide-up ${staggerClass(2)}`}>
                  <div className="text-[11px] font-medium text-text-3 uppercase tracking-[0.4px] mb-3">Detalles</div>
                  <div className="divide-y divide-divider">
                    <div className="flex justify-between items-center py-2">
                      <span className="flex items-center gap-2 text-[13px] text-text-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-60"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        Duración
                      </span>
                      <span className="text-[13px] font-medium">{totalDays} días</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="flex items-center gap-2 text-[13px] text-text-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-60"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                        Precio
                      </span>
                      <span className="text-[13px] font-medium">{fmtMoney(membership.membership_types?.price || 0)} MXN</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="flex items-center gap-2 text-[13px] text-text-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-60"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        Miembro desde
                      </span>
                      <span className="text-[13px] font-medium">{fmtDate(membership.created_at?.split('T')[0] || null)}</span>
                    </div>
                  </div>
                </section>
              </>
            )}

            {previousMemberships.length > 0 && (
              <section className={`bg-surface rounded-card p-5 animate-slide-up ${staggerClass(2)}`}>
                <div className="text-[11px] font-medium text-text-3 uppercase tracking-[0.4px]">Historial</div>
                <div className="flex flex-col mt-1">
                  {previousMemberships.map((m, i) => (
                    <div key={m.id} className={`flex items-center justify-between py-2.5 ${i < previousMemberships.length - 1 ? 'border-b border-divider' : ''}`}>
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium truncate">{m.membership_types?.name || 'Membresía'}</div>
                        <div className="text-[11px] text-text-3 mt-0.5">{fmtDate(m.start_date)} — {fmtDate(m.end_date)}</div>
                      </div>
                      <span className={`shrink-0 text-[11px] font-medium px-2 py-[3px] rounded-[5px] ${m.status === 'expired' ? 'bg-green-bg text-green-text' : 'bg-red-bg text-red-text'}`}>
                        {m.status === 'expired' ? 'Completada' : 'Cancelada'}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Recibos: antes era la pestaña "Pagos" */}
            <section
              id="pagos"
              ref={paymentsRef}
              className={`bg-surface rounded-card p-5 animate-slide-up ${staggerClass(3)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-text-3 uppercase tracking-[0.4px]">Pagos</div>
                  <div className="text-[12px] text-text-3 mt-1">
                    {payments.length === 0
                      ? 'Aún sin recibos'
                      : `${payments.length} recibo${payments.length !== 1 ? 's' : ''} · ${fmtMoney(paidTotal)} pagado`}
                  </div>
                </div>
                <div className="shrink-0 w-9 h-9 rounded-full bg-red-bg text-red flex items-center justify-center">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
              </div>

              {payments.length === 0 ? (
                <div className="mt-4 rounded-tile bg-surface2 px-4 py-6 text-center text-[12px] text-text-3">
                  Aún no hay transacciones en tu cuenta.
                </div>
              ) : (
                <div className="mt-2 flex flex-col divide-y divide-divider">
                  {payments.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setReceipt(p)}
                      className="w-full flex items-center justify-between gap-3 py-3 text-left bg-transparent border-none cursor-pointer active:opacity-70 transition-opacity"
                    >
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium truncate">{p.concept || 'Membresía'}</div>
                        <div className="text-[11px] text-text-3 mt-0.5 truncate">{fmtDate(p.payment_date)} · {METHOD_LABEL[p.method] || p.method}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[13px] font-semibold">{fmtMoney(p.amount)}</div>
                        <div className="mt-1">
                          <Badge variant={p.status === 'paid' ? 'green' : p.status === 'pending' ? 'amber' : 'red'} dot>
                            {p.status === 'paid' ? 'Pagado' : p.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Recibo */}
        <Modal compact icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
        } title="COMPROBANTE" open={receipt !== null} onClose={() => setReceipt(null)}>
          {receipt && (
            <>
              <div className="flex flex-col items-center mb-5">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-bg mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
                </div>
                <div className="text-[30px] font-semibold font-mono leading-none -tracking-[0.03em]" style={{ color: receipt.status === 'paid' ? 'var(--green-text)' : receipt.status === 'pending' ? 'var(--amber-text)' : 'var(--red-text)' }}>
                  {fmtMoney(receipt.amount)}
                </div>
                <div className="mt-2.5">
                  {receipt.status === 'paid' ? <Badge variant="green" dot>Pagado</Badge> : receipt.status === 'pending' ? <Badge variant="amber" dot>Pendiente</Badge> : <Badge variant="red" dot>Cancelado</Badge>}
                </div>
              </div>

              <div className="border-t border-dashed border-border pt-4 flex flex-col gap-3.5">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-text-3 uppercase tracking-[0.06em]">Concepto</span>
                  <span className="text-[13px] font-medium text-right max-w-[200px]">{receipt.concept || 'Membresía'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-text-3 uppercase tracking-[0.06em]">Método</span>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-medium">
                    {receipt.method === 'cash' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /></svg>}
                    {receipt.method === 'card' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>}
                    {receipt.method === 'transfer' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>}
                    {METHOD_LABEL[receipt.method] || receipt.method}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-text-3 uppercase tracking-[0.06em]">Fecha</span>
                  <span className="text-[13px] font-medium">{fmtDate(receipt.payment_date)}</span>
                </div>
                {receipt.notes && (
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] text-text-3 uppercase tracking-[0.06em]">Notas</span>
                    <span className="text-[12px] text-text-2 text-right max-w-[200px] italic">{receipt.notes}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-border mt-5 pt-4 flex justify-center">
                <span className="text-[10px] text-text-3 tracking-[0.08em]">omega gym · recibo #{receipt.id.slice(0, 8)}</span>
              </div>
            </>
          )}
        </Modal>
      </PageContainer>
    </>
  )
}
