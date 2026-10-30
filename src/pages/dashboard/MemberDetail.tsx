import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/atoms/Button';
import { Badge } from '@/components/ui/atoms/Badge';
import { LoadingSpinner } from '@/components/ui/atoms/LoadingSpinner';
import { Modal } from '@/components/ui/molecules/Modal';
import { ScreenHeader } from '@/components/ui/layout/ScreenHeader';
import { ResponsiveTable, type Column } from '@/components/ui/molecules/ResponsiveTable';
import { initials, fmtDate, fmtMoney, fmtPhone, daysDiff, avatarIndex, AVATAR_COLORS } from '@/lib/helpers';
import { IconEdit, IconCalendar } from '@/lib/icons';
import { membersService, type MemberListItem } from '@/services/members.service';
import { membershipsService, type Membership, type MembershipType } from '@/services/memberships.service';
import { paymentsService, type Payment } from '@/services/payments.service';
import { trainingService, type TrainingPlan, type PlanExercise } from '@/services/training.service';
import { checkInsService, type CheckIn } from '@/services/checkIns.service';
import { toast } from 'sonner';

type TabKey = 'info' | 'memberships' | 'payments' | 'plan' | 'checkins';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'info', label: 'Info' },
  { key: 'memberships', label: 'Membresías' },
  { key: 'payments', label: 'Pagos' },
  { key: 'plan', label: 'Plan' },
  { key: 'checkins', label: 'Check-ins' },
];

const PAYMENT_METHOD_LABELS: Record<string, string> = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia' };
const PAYMENT_METHOD_COLORS: Record<string, string> = { cash: 'var(--green-text)', card: 'var(--teal-text)', transfer: 'var(--amber-text)' };

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabKey>('info');
  const [member, setMember] = useState<MemberListItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [memberships, setMemberships] = useState<(Membership & { type_name?: string })[]>([]);
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [membershipsLoading, setMembershipsLoading] = useState(false);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  const [plans, setPlans] = useState<(TrainingPlan & { creator: { id: string; full_name: string } | null })[]>([]);
  const [activePlanIdx, setActivePlanIdx] = useState(0);
  const [exercises, setExercises] = useState<PlanExercise[]>([]);
  const [planLoading, setPlanLoading] = useState(false);

  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [checkInsLoading, setCheckInsLoading] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', role: '', alias: '' });

  useEffect(() => {
    if (!id) { navigate('/members'); return; }
    const ctrl = { cancelled: false }
    setLoading(true);
    Promise.all([
      membersService.getById(id),
      membershipsService.getTypes(),
    ])
      .then(([data, types]) => {
        if (ctrl.cancelled) return
        setMember(data);
        setMembershipTypes(types);
        setForm({
          full_name: data.full_name,
          email: data.email ?? '',
          phone: data.phone ?? '',
          role: data.role,
          alias: data.alias ?? '',
        });
      })
      .catch((e) => {
        if (ctrl.cancelled) return
        toast.error('Error al cargar miembro: ' + e.message);
        navigate('/members');
      })
      .finally(() => { if (!ctrl.cancelled) setLoading(false) })
    return () => { ctrl.cancelled = true }
  }, [id, navigate]);

  useEffect(() => {
    if (!member) return;
    const ctrl = { cancelled: false }
    setMembershipsLoading(true);
    membershipsService.getByMember(member.id)
      .then((data) => {
        if (ctrl.cancelled) return
        const enriched = data.map((m) => ({
          ...m,
          type_name: membershipTypes.find((t) => t.id === m.type_id)?.name ?? '—',
        }));
        setMemberships(enriched);
      })
      .catch(() => { if (!ctrl.cancelled) toast.error('Error al cargar membresías') })
      .finally(() => { if (!ctrl.cancelled) setMembershipsLoading(false) })
    return () => { ctrl.cancelled = true }
  }, [member]);

  useEffect(() => {
    if (!member) return;
    const ctrl = { cancelled: false }
    setPaymentsLoading(true);
    paymentsService.getByMember(member.id)
      .then((data) => { if (!ctrl.cancelled) setPayments(data) })
      .catch(() => { if (!ctrl.cancelled) toast.error('Error al cargar pagos') })
      .finally(() => { if (!ctrl.cancelled) setPaymentsLoading(false) })
    return () => { ctrl.cancelled = true }
  }, [member]);

  useEffect(() => {
    if (!member || activeTab !== 'plan') return;
    const ctrl = { cancelled: false }
    setPlanLoading(true);
    trainingService.getByMemberAll(member.id)
      .then(async (allPlans) => {
        if (ctrl.cancelled) return
        setPlans(allPlans);
        setActivePlanIdx(0);
        if (allPlans[0]) {
          const ex = await trainingService.getExercises(allPlans[0].id);
          if (!ctrl.cancelled) setExercises(ex);
        } else {
          setExercises([]);
        }
      })
      .catch(() => { if (!ctrl.cancelled) toast.error('Error al cargar planes') })
      .finally(() => { if (!ctrl.cancelled) setPlanLoading(false) })
    return () => { ctrl.cancelled = true }
  }, [activeTab, member]);

  const selectPlan = useCallback(async (idx: number) => {
    const selected = plans[idx];
    if (!selected) return;
    setActivePlanIdx(idx);
    setPlanLoading(true);
    try {
      const ex = await trainingService.getExercises(selected.id);
      setExercises(ex);
    } catch {
      toast.error('Error al cargar ejercicios');
    } finally {
      setPlanLoading(false);
    }
  }, [plans]);

  useEffect(() => {
    if (!member) return;
    const ctrl = { cancelled: false }
    setCheckInsLoading(true);
    checkInsService.getByMember(member.id)
      .then((data) => { if (!ctrl.cancelled) setCheckIns(data) })
      .catch(() => { if (!ctrl.cancelled) toast.error('Error al cargar check-ins') })
      .finally(() => { if (!ctrl.cancelled) setCheckInsLoading(false) })
    return () => { ctrl.cancelled = true }
  }, [member]);

  const handleSave = useCallback(async () => {
    if (!member || !id) return;
    setSaving(true);
    try {
      await membersService.update(id, {
        role: form.role as 'admin' | 'trainer' | 'member',
        alias: form.alias.trim() || undefined,
      });
      toast.success('Miembro actualizado');
      setEditModal(false);
      const updated = await membersService.getById(id);
      setMember(updated);
    } catch (e: any) {
      toast.error('Error al guardar: ' + e.message);
    } finally {
      setSaving(false);
    }
  }, [member, id, form]);

  if (loading) return <LoadingSpinner text="Cargando miembro…" />;
  if (!member) return null;

  const m = member;
  const av = avatarIndex(m.id);

  const membershipStatusColor = (status: string) => {
    if (status === 'active') return 'green';
    if (status === 'warning') return 'amber';
    return 'red';
  };

  const activeMembership = memberships.find(
    (ms) => ms.status === 'active'
  );

  const _rem = activeMembership ? daysDiff(activeMembership.end_date) : null;
  const daysRemaining = _rem !== null ? -_rem : null;

  const activeMembershipType = activeMembership
    ? membershipTypes.find((t) => t.id === activeMembership.type_id)
    : null;

  const membershipColumns: Column<Membership & { type_name?: string }>[] = [
    { key: 'type', label: 'Tipo', render: (ms) => <span className="font-mono text-[12px]">{ms.type_name}</span> },
    { key: 'start', label: 'Inicio', render: (ms) => <span className="text-[12px]">{fmtDate(ms.start_date)}</span> },
    { key: 'end', label: 'Vencimiento', render: (ms) => <span className="text-[12px]">{fmtDate(ms.end_date)}</span> },
    {
      key: 'status', label: 'Estado', render: (ms) => {
        const c = ms.status === 'active' ? 'green' : ms.status === 'expired' ? 'red' : 'amber';
        return <Badge variant={c} dot>{ms.status === 'active' ? 'Activa' : ms.status === 'expired' ? 'Vencida' : 'Cancelada'}</Badge>;
      },
    },
  ];

  const paymentColumns: Column<Payment>[] = [
    { key: 'date', label: 'Fecha', render: (p) => <span className="text-[12px]">{fmtDate(p.payment_date)}</span> },
    { key: 'amount', label: 'Monto', align: 'right', render: (p) => <span className="font-mono text-[13px] font-medium">{fmtMoney(p.amount)}</span> },
    {
      key: 'method', label: 'Método', hide: 'lg', render: (p) => (
        <span className="text-[11px] font-medium" style={{ color: PAYMENT_METHOD_COLORS[p.method] }}>{PAYMENT_METHOD_LABELS[p.method]}</span>
      ),
    },
    {
      key: 'status', label: 'Estado', render: (p) => (
        p.status === 'paid' ? <Badge variant="green" dot>Pagado</Badge> : p.status === 'pending' ? <Badge variant="amber" dot>Pendiente</Badge> : <Badge variant="red" dot>Cancelado</Badge>
      ),
    },
  ];

  const checkinColumns: Column<CheckIn>[] = [
    { key: 'date', label: 'Fecha', render: (c) => <span className="text-[12px]">{fmtDate(c.check_in_time)}</span> },
    { key: 'time', label: 'Hora', render: (c) => <span className="text-[12px] font-mono">{new Date(c.check_in_time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span> },
    {
      key: 'method', label: 'Método', render: (c) => (
        <span className="text-[11px] text-text-2">{c.method === 'fingerprint' ? 'Huella' : c.method === 'card' ? 'Tarjeta' : 'Manual'}</span>
      ),
    },
  ];

  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = payments.filter((p) => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);
  const lastPayment = payments.find((p) => p.status === 'paid');
  const thisMonthCheckins = checkIns.filter((c) => {
    const d = new Date(c.check_in_time);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const muscles = [...new Set(exercises.map((e) => e.muscle).filter(Boolean))];
  const currentPlan = plans[activePlanIdx] ?? null;

  function roleBadge(role: string) {
    if (role === 'admin') return <Badge variant="accent" dot>Admin</Badge>;
    if (role === 'trainer') return <Badge variant="teal" dot>Entrenador</Badge>;
    return <Badge variant="gray" dot>Miembro</Badge>;
  }

  return (
    <>
      <ScreenHeader title={m.full_name} subtitle="Detalle del miembro" back="/members" wide />

      <div className="px-4 sm:px-6 py-4 flex-1 mx-auto w-full max-w-[1100px]">
        <div className="relative overflow-hidden rounded-3xl bg-surface  p-6 sm:p-8 mb-8">
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ background: 'radial-gradient(600px circle at 30% 40%, var(--accent), transparent)' }} />
          <div className="relative flex items-center gap-5">
            <div className="w-[64px] h-[64px] rounded-full flex items-center justify-center text-[24px] font-semibold shrink-0 ring-2 ring-white/[0.08]"
              style={{ background: AVATAR_COLORS[av].bg, color: AVATAR_COLORS[av].fg }}>
              {initials(m.full_name)}
            </div>
            <div className="flex-1">
              <h1 className="text-[26px] sm:text-[30px] font-display italic leading-tight -tracking-[0.02em]">{m.full_name}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {roleBadge(m.role)}
                {m.is_active
                  ? <Badge variant="green" dot>Activo</Badge>
                  : <Badge variant="red" dot>Inactivo</Badge>
                }
                {m.registration_status === 'pending' && <Badge variant="amber" dot>Pendiente</Badge>}
                <span className="text-[11px] text-text-3 ml-1">Miembro desde {fmtDate(m.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-1 mb-7 border-b border-border overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`tab-underline px-4 sm:px-5 py-3 text-[12px] font-medium whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? 'active text-text'
                  : 'text-text-3 text-text-2'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'info' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Antigüedad', value: `${daysDiff(m.created_at) ?? 0} días`, color: 'accent', sub: 'Miembro desde ' + fmtDate(m.created_at) },
                { label: 'Membresía', value: activeMembership ? 'Activa' : 'Sin membresía', color: activeMembership ? 'green' : 'red', sub: activeMembership ? `Vence ${fmtDate(activeMembership.end_date)}` : 'Sin membresía activa' },
                { label: 'Pagos', value: payments.length, color: 'green', sub: `Total: ${fmtMoney(totalPaid)}` },
                { label: 'Check-ins', value: thisMonthCheckins, color: 'teal', sub: 'Este mes' },
              ].map((item, i) => (
                <div key={item.label} className={`relative bg-surface  rounded overflow-hidden p-[18px] animate-slide-up stagger-${i + 1} card-hover-lift`}>
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `var(--${item.color})` }} />
                  <div className="text-[11px] text-text-3 uppercase tracking-[0.06em] mb-2.5">{item.label}</div>
                  <div className="text-[26px] font-semibold leading-none -tracking-[0.03em]" style={{ color: `var(--${item.color}-text)` }}>{item.value}</div>
                  <div className="text-[11px] text-text-3 mt-1.5">{item.sub}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-surface  rounded p-5 animate-slide-up stagger-5 card-hover-lift">
                <h3 className="text-[11px] text-text-3 uppercase tracking-[0.08em] mb-4 flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  Información de contacto</h3>
                <div className="space-y-3.5">
                  <div className="flex items-center gap-3">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-3 shrink-0">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <div>
                      <div className="text-[10px] text-text-3 uppercase tracking-[0.06em]">Email</div>
                      <div className="text-[13px]">{m.email || <span className="text-text-3">—</span>}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-3 shrink-0">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <div>
                      <div className="text-[10px] text-text-3 uppercase tracking-[0.06em]">Teléfono</div>
                      <div className="text-[13px]">{fmtPhone(m.phone)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-3 shrink-0">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    <div>
                      <div className="text-[10px] text-text-3 uppercase tracking-[0.06em]">Ref. interna</div>
                      <div className="text-[13px]">{m.alias || <span className="text-text-3">—</span>}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <IconCalendar width="15" height="15" className="text-text-3 shrink-0" />
                    <div>
                      <div className="text-[10px] text-text-3 uppercase tracking-[0.06em]">Registro</div>
                      <div className="text-[13px]">{m.registration_status === 'pending' ? 'Pendiente de activación' : m.registration_status === 'claimed' ? 'Reclamado (sin registro completo)' : 'Completo'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-surface  rounded p-5 animate-slide-up stagger-6 card-hover-lift">
                <h3 className="text-[11px] text-text-3 uppercase tracking-[0.08em] mb-4 flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--green-text)" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                  Membresía activa</h3>
                {activeMembership ? (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-text-2">Tipo</span>
                      <span className="text-[13px] font-medium">{activeMembershipType?.name ?? activeMembership.type_name ?? '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-text-2">Inicio</span>
                      <span className="text-[13px]">{fmtDate(activeMembership.start_date)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-text-2">Vencimiento</span>
                      <span className="text-[13px]" style={{ color: daysRemaining !== null && daysRemaining <= 7 ? 'var(--amber-text)' : 'var(--text)' }}>
                        {fmtDate(activeMembership.end_date)}
                        {daysRemaining !== null && (
                          <span className="ml-2 text-[11px]">({daysRemaining > 0 ? `${daysRemaining} días` : 'vencido'})</span>
                        )}
                      </span>
                    </div>
                    {activeMembershipType && (
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-text-2">Precio</span>
                        <span className="text-[13px] font-mono font-semibold">{fmtMoney(activeMembershipType.price)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-text-2">Estado</span>
                      <Badge variant={membershipStatusColor(daysRemaining !== null && daysRemaining <= 7 && activeMembership.status === 'active' ? 'warning' : activeMembership.status) as 'green' | 'amber' | 'red'} dot>
                        {activeMembership.status === 'active'
                          ? (daysRemaining !== null && daysRemaining <= 7 ? 'Por vencer' : 'Activa')
                          : activeMembership.status === 'expired' ? 'Vencida' : 'Cancelada'}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-text-3">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2 opacity-40">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span className="text-[12px]">Sin membresía activa</span>
                  </div>
                )}
              </div>

              <div className="bg-surface  rounded p-5 animate-slide-up stagger-7 card-hover-lift">
                <h3 className="text-[11px] text-text-3 uppercase tracking-[0.08em] mb-4 flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--purple-text)" strokeWidth="2" style={{color:'var(--purple-text)'}}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                  Plan de entrenamiento</h3>
                {m.plan_names.length > 0 ? (
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[15px] font-medium">{m.plan_names[0]}</span>
                      {m.plan_names.length > 1 && (
                        <span className="inline-flex items-center px-[6px] py-[1px] rounded-full text-[10px] font-semibold bg-accent-dim text-accent border border-accent/30">+{m.plan_names.length - 1}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-text-3">
                      {currentPlan?.description || 'Sin descripción'}
                    </div>
                    <div className="mt-3">
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('plan')}>
                        Ver ejercicios →
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-text-3">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2 opacity-40">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                    <span className="text-[12px]">Sin plan asignado</span>
                  </div>
                )}
              </div>

              <div className="bg-surface  rounded p-5 animate-slide-up stagger-8 card-hover-lift">
                <h3 className="text-[11px] text-text-3 uppercase tracking-[0.08em] mb-4 flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--teal-text)" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  Actividad reciente</h3>
                {checkIns.length > 0 ? (
                  <div className="space-y-2.5">
                    {checkIns.slice(0, 5).map((c) => (
                      <div key={c.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green" />
                          <span className="text-[12px]">{fmtDate(c.check_in_time)}</span>
                        </div>
                        <span className="text-[11px] font-mono text-text-3">
                          {new Date(c.check_in_time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                    {checkIns.length > 5 && (
                      <button onClick={() => setActiveTab('checkins')} className="text-[11px] text-accent mt-1 cursor-pointer">
                        Ver todos ({checkIns.length})
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-text-3">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2 opacity-40">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span className="text-[12px]">Sin check-ins registrados</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'memberships' && (
          <div>
            {membershipsLoading ? (
              <LoadingSpinner text="Cargando membresías…" />
            ) : memberships.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-[60px] text-text-3">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span className="text-[14px]">Sin membresías registradas</span>
                <span className="text-[12px] mt-1">Este miembro no tiene historial de membresías.</span>
              </div>
            ) : (
              <div className="bg-surface  rounded overflow-hidden">
                <ResponsiveTable
                  columns={membershipColumns}
                  data={memberships}
                  keyExtractor={(ms) => ms.id}
                  cardTitle={(ms) => ms.type_name ?? '—'}
                  cardSubtitle={(ms) => `${fmtDate(ms.start_date)} → ${fmtDate(ms.end_date)}`}
                  cardFields={[
                    { label: 'Estado', value: (ms) => {
                      const c = ms.status === 'active' ? 'green' : ms.status === 'expired' ? 'red' : 'amber';
                      return <Badge variant={c} dot>{ms.status === 'active' ? 'Activa' : ms.status === 'expired' ? 'Vencida' : 'Cancelada'}</Badge>;
                    }},
                  ]}
                  emptyMessage="Sin membresías registradas."
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div>
            {paymentsLoading ? (
              <LoadingSpinner text="Cargando pagos…" />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total pagado', value: fmtMoney(totalPaid), color: 'green', sub: `${payments.filter((p) => p.status === 'paid').length} pagos` },
                    { label: 'Pendiente', value: fmtMoney(totalPending), color: 'amber', sub: `${payments.filter((p) => p.status === 'pending').length} pagos` },
                    { label: 'Último pago', value: lastPayment ? fmtDate(lastPayment.payment_date) : '—', color: 'teal', sub: lastPayment ? fmtMoney(lastPayment.amount) : 'Sin pagos' },
                  ].map((m) => (
                    <div key={m.label} className="relative bg-surface  rounded overflow-hidden p-[18px]">
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `var(--${m.color})` }} />
                      <div className="text-[11px] text-text-3 uppercase tracking-[0.06em] mb-2.5">{m.label}</div>
                      <div className="text-[22px] font-semibold leading-none -tracking-[0.03em]" style={{ color: `var(--${m.color}-text)` }}>{m.value}</div>
                      <div className="text-[11px] text-text-3 mt-1.5">{m.sub}</div>
                    </div>
                  ))}
                </div>

                {payments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-[60px] text-text-3">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40">
                      <rect x="1" y="4" width="22" height="16" rx="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    <span className="text-[14px]">Sin pagos registrados</span>
                    <span className="text-[12px] mt-1">Este miembro no tiene historial de pagos.</span>
                  </div>
                ) : (
                  <div className="bg-surface  rounded overflow-hidden">
                    <ResponsiveTable
                      columns={paymentColumns}
                      data={payments}
                      keyExtractor={(p) => p.id}
                      cardTitle={(p) => fmtMoney(p.amount)}
                      cardSubtitle={(p) => fmtDate(p.payment_date)}
                      cardFields={[
                        { label: 'Estado', value: (p) => p.status === 'paid' ? <Badge variant="green" dot>Pagado</Badge> : p.status === 'pending' ? <Badge variant="amber" dot>Pendiente</Badge> : <Badge variant="red" dot>Cancelado</Badge> },
                        { label: 'Método', value: (p) => <span className="text-[11px]" style={{ color: PAYMENT_METHOD_COLORS[p.method] }}>{PAYMENT_METHOD_LABELS[p.method]}</span> },
                      ]}
                      emptyMessage="Sin pagos registrados."
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'plan' && (
          <div>
            {planLoading ? (
              <LoadingSpinner text="Cargando plan…" />
            ) : plans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-[60px] text-text-3">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
                <span className="text-[14px]">Sin plan asignado</span>
                <span className="text-[12px] mt-1">Este miembro no tiene un plan de entrenamiento asignado.</span>
              </div>
            ) : currentPlan && (
              <div className="space-y-5">
                {plans.length > 1 && (
                  <div className="flex flex-wrap gap-1.5">
                    {plans.map((p, idx) => (
                      <button key={p.id} onClick={() => selectPlan(idx)}
                        className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer border transition-colors font-inherit ${
                          idx === activePlanIdx
                            ? 'bg-accent text-accent-contrast border-accent'
                            : 'bg-transparent text-text-2 border-border border-accent/40'
                        }`}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}

                <div className="bg-surface  rounded p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-[17px] font-semibold">{currentPlan.name}</h3>
                      {currentPlan.description && (
                        <p className="text-[12px] text-text-3 mt-1">{currentPlan.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-text-3">
                    {currentPlan.creator && (
                      <span>Creado por <span className="text-text-2">{currentPlan.creator.full_name}</span></span>
                    )}
                    <span>{exercises.length} ejercicio{exercises.length !== 1 ? 's' : ''}</span>
                    {muscles.length > 0 && <span>{muscles.length} grupo{muscles.length !== 1 ? 's' : ''} muscular{muscles.length !== 1 ? 'es' : ''}</span>}
                  </div>
                </div>

                {exercises.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-[60px] text-text-3">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                    <span className="text-[14px]">Sin ejercicios en este plan</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {exercises.map((ex) => (
                      <div key={ex.id} className="bg-surface  rounded p-4">
                        <div className="flex items-start justify-between mb-2.5">
                          <span className="text-[13px] font-medium">{ex.exercise_name}</span>
                          {ex.muscle && (
                            <Badge variant="gray">{ex.muscle}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-[12px] text-text-2">
                          {ex.sets != null && (
                            <div className="flex items-center gap-1">
                              <span className="text-text-3">Series</span>
                              <span className="font-mono font-semibold">{ex.sets}</span>
                            </div>
                          )}
                          {ex.reps != null && (
                            <div className="flex items-center gap-1">
                              <span className="text-text-3">Reps</span>
                              <span className="font-mono font-semibold">{ex.reps}</span>
                            </div>
                          )}
                          
                        </div>
                        {ex.notes && (
                          <div className="mt-2 text-[11px] text-text-3 italic">{ex.notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'checkins' && (
          <div>
            {checkInsLoading ? (
              <LoadingSpinner text="Cargando check-ins…" />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Este mes', value: thisMonthCheckins, color: 'green', sub: 'Check-ins en el período actual' },
                    { label: 'Total', value: checkIns.length, color: 'teal', sub: 'Histórico completo' },
                    { label: 'Promedio', value: checkIns.length > 0 ? `${(thisMonthCheckins / Math.max(1, new Date().getDate())).toFixed(1)}/día` : '—', color: 'accent', sub: 'Este mes' },
                  ].map((m) => (
                    <div key={m.label} className="relative bg-surface  rounded overflow-hidden p-[18px]">
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `var(--${m.color})` }} />
                      <div className="text-[11px] text-text-3 uppercase tracking-[0.06em] mb-2.5">{m.label}</div>
                      <div className="text-[26px] font-semibold leading-none -tracking-[0.03em]" style={{ color: `var(--${m.color}-text)` }}>{m.value}</div>
                      <div className="text-[11px] text-text-3 mt-1.5">{m.sub}</div>
                    </div>
                  ))}
                </div>

                {checkIns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-[60px] text-text-3">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span className="text-[14px]">Sin check-ins registrados</span>
                    <span className="text-[12px] mt-1">Este miembro no ha registrado asistencia.</span>
                  </div>
                ) : (
                  <div className="bg-surface  rounded overflow-hidden">
                    <ResponsiveTable
                      columns={checkinColumns}
                      data={checkIns}
                      keyExtractor={(c) => c.id}
                      cardTitle={(c) => fmtDate(c.check_in_time)}
                      cardSubtitle={(c) => new Date(c.check_in_time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      cardFields={[
                        { label: 'Método', value: (c) => <span className="text-[11px] text-text-2">{c.method === 'fingerprint' ? 'Huella' : c.method === 'card' ? 'Tarjeta' : 'Manual'}</span> },
                      ]}
                      emptyMessage="Sin check-ins registrados."
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal open={editModal} onClose={() => setEditModal(false)} title="Editar miembro" className="max-w-[400px]" icon={<IconEdit width="16" height="16" />}>
        <div className="flex flex-col gap-4">
          {[
            { label: 'Nombre completo', value: form.full_name, span: true },
            { label: 'Correo electrónico', value: form.email || '—' },
            { label: 'Teléfono', value: fmtPhone(form.phone) },
          ].map((f) => (
            <div key={f.label} className={`flex flex-col gap-1 px-3 py-2.5 rounded-2xl bg-surface2/50 border border-border ${f.span ? 'sm:col-span-2' : ''}`}>
              <span className="text-[10px] text-text-3 uppercase tracking-[0.06em] font-medium">{f.label}</span>
              <span className="text-[13px] text-text-2">{f.value}</span>
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] text-text-2 font-medium">Ref. interna</label>
            <input type="text" value={form.alias} onChange={(e) => setForm((f) => ({ ...f, alias: e.target.value }))}
              placeholder="Referencia para identificar al miembro"
              className="bg-surface2 border border-border2 text-text text-[13px] px-3 py-[9px] rounded-2xl outline-none w-full font-sans" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] text-text-2 font-medium">Rol</label>
            <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="bg-surface2 border border-border2 text-text text-[13px] px-3 py-[9px] rounded-2xl outline-none w-full font-sans">
              <option value="member">Miembro</option>
              <option value="trainer">Entrenador</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2.5 mt-2">
          <Button variant="ghost" onClick={() => setEditModal(false)} disabled={saving}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </Modal>
    </>
  );
}
