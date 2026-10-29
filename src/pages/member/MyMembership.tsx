import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { membershipsService } from '@/services/memberships.service'
import { paymentsService, type Payment } from '@/services/payments.service'
import { Badge } from '@/components/ui/atoms/Badge'
import { LoadingSpinner } from '@/components/ui/atoms/LoadingSpinner'
import { MetricCard } from '@/components/ui/atoms/MetricCard'
import { Modal } from '@/components/ui/molecules/Modal'
import { TabBar } from '@/components/ui/molecules/TabBar'
import { ScreenHeader } from '@/components/ui/layout/ScreenHeader'
import { fmtDate, fmtMoney } from '@/lib/helpers'

const METHOD_LABEL: Record<string, string> = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia' }

const staggerClass = (i: number) => {
  const map = ['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4', 'stagger-5']
  return map[i] || ''
}

function IconPaid() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
}
function IconCount() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>
}

export default function MyMembershipPage() {
  const user = useAuthStore(s => s.user)
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'pagos' ? 'pagos' : 'membresia'
  const setTab = (key: string) => setSearchParams(key === 'pagos' ? { tab: 'pagos' } : {}, { replace: true })

  const [loading, setLoading] = useState(true)
  const [membership, setMembership] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
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

  if (loading) return <LoadingSpinner text="Cargando membresía…" />

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

  const lastPayment = payments.find(p => p.status === 'paid') || payments[0]

  return (<>
      <ScreenHeader
        title="Mi membresía"
        subtitle="Estado y pagos"
        actions={
          <TabBar
            tabs={[
              { key: 'membresia', label: 'Mi membresía' },
              { key: 'pagos', label: 'Pagos' },
            ]}
            active={tab}
            onChange={setTab}
          />
        }
      />
    <div className="px-4 sm:px-5 py-4 flex-1 mx-auto w-full max-w-[560px]">

      {/* ==================== TAB: MI MEMBRESÍA ==================== */}
      {tab === 'membresia' && (!membership ? (
        <div className={`bg-surface  rounded-2xl p-10 flex flex-col items-center gap-4 text-center animate-slide-up ${staggerClass(1)}`}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          </div>
          <div>
            <div className="text-[15px] font-semibold mb-1">Sin membresía activa</div>
            <div className="text-[13px] text-text-3">Acércate a recepción para contratar una membresía.</div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className={`flex flex-col gap-4 animate-slide-up ${staggerClass(1)}`}>
            {daysRemaining <= 7 && (
              <div className="bg-[#2a1f00] border border-[#5a3e00] rounded-2xl p-3.5 flex items-start gap-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div>
                  <div className="text-[13px] font-semibold text-[#facc15]">Vence en {daysRemaining} días</div>
                  <div className="text-[12px] text-[#a07a00] mt-0.5">Habla con el gym para renovar tu membresía</div>
                </div>
              </div>
            )}

            <div className="bg-surface  rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-[120px] h-[120px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, var(--accent), transparent 70%)', opacity: 0.06 }} />
              <div className="absolute -bottom-12 left-8 w-[140px] h-[140px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, var(--accent), transparent 70%)', opacity: 0.04 }} />
              <div className="flex justify-between items-start mb-5 relative">
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
                  <div className="text-[14px] font-medium mt-1" style={{ color: 'var(--accent)' }}>{fmtDate(membership.end_date)}</div>
                </div>
              </div>
              <div className="mt-[18px] relative">
                <div className="flex justify-between text-[11px] text-text-3 mb-1.5">
                  <span>Período</span>
                  <span className="font-mono" style={{ color: daysRemaining <= 7 ? 'var(--amber-text)' : 'var(--accent)' }}>{progressPct}%</span>
                </div>
                <div className="h-[4px] bg-surface2 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%`, background: daysRemaining <= 7 ? 'var(--amber)' : 'var(--accent)' }} />
                </div>
                <div className="text-[11px] text-text-3 mt-1.5">{daysRemaining} días restantes de {totalDays}</div>
              </div>
            </div>

            <div className="bg-surface  rounded-2xl p-4">
              <div className="text-[11px] font-medium text-text-3 uppercase tracking-[0.4px] mb-3">Detalles</div>
              <div className="divide-y divide-[#222]">
                <div className="flex justify-between items-center py-2">
                  <span className="flex items-center gap-2 text-[13px] text-text-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-60"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Duración
                  </span>
                  <span className="text-[13px] font-medium">{totalDays} días</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="flex items-center gap-2 text-[13px] text-text-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-60"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    Precio
                  </span>
                  <span className="text-[13px] font-medium">{fmtMoney(membership.membership_types?.price || 0)} MXN</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="flex items-center gap-2 text-[13px] text-text-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-60"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Miembro desde
                  </span>
                  <span className="text-[13px] font-medium">{fmtDate(membership.created_at?.split('T')[0] || null)}</span>
                </div>
              </div>
            </div>
          </div>

          {history.length > 1 && (
            <div className={`bg-surface  rounded-2xl overflow-hidden animate-slide-up ${staggerClass(2)}`}>
              <div className="px-5 py-4 border-b border-border">
                <div className="text-[11px] font-medium text-text-3 uppercase tracking-[0.4px]">Historial</div>
              </div>
              <div className="flex flex-col px-5">
                {history.map((m, i) => (
                  <div key={m.id} className={`flex items-center justify-between py-2.5 ${i < history.length - 1 ? 'border-b border-[#222]' : ''}`}>
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
            </div>
          )}
        </div>
      ))}

      {/* ==================== TAB: PAGOS ==================== */}
      {tab === 'pagos' && (payments.length === 0 ? (
        <div className={`bg-surface  rounded-2xl p-10 flex flex-col items-center gap-4 text-center animate-slide-up ${staggerClass(1)}`}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          </div>
          <div>
            <div className="text-[15px] font-semibold mb-1">Sin pagos registrados</div>
            <div className="text-[13px] text-text-3">Aún no hay transacciones en tu cuenta.</div>
          </div>
        </div>
      ) : (
        <>
          <div className={`grid grid-cols-2 gap-2.5 mb-4 animate-slide-up ${staggerClass(1)}`}>
            <MetricCard icon={<IconPaid />} label="Pagado este año" value={fmtMoney(paidTotal)} color="green" />
            <MetricCard icon={<IconCount />} label="Pagos registrados" value={payments.length} color="accent" />
          </div>

          {lastPayment && (
            <div className={`bg-surface  rounded-2xl p-4 mb-4 animate-slide-up ${staggerClass(2)}`}>
              <div className="text-[11px] font-medium text-text-3 uppercase tracking-[0.4px] mb-3">Último pago</div>
              <div className="divide-y divide-[#222]">
                <div className="flex justify-between items-center py-2">
                  <span className="flex items-center gap-2 text-[13px] text-text-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-60"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Fecha
                  </span>
                  <span className="text-[13px] font-medium">{fmtDate(lastPayment.payment_date)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="flex items-center gap-2 text-[13px] text-text-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-60"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    Monto
                  </span>
                  <span className="text-[13px] font-medium">{fmtMoney(lastPayment.amount)} MXN</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="flex items-center gap-2 text-[13px] text-text-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-60"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    Método
                  </span>
                  <span className="text-[13px] font-medium">{METHOD_LABEL[lastPayment.method] || lastPayment.method}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="flex items-center gap-2 text-[13px] text-text-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-60"><polyline points="20 6 9 17 4 12"/></svg>
                    Estado
                  </span>
                  <span className={`text-[11px] font-medium px-2 py-[3px] rounded-[5px] ${lastPayment.status === 'paid' ? 'bg-green-bg text-green-text' : lastPayment.status === 'pending' ? 'bg-amber-bg text-amber-text' : 'bg-red-bg text-red-text'}`}>
                    {lastPayment.status === 'paid' ? 'Confirmado' : lastPayment.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className={`bg-surface  rounded-2xl p-4 animate-slide-up ${staggerClass(3)}`}>
            <div className="text-[11px] font-medium text-text-3 uppercase tracking-[0.4px] mb-3">Historial completo</div>
            {payments.map((p, i) => (
              <div key={p.id}
                onClick={() => setReceipt(p)}
                className={`flex items-center justify-between py-2.5 cursor-pointer bg-surface2 transition-colors rounded-2xl ${i < payments.length - 1 ? 'border-b border-[#222]' : ''}`}>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium truncate">{p.concept || 'Membresía'} · {fmtDate(p.payment_date).split(' ')[1] || ''} {fmtDate(p.payment_date).split(' ')[2] || ''}</div>
                  <div className="text-[11px] text-text-3 mt-0.5">{fmtDate(p.payment_date)} · {METHOD_LABEL[p.method] || p.method}</div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className={`text-[13px] font-medium ${p.status === 'paid' ? 'text-green-text' : p.status === 'pending' ? 'text-amber-text' : 'text-red-text'}`}>{fmtMoney(p.amount)}</div>
                  <span className={`inline-block mt-0.5 text-[11px] font-medium px-2 py-[2px] rounded-[5px] ${p.status === 'paid' ? 'bg-green-bg text-green-text' : p.status === 'pending' ? 'bg-amber-bg text-amber-text' : 'bg-red-bg text-red-text'}`}>
                    {p.status === 'paid' ? 'Pagado' : p.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      ))}

      {/* Recibo (compartido por el tab Pagos) */}
      <Modal compact icon={
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
      } title="COMPROBANTE" open={receipt !== null} onClose={() => setReceipt(null)}>
        {receipt && (
          <>
            <div className="flex flex-col items-center mb-5">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-accent-dim mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
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
                  {receipt.method === 'cash' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>}
                  {receipt.method === 'card' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
                  {receipt.method === 'transfer' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>}
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
    </div>
    </>
  )
}
