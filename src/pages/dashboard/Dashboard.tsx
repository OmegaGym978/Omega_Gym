import { useState, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '@/components/ui/layout/PageContainer';
import { useAuthStore } from '@/store/auth.store';
import { useCacheStore } from '@/store/cache.store';
import { dashboardService, type RecentActivityItem, type PendingPaymentItem, type DashboardKPIs, type ExpiringMembershipItem } from '@/services/dashboard.service';

const AV_COLORS = [
  { bg: 'var(--accent-dim)', fg: 'var(--accent)' },
  { bg: 'rgba(16,185,129,0.15)', fg: '#34d399' },
  { bg: 'rgba(244,114,182,0.15)', fg: '#f472b6' },
  { bg: 'rgba(168,85,247,0.15)', fg: '#c084fc' },
  { bg: 'rgba(251,146,60,0.15)', fg: '#fb923c' },
  { bg: 'rgba(20,184,166,0.15)', fg: '#2dd4bf' },
];

function IconPeople() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
function IconCard() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>; }
function IconClock() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>; }
function IconCheck() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>; }
function IconPlusMember() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>; }
function IconCreditCard() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>; }
function IconAlert() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>; }
function IconDollar() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>; }
function IconActivity() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>; }
function IconTrending() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>; }

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function fmtDateShort(s: string) {
  const [y, mo, d] = s.split('-');
  return `${parseInt(d)} ${MONTHS[parseInt(mo) - 1]} ${y}`;
}

function todayStr() {
  const n = new Date();
  return `${n.getDate()} ${MONTHS[n.getMonth()]} ${n.getFullYear()}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} horas`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return `ayer`;
  return `hace ${days} días`;
}

function initialsOf(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

const ROW = 'flex items-center gap-3 px-5 py-3 border-b border-divider last:border-b-0 no-underline transition-opacity active:opacity-70';

/** Tarjeta de métrica del bloque 2×2. */
function StatTile({ icon, value, label, tone }: { icon: ReactNode; value: number; label: string; tone: string }) {
  return (
    <div className="bg-surface rounded-[24px] p-5">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tone}`}>
        <div className="w-4 h-4">{icon}</div>
      </div>
      <div className="text-[26px] font-bold leading-none mt-3">{value}</div>
      <div className="text-[11px] text-text-2 mt-1.5 leading-tight">{label}</div>
    </div>
  );
}

/** Cabecera de sección agrupada. */
function SectionHeader({
  icon, tone, title, subtitle, trailing,
}: {
  icon: ReactNode; tone: string; title: string; subtitle?: string; trailing?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${tone}`}>
          <div className="w-4 h-4">{icon}</div>
        </div>
        <div className="min-w-0">
          <div className="text-[15px] font-semibold truncate">{title}</div>
          {subtitle && <div className="text-[11px] text-text-2 mt-0.5 truncate">{subtitle}</div>}
        </div>
      </div>
      {trailing}
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [pendingPayments, setPendingPayments] = useState<PendingPaymentItem[]>([]);
  const [expiring, setExpiring] = useState<ExpiringMembershipItem[]>([]);
  const [activities, setActivities] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const cacheGet = useCacheStore((s) => s.get);
  const cacheSet = useCacheStore((s) => s.set);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const cachedKpis = cacheGet<DashboardKPIs>('dashboard_kpis');
        const cachedPending = cacheGet<PendingPaymentItem[]>('dashboard_pending');
        const cachedExpiring = cacheGet<ExpiringMembershipItem[]>('dashboard_expiring');
        const cachedActivity = cacheGet<RecentActivityItem[]>('dashboard_activity');

        if (cachedKpis && cachedPending && cachedExpiring && cachedActivity) {
          setKpis(cachedKpis);
          setPendingPayments(cachedPending);
          setExpiring(cachedExpiring);
          setActivities(cachedActivity);
        } else {
          const [k, pp, e, a] = await Promise.all([
            dashboardService.getKPIs(),
            dashboardService.getPendingPayments(),
            dashboardService.getExpiringMemberships(7),
            dashboardService.getRecentActivity(10),
          ]);
          setKpis(k);
          setPendingPayments(pp);
          setExpiring(e);
          setActivities(a);
          cacheSet('dashboard_kpis', k);
          cacheSet('dashboard_pending', pp);
          cacheSet('dashboard_expiring', e);
          cacheSet('dashboard_activity', a);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [cacheGet, cacheSet]);

  const activityIcons: Record<string, { icon: ReactNode; cls: string }> = {
    check_in: { icon: <IconCheck />, cls: 'green' },
    new_member: { icon: <IconPlusMember />, cls: 'purple' },
    payment: { icon: <IconCreditCard />, cls: 'teal' },
    expired_membership: { icon: <IconAlert />, cls: 'red' },
    membership_assigned: { icon: <IconCard />, cls: 'green' },
  };

  const clsStyles: Record<string, string> = {
    green: 'bg-green-bg text-green-text',
    teal: 'bg-teal-bg text-teal-text',
    purple: 'bg-purple-bg text-purple-text',
    red: 'bg-red-bg text-red-text',
  };

  const firstName = user?.full_name?.split(' ')[0] || 'Admin';

  return (
    <>
      <div className="noise-overlay" />

      <header className="safe-top px-4 sm:px-5 pt-3 pb-1">
        <h1 className="font-ios text-[34px] font-bold leading-tight tracking-[-0.02em]">
          Buenos días, {firstName}
        </h1>
        <p className="text-[13px] text-text-2 mt-1">{todayStr()}</p>
      </header>

      <PageContainer className="flex-1">
        {loading ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="h-[104px] rounded-[24px] skeleton" />
              <div className="h-[104px] rounded-[24px] skeleton" />
              <div className="h-[104px] rounded-[24px] skeleton" />
              <div className="h-[104px] rounded-[24px] skeleton" />
            </div>
            <div className="h-[180px] rounded-[32px] skeleton" />
            <div className="h-[180px] rounded-[32px] skeleton" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Métricas 2×2 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatTile icon={<IconPeople />} value={kpis?.total_members ?? 0} label="Total de miembros" tone="bg-accent-dim text-accent" />
              <StatTile icon={<IconCard />} value={kpis?.active_memberships ?? 0} label="Membresías activas" tone="bg-green-bg text-green-text" />
              <StatTile icon={<IconAlert />} value={kpis?.inactive_members ?? 0} label="Inactivos" tone="bg-red-bg text-red-text" />
              <StatTile icon={<IconClock />} value={kpis?.expiring_soon ?? 0} label="Vencen en 7 días" tone="bg-amber-bg text-amber-text" />
            </div>

            {/* Pagos pendientes */}
            <section className="bg-surface rounded-[32px] overflow-hidden">
              <SectionHeader
                icon={<IconDollar />}
                tone="bg-amber-bg text-amber-text"
                title="Pagos pendientes"
                subtitle="Requieren atención"
                trailing={
                  <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-bg text-red-text">
                    {pendingPayments.length}
                  </span>
                }
              />

              {pendingPayments.length === 0 ? (
                <div className="flex items-center gap-3 px-5 pb-4 text-text-2">
                  <div className="w-8 h-8 rounded-full bg-green-bg text-green-text flex items-center justify-center shrink-0">
                    <div className="w-4 h-4"><IconCheck /></div>
                  </div>
                  <span className="text-[13px]">Sin pagos pendientes</span>
                </div>
              ) : (
                <div className="flex flex-col">
                  {pendingPayments.slice(0, 5).map((p, i) => {
                    const av = AV_COLORS[i % AV_COLORS.length];
                    return (
                      <Link key={p.id} to="/payments" className={ROW}>
                        <span className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                          style={{ background: av.bg, color: av.fg }}>
                          {initialsOf(p.member_name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-medium text-text truncate">{p.member_name}</span>
                          <span className="block text-[11px] text-text-2 mt-0.5">Pago pendiente</span>
                        </span>
                        <span className="shrink-0 text-[14px] font-semibold text-amber-text">${p.amount.toLocaleString()}</span>
                      </Link>
                    );
                  })}
                </div>
              )}

              <Link to="/payments" className="flex items-center justify-between px-5 py-3.5 border-t border-divider text-[13px] font-medium text-accent no-underline active:opacity-70">
                Ver todos los pagos
                <span aria-hidden="true">›</span>
              </Link>
            </section>

            {/* Membresías por vencer */}
            <section className="bg-surface rounded-[32px] overflow-hidden">
              <SectionHeader
                icon={<IconTrending />}
                tone="bg-amber-bg text-amber-text"
                title="Membresías por vencer"
                subtitle="Próximos 7 días"
              />

              {expiring.length === 0 ? (
                <div className="flex items-center gap-3 px-5 pb-4 text-text-2">
                  <div className="w-8 h-8 rounded-full bg-green-bg text-green-text flex items-center justify-center shrink-0">
                    <div className="w-4 h-4"><IconCheck /></div>
                  </div>
                  <span className="text-[13px]">Sin membresías por vencer</span>
                </div>
              ) : (
                <div className="flex flex-col">
                  {expiring.slice(0, 5).map((e, i) => {
                    const av = AV_COLORS[(e.member_name.length + i) % AV_COLORS.length];
                    const days = e.days_remaining === 0 ? 'Hoy' : e.days_remaining === 1 ? '1 día' : `${e.days_remaining} días`;
                    const urgent = e.days_remaining <= 1;
                    return (
                      <Link key={e.id} to="/memberships" className={ROW}>
                        <span className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                          style={{ background: av.bg, color: av.fg }}>
                          {initialsOf(e.member_name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-medium text-text truncate">{e.member_name}</span>
                          <span className="block text-[11px] text-text-2 mt-0.5 truncate">
                            {e.type_name} · vence {fmtDateShort(e.end_date)}
                          </span>
                        </span>
                        <span className={`shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${urgent ? 'bg-red-bg text-red-text' : 'bg-amber-bg text-amber-text'}`}>
                          {days}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}

              <Link to="/memberships" className="flex items-center justify-between px-5 py-3.5 border-t border-divider text-[13px] font-medium text-accent no-underline active:opacity-70">
                Ver membresías
                <span aria-hidden="true">›</span>
              </Link>
            </section>

            {/* Actividad reciente */}
            <section className="bg-surface rounded-[32px] overflow-hidden">
              <SectionHeader
                icon={<IconActivity />}
                tone="bg-purple-bg text-purple-text"
                title="Actividad reciente"
                subtitle="Últimas acciones en el sistema"
              />

              {activities.length === 0 ? (
                <div className="flex items-center gap-3 px-5 pb-4 text-text-2">
                  <div className="w-8 h-8 rounded-full bg-gray-bg text-gray-text flex items-center justify-center shrink-0">
                    <div className="w-4 h-4"><IconActivity /></div>
                  </div>
                  <span className="text-[13px]">Sin actividad reciente</span>
                </div>
              ) : (
                <div className="flex flex-col">
                  {activities.map((a, i) => {
                    const act = activityIcons[a.type] || { icon: <IconCheck />, cls: 'green' };
                    return (
                      <div key={a.id || i} className="flex items-center gap-3 px-5 py-3 border-b border-divider last:border-b-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${clsStyles[act.cls]}`}>
                          <div className="w-4 h-4">{act.icon}</div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] text-text-2 leading-relaxed">
                            <span className="font-semibold text-text">{a.userName}</span>{' '}{a.action}
                          </div>
                          <div className="text-[11px] text-text-3 mt-0.5">{timeAgo(a.timestamp)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </PageContainer>
    </>
  );
}
