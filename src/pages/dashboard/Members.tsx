import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/atoms/Button';
import { Badge } from '@/components/ui/atoms/Badge';
import { IconButton } from '@/components/ui/atoms/IconButton';
import { LoadingSpinner } from '@/components/ui/atoms/LoadingSpinner';
import { Modal } from '@/components/ui/molecules/Modal';
import { ScreenHeader } from '@/components/ui/layout/ScreenHeader';
import { SearchInput } from '@/components/ui/molecules/SearchInput';
import { TabBar } from '@/components/ui/molecules/TabBar';
import { Pagination } from '@/components/ui/molecules/Pagination';
import { MetricCard } from '@/components/ui/atoms/MetricCard';
import { ProfileField } from '@/components/ui/molecules/ProfileField';
import { IconPlus, IconEye, IconEdit, IconTrash, IconAlert, IconLock } from '@/lib/icons';
import { initials, avatarIndex, fmtDate, fmtPhone, daysDiff, getErrorMessage, AVATAR_COLORS } from '@/lib/helpers';
import { canAdminEditProfile } from '@/lib/member-edit';
import { membersService, type MemberListItem } from '@/services/members.service';
import { supabase } from '@/lib/supabase';
import { ResponsiveTable, type Column } from '@/components/ui/molecules/ResponsiveTable';
import { SelectMenu } from '@/components/ui/molecules/SelectMenu';
import { useScrollTopOnPageChange } from '@/hooks/useScrollTopOnPageChange';
import { toast } from 'sonner';

const ROWS_PER_PAGE = 8;
type Role = 'admin' | 'trainer' | 'member';
type FilterKey = 'all' | Role | 'inactive' | 'pending' | 'no-membership';

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'member', label: 'Miembro' },
  { value: 'trainer', label: 'Entrenador' },
  { value: 'admin', label: 'Admin' },
];

interface Member {
  id: string;
  name: string;
  alias: string | null;
  email: string;
  phone: string | null;
  role: Role;
  status: 'active' | 'inactive';
  registration_status: 'pending' | 'claimed' | 'registered';
  membresia: string | null;
  vence: string | null;
  plan_names: string[];
  av: number;
  joinedAt: string;
}

function toMember(item: MemberListItem): Member {
  return {
    id: item.id,
    name: item.full_name,
    alias: item.alias,
    email: item.email ?? '',
    phone: item.phone,
    role: item.role,
    status: item.is_active ? 'active' : 'inactive',
    registration_status: item.registration_status ?? 'registered',
    membresia: item.membership_type,
    vence: item.membership_end,
    plan_names: item.plan_names,
    av: avatarIndex(item.id),
    joinedAt: item.created_at,
  };
}

/**
 * Buscador con debounce local: mantiene el texto en su propio estado y solo
 * notifica al padre 400 ms después de la última tecla. Así el listado no se
 * vuelve a renderizar en cada pulsación.
 */
function DebouncedMemberSearch({ onSearch }: { onSearch: (value: string) => void }) {
  const [text, setText] = useState('');
  useEffect(() => {
    const id = setTimeout(() => onSearch(text), 400);
    return () => clearTimeout(id);
  }, [text, onSearch]);
  return <SearchInput value={text} onChange={setText} placeholder="Buscar por nombre..." />;
}

function renderMembership(m: Member) {
  const diffVal = daysDiff(m.vence);
  const diff = diffVal !== null ? -diffVal : null;
  if (!m.membresia) return <span className="text-[12px] text-text-3">Sin membresía</span>;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[12px] text-text-2">{m.membresia}</span>
      {diff !== null && diff < 0 && <span className="text-[11px] text-red-text">Venció hace {Math.abs(diff)}d</span>}
      {diff !== null && diff >= 0 && diff <= 7 && <span className="text-[11px] text-amber-text">Vence en {diff}d</span>}
      {diff !== null && diff > 7 && <span className="text-[11px] text-text-3">Vence {fmtDate(m.vence)}</span>}
    </div>
  );
}

function renderStatusBadge(m: Member) {
  if (m.registration_status === 'pending') {
    return <Badge variant="amber" dot>Pendiente</Badge>;
  }
  return m.status === 'active'
    ? <Badge variant="green" dot>Activo</Badge>
    : <Badge variant="red" dot>Inactivo</Badge>;
}

export default function MembersPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isTrainer = user?.role === 'trainer';
  const [members, setMembers] = useState<Member[]>([]);
  const [searchParams] = useSearchParams();
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<FilterKey>(() =>
    searchParams.get('role') === 'trainer' ? 'trainer' : 'all',
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [unlinkTarget, setUnlinkTarget] = useState<Member | null>(null);

  const [fName, setFName] = useState('');
  const [fRole, setFRole] = useState<Role>('member');

  const [previewTarget, setPreviewTarget] = useState<Member | null>(null);
  const [detailTarget, setDetailTarget] = useState<Member | null>(null);
  const [dForm, setDForm] = useState({ full_name: '', email: '', phone: '', role: '', alias: '' });
  const [detailSaving, setDetailSaving] = useState(false);

  // Ordenamiento híbrido: el id del último miembro creado/editado se antepone
  // temporalmente. Es estado de memoria: al recargar o salir de la vista se pierde.
  const [lastTouchedId, setLastTouchedId] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const [linkTarget, setLinkTarget] = useState<Member | null>(null);
  const [linkSearch, setLinkSearch] = useState('');
  const [linkCandidates, setLinkCandidates] = useState<{
    id: string; full_name: string; alias: string | null; email: string | null; phone: string | null; created_at: string;
  }[]>([]);
  const [linkLoading, setLinkLoading] = useState(false);

  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, inactive: 0 });

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filterRole = currentFilter === 'member' || currentFilter === 'no-membership' ? 'member'
        : currentFilter === 'trainer' ? 'trainer'
        : undefined;
      const filterStatus = currentFilter === 'inactive' ? 'inactive' : undefined;
      const filterRegistration = currentFilter === 'pending' ? 'pending' : undefined;

      const result = await membersService.getAll({
        search: search || undefined,
        role: filterRole,
        status: filterStatus,
        registration: filterRegistration,
        withoutActiveMembership: currentFilter === 'no-membership' ? true : undefined,
        page: currentPage,
        pageSize: ROWS_PER_PAGE,
        pinnedId: lastTouchedId ?? undefined,
      })

      setMembers(result.data.map(toMember));
      setTotal(result.count);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [currentFilter, search, currentPage, lastTouchedId]);

  const bootstrappedRef = useRef(false);

  /**
   * En la primera carga se refresca la sesión y se sincronizan los estados de
   * membresía (una sola vez). Las búsquedas y la paginación hacen **una** única
   * petición: antes eran `refreshSession` + RPC + consulta por cada tecla.
   */
  useEffect(() => {
    let cancelled = false;
    const firstRun = !bootstrappedRef.current;
    bootstrappedRef.current = true;

    const prep = firstRun
      ? supabase.auth
          .refreshSession()
          .catch(() => undefined)
          .then(() => membersService.syncStatuses())
          .catch(() => undefined)
      : Promise.resolve();

    void prep.then(() => {
      if (!cancelled) fetchMembers();
    });

    return () => { cancelled = true; };
  }, [fetchMembers, refreshNonce]);

  // Las métricas no dependen de la búsqueda: se piden solo al entrar y tras
  // crear, editar o borrar.
  useEffect(() => {
    let cancelled = false;
    membersService.getStats()
      .then((s) => { if (!cancelled) setStats(s); })
      .catch(() => { /* informativas: se conservan las anteriores */ });
    return () => { cancelled = true; };
  }, [refreshNonce]);

  const totalPages = Math.max(1, Math.ceil(total / ROWS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  useScrollTopOnPageChange(currentPage);

  // Red de seguridad: el servicio ya entrega el orden A-Z con el fijado primero;
  // si por cualquier motivo la fila fijada llega más abajo, se sube aquí.
  const displayMembers = useMemo(() => {
    if (!lastTouchedId) return members;
    const idx = members.findIndex((m) => m.id === lastTouchedId);
    if (idx <= 0) return members;
    return [members[idx], ...members.slice(0, idx), ...members.slice(idx + 1)];
  }, [members, lastTouchedId]);

  const resetForm = useCallback(() => {
    setFName(''); setFRole('member');
  }, []);

  /** Estable: evita reiniciar el debounce del buscador en cada render. */
  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1);
    setLastTouchedId(null);
  }, []);

  const guardarMiembro = useCallback(async () => {
    if (!fName.trim()) return;
    try {
      const created = await membersService.create({
        full_name: fName.trim(),
        role: fRole,
      });
      setModalOpen(false);
      resetForm();
      setLastTouchedId(created.id);
      setCurrentPage(1);
      setRefreshNonce((n) => n + 1);
      toast.success('Miembro pendiente creado. Deberás vincularlo cuando se registre.');
    } catch (e) {
      toast.error(getErrorMessage(e, 'Error al crear miembro'));
    }
  }, [fName, fRole, resetForm]);

  const guardarDetail = useCallback(async () => {
    if (!detailTarget) return;
    // Solo se envían los datos personales si el perfil aún no tiene cuenta:
    // con cuenta existente el miembro es dueño de esa información.
    const canEditProfile = canAdminEditProfile(detailTarget.registration_status);
    setDetailSaving(true);
    try {
      await membersService.update(detailTarget.id, {
        ...(canEditProfile ? {
          full_name: dForm.full_name.trim(),
          email: dForm.email.trim() || null,
          phone: dForm.phone.trim() || null,
        } : {}),
        // El rol lo gestiona el admin sin importar el estado de la cuenta.
        ...(isTrainer ? {} : { role: dForm.role as Role }),
        alias: dForm.alias.trim() || undefined,
      });
      toast.success('Miembro actualizado');
      setDetailTarget(null);
      setLastTouchedId(detailTarget.id);
      setCurrentPage(1);
      setRefreshNonce((n) => n + 1);
    } catch (e) {
      toast.error('Error al guardar: ' + getErrorMessage(e));
    } finally {
      setDetailSaving(false);
    }
  }, [detailTarget, dForm, isTrainer]);

  const editMember = useCallback((member: Member) => {
    setDetailTarget(member);
    setDForm({
      full_name: member.name,
      email: member.email,
      phone: member.phone ?? '',
      role: member.role,
      alias: member.alias ?? '',
    });
  }, []);

  const openLinkModal = useCallback(async (member: Member) => {
    setLinkTarget(member);
    setLinkSearch('');
    setLinkLoading(true);
    try {
      const candidates = await membersService.getUnlinkedCandidates();
      setLinkCandidates(candidates || []);
    } catch {
      setLinkCandidates([]);
    } finally {
      setLinkLoading(false);
    }
  }, []);

  const searchLinkCandidates = useCallback(async (q: string) => {
    setLinkSearch(q);
    setLinkLoading(true);
    try {
      const candidates = await membersService.getUnlinkedCandidates(q || undefined);
      setLinkCandidates(candidates || []);
    } catch {
      setLinkCandidates([]);
    } finally {
      setLinkLoading(false);
    }
  }, []);

  const confirmLink = useCallback(async (registeredId: string) => {
    if (!linkTarget) return;
    try {
      await membersService.linkPendingProfile(linkTarget.id, registeredId);
      toast.success(`"${linkTarget.name}" vinculado exitosamente`);
      setLinkTarget(null);
      setLinkCandidates([]);
      setRefreshNonce((n) => n + 1);
    } catch (e) {
      toast.error('Error al vincular: ' + getErrorMessage(e, ''));
    }
  }, [linkTarget]);

  const handleUnlink = useCallback(() => {
    if (!detailTarget) return;
    setUnlinkTarget(detailTarget);
  }, [detailTarget]);

  const confirmUnlink = useCallback(async () => {
    const target = unlinkTarget;
    if (!target) return;
    try {
      await membersService.unlink(target.id);
      toast.success('Desvinculado correctamente');
      setDetailTarget(null);
      setUnlinkTarget(null);
      setRefreshNonce((n) => n + 1);
    } catch (e) {
      toast.error('Error al desvincular: ' + getErrorMessage(e, ''));
      setUnlinkTarget(null);
    }
  }, [unlinkTarget]);

  const deleteMember = useCallback((member: Member) => {
    setDeleteTarget(member);
  }, []);

  const confirmDelete = useCallback(async () => {
    const target = deleteTarget;
    if (!target) return;
    try {
      await membersService.hardDelete(target.id);
      toast.success(`Miembro"${target.name}" eliminado correctamente`);
      setDeleteTarget(null);
      // Si el eliminado era el registro fijado, se limpia para no dejar un pin huérfano.
      setLastTouchedId((prev) => (prev === target.id ? null : prev));
      setRefreshNonce((n) => n + 1);
    } catch (e) {
      toast.error('Error al eliminar: ' + getErrorMessage(e));
      setDeleteTarget(null);
    }
  }, [deleteTarget]);

  const filters = [
    { key: 'all' as FilterKey, label: 'Todos' },
    { key: 'member' as FilterKey, label: 'Miembros' },
    { key: 'trainer' as FilterKey, label: 'Entrenadores' },
    { key: 'pending' as FilterKey, label: 'Pendientes' },
    { key: 'inactive' as FilterKey, label: 'Inactivos' },
    { key: 'no-membership' as FilterKey, label: 'Sin membresía' },
  ];

  const memberColumns = useMemo<Column<Member>[]>(() => [
    {
      key: 'name',
      label: 'Miembro',
      render: (m) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold flex-shrink-0"
            style={{ background: AVATAR_COLORS[m.av].bg, color: AVATAR_COLORS[m.av].fg }}>
            {initials(m.name)}
          </div>
          <div>
            <div className="font-medium text-[13px]">{m.name}</div>
            <div className="text-[11px] text-text-3 mt-0.5">{m.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Rol',
      hide: 'lg',
      render: (m) => (
        <>{m.role === 'admin' ? <Badge variant="accent" dot>Admin</Badge> : m.role === 'trainer' ? <Badge variant="teal" dot>Entrenador</Badge> : <Badge variant="gray" dot>Miembro</Badge>}</>
      ),
    },
    {
      key: 'phone',
      label: 'Teléfono',
      hide: 'lg',
      render: (m) => <span className="text-[12px] text-text-2">{fmtPhone(m.phone)}</span>,
    },
    {
      key: 'membership',
      label: 'Membresía activa',
      render: (m) => renderMembership(m),
    },
    {
      key: 'plan',
      label: 'Plan asignado',
      hide: 'lg',
      render: (m) => (
        m.plan_names.length > 0 ? (
          <span className="inline-flex items-center gap-1 px-[9px] py-[3px] rounded-full text-[11px] font-medium"
            style={{
              background: 'rgba(129, 140, 248, 0.10)',
              color: '#818cf8',
              border: '1px solid rgba(129, 140, 248, 0.22)',
            }}>
            {m.plan_names[0]}
            {m.plan_names.length > 1 && (
              <span className="inline-flex items-center px-[5px] py-[1px] rounded-full text-[9px] font-bold leading-none"
                style={{ background: 'rgba(129, 140, 248, 0.18)', color: '#818cf8' }}>
                +{m.plan_names.length - 1}
              </span>
            )}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-[9px] py-[3px] rounded-full text-[11px]"
            style={{
              color: '#52525b',
              border: '1px dashed rgba(255, 255, 255, 0.08)',
            }}>
            Sin plan
          </span>
        )
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (m) => renderStatusBadge(m),
    },
    {
      key: 'alias',
      label: 'Ref. interna',
      hide: 'lg',
      render: (m) => (
        m.alias
          ? <span className="inline-flex items-center gap-1.5 px-[9px] py-[3px] rounded-full text-[11px] bg-surface2 text-accent-text border border-border">{m.alias}</span>
          : <span className="text-text-3 text-[12px]">—</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (m) => (
        <div className="flex gap-1.5 justify-end">
          <IconButton title="Vista rápida" onClick={() => setPreviewTarget(m)}><IconEye width="13" height="13" /></IconButton>
          <IconButton title="Editar" onClick={() => editMember(m)}><IconEdit width="13" height="13" /></IconButton>
          {m.registration_status === 'pending' && (
            <IconButton title="Vincular con usuario registrado" onClick={() => openLinkModal(m)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            </IconButton>
          )}
          <IconButton title="Eliminar" danger onClick={() => deleteMember(m)}><IconTrash width="13" height="13" /></IconButton>
        </div>
      ),
    },
  ], [editMember, openLinkModal, deleteMember]);

  return (
    <>
      <ScreenHeader
        title="Miembros"
        subtitle="Socios, roles y estado de membresía"
        wide
        actions={
          <Button variant="plain" onClick={() => { resetForm(); setModalOpen(true); }} icon={<IconPlus />}>
            Nuevo miembro
          </Button>
        }
      />

      <div className="px-4 sm:px-6 py-4 flex-1 mx-auto w-full max-w-[720px]">
        {/* KPI Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
          <div className="animate-slide-up stagger-1">
            <MetricCard icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            } color="accent" value={stats.total} label="Total miembros" />
          </div>
          <div className="animate-slide-up stagger-2">
            <MetricCard icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            } color="green" value={stats.active} label="Activos" />
          </div>
          <div className="animate-slide-up stagger-3">
            <MetricCard icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            } color="red" value={stats.inactive} label="Inactivos" />
          </div>
          <div className="animate-slide-up stagger-4">
            <MetricCard icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            } color="amber" value={stats.pending} label="Pendientes" />
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
          <DebouncedMemberSearch onSearch={handleSearch} />
          <TabBar tabs={filters} active={currentFilter} onChange={(k) => { setCurrentFilter(k as FilterKey); setCurrentPage(1); setLastTouchedId(null); }} />
        </div>

        {/* Loading inicial (sin filas todavía) */}
        {loading && members.length === 0 && <LoadingSpinner text="Cargando miembros…" />}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-[60px] text-red-text">Error: {error}</div>
        )}

        {/* Table / Cards (se mantienen las filas previas mientras se busca) */}
        {!error && (members.length > 0 || !loading) && (
          <>
            {loading && (
              <div className="mb-2 text-right text-[11px] text-text-3">Actualizando…</div>
            )}
            <ResponsiveTable

              columns={memberColumns}
              data={displayMembers}
              keyExtractor={(m) => m.id}
              cardTitle={(m) => m.name}
              cardSubtitle={(m) => m.email}
              cardAvatar={(m) => {
                const c = AVATAR_COLORS[m.av];
                return (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0"
                    style={{ background: c.bg, color: c.fg }}>
                    {initials(m.name)}
                  </div>
                );
              }}
              cardFields={[
                { label: 'Rol', value: (m: Member) => (
                  <>{m.role === 'admin' ? <Badge variant="accent" dot>Admin</Badge> : m.role === 'trainer' ? <Badge variant="teal" dot>Entrenador</Badge> : <Badge variant="gray" dot>Miembro</Badge>}</>
                )},
                { label: 'Estado', value: (m: Member) => renderStatusBadge(m) },
                { label: 'Ref. interna', value: (m: Member) => (
                  m.alias
                    ? <span className="inline-flex items-center gap-1.5 px-[9px] py-[3px] rounded-full text-[11px] bg-surface2 text-accent-text border border-border">{m.alias}</span>
                    : <span className="text-text-3">—</span>
                )},
                { label: 'Teléfono', value: (m: Member) => fmtPhone(m.phone) },
                { label: 'Membresía', value: (m: Member) => renderMembership(m) },
                { label: 'Plan', value: (m: Member) => (
                  m.plan_names.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-[9px] py-[3px] rounded-full text-[11px] bg-surface2 text-text-2 border border-border">
                      {m.plan_names[0]}
                      {m.plan_names.length > 1 && (
                        <span className="inline-flex items-center px-[5px] py-[1px] rounded-full text-[9px] font-bold leading-none bg-accent-dim text-accent border border-accent/30">+{m.plan_names.length - 1}</span>
                      )}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-[9px] py-[3px] rounded-full text-[11px] text-text-3 border border-dashed border-border">Sin plan</span>
                  )
                )},
              ]}
              cardActions={(m: Member) => (
                <div className="flex gap-1.5 justify-end">
                  <IconButton title="Vista rápida" onClick={() => setPreviewTarget(m)}><IconEye width="13" height="13" /></IconButton>
                  <IconButton title="Editar" onClick={() => editMember(m)}><IconEdit width="13" height="13" /></IconButton>
                  {m.registration_status === 'pending' && (
                    <IconButton title="Vincular" onClick={() => openLinkModal(m)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    </IconButton>
                  )}
                  <IconButton title="Eliminar" danger onClick={() => deleteMember(m)}><IconTrash width="13" height="13" /></IconButton>
                </div>
              )}
              emptyMessage="No se encontraron miembros con ese criterio."
            />

            <Pagination
              current={safePage}
              total={totalPages}
              start={(safePage - 1) * ROWS_PER_PAGE}
              end={Math.min(safePage * ROWS_PER_PAGE, total)}
              totalItems={total}
              label="miembros"
              onChange={(page) => { setCurrentPage(page); setLastTouchedId(null); }}
            />
          </>
        )}
      </div>

      {modalOpen && (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo miembro" className="max-w-[400px]" icon={<IconPlus width="16" height="16" />}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-text-3 uppercase tracking-[0.06em] font-medium">Nombre completo</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3/50 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <input type="text" placeholder="Ej. María González" value={fName} onChange={(e) => setFName(e.target.value)}
                  className="w-full bg-surface2 border border-border2 text-text text-[13px] pl-9 pr-3 py-[10px] rounded-2xl outline-none font-sans
                    placeholder:text-text-3/40 transition-all duration-150
                    focus:border-accent/60 focus:ring-1 focus:ring-accent/30" />
              </div>
            </div>
  
            {!isTrainer && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-text-3 uppercase tracking-[0.06em] font-medium">Rol</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { value: 'member' as Role, label: 'Miembro', desc: 'Acceso a su plan' },
                  { value: 'trainer' as Role, label: 'Entrenador', desc: 'Gestiona planes' },
                  { value: 'admin' as Role, label: 'Admin', desc: 'Control total' },
                ].map((r) => {
                  const selected = fRole === r.value;
                  return (
                    <button key={r.value} type="button" onClick={() => setFRole(r.value)}
                      className={`relative flex flex-col items-center gap-0.5 p-2.5 rounded-2xl border text-center transition-all duration-150 cursor-pointer font-sans
                        ${selected
                          ? 'border-accent bg-accent/8 ring-1 ring-accent/35'
                          : 'border-border2 bg-surface2'
                        }`}
                    >
                      <span className={`text-[12px] font-semibold leading-tight ${selected ? 'text-accent' : 'text-text'}`}>
                        {r.label}
                      </span>
                      <span className={`text-[9px] leading-tight ${selected ? 'text-accent/70' : 'text-text-3/60'}`}>
                        {r.desc}
                      </span>
                      {selected && (
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-accent flex items-center justify-center">
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            )}
  
            <div className="flex items-start gap-2.5 p-4 rounded-tile bg-surface2 text-[11px] text-text-3 leading-relaxed">
              <svg className="mt-0.5 shrink-0 text-accent" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <span>Se crea un perfil <strong className="text-text-2">pendiente</strong> con solo el nombre. Cuando la persona se registre, vincúlalo desde la lista con el botón <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline align-middle"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>.</span>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 mt-1">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={guardarMiembro} disabled={!fName.trim()}>
              Guardar miembro
            </Button>
          </div>
        </Modal>
      )}

      {previewTarget !== null && (
        <Modal compact icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        } title="VISTA RÁPIDA" open={previewTarget !== null} onClose={() => setPreviewTarget(null)}>
          {previewTarget && (() => {
            const m = previewTarget;
            const av = AVATAR_COLORS[m.av];
            return (
              <div className="flex flex-col gap-0">
                <div className="flex flex-col items-center mb-5">
                  <div className="w-[64px] h-[64px] rounded-full flex items-center justify-center text-[22px] font-semibold mb-3"
                    style={{ background: av.bg, color: av.fg }}>
                    {initials(m.name)}
                  </div>
                  <div className="text-[17px] font-semibold">{m.name}</div>
                  <div className="flex gap-1.5 mt-1.5">
                    {m.role === 'admin' ? <Badge variant="accent" dot>Admin</Badge> : m.role === 'trainer' ? <Badge variant="teal" dot>Entrenador</Badge> : <Badge variant="gray" dot>Miembro</Badge>}
                    {m.registration_status === 'pending'
                      ? <Badge variant="amber" dot>Pendiente</Badge>
                      : m.status === 'active'
                        ? <Badge variant="green" dot>Activo</Badge>
                        : <Badge variant="red" dot>Inactivo</Badge>
                    }
                  </div>
                </div>
  
                <div className="border-t border-border pt-4 space-y-3">
                  {m.alias && (
                    <div className="flex items-center gap-2.5">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-3 shrink-0">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                      <span className="text-[12px] text-accent-text">{m.alias}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-3 shrink-0">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span className="text-[12px] text-text-2">{m.email || <span className="text-text-3">—</span>}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-3 shrink-0">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span className="text-[12px] text-text-2">{fmtPhone(m.phone)}</span>
                  </div>
                </div>
  
                <div className="mt-5 pt-4 border-t border-border">
                  <div className="text-[11px] text-text-3 uppercase tracking-[0.08em] mb-3">Membresía</div>
                  {m.membresia ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-surface2 rounded px-3 py-2.5">
                        <div className="text-[10px] text-text-3 uppercase tracking-[0.06em]">Plan</div>
                        <div className="text-[13px] font-medium mt-0.5">{m.membresia}</div>
                      </div>
                      <div className="bg-surface2 rounded px-3 py-2.5">
                        <div className="text-[10px] text-text-3 uppercase tracking-[0.06em]">Vencimiento</div>
                        <div className="text-[12px] mt-0.5">{m.vence ? fmtDate(m.vence) : '—'}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[13px] text-text-3">Sin membresía activa</div>
                  )}
                </div>
  
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-[11px] text-text-3 uppercase tracking-[0.08em] mb-3">Plan de entrenamiento</div>
                  {m.plan_names.length > 0 ? (
                    <div className="flex items-center gap-2 bg-surface2 rounded px-3 py-2.5 border border-border w-fit">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-3 shrink-0">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                      <span className="text-[13px] text-text-2">{m.plan_names[0]}</span>
                      {m.plan_names.length > 1 && (
                        <span className="inline-flex items-center px-[6px] py-[1px] rounded-full text-[10px] font-semibold bg-accent-dim text-accent border border-accent/30">+{m.plan_names.length - 1}</span>
                      )}
                    </div>
                  ) : (
                    <div className="text-[13px] text-text-3">Sin plan asignado</div>
                  )}
                </div>
              </div>
            );
          })()}
          <div className="mt-5 pt-4 border-t border-border text-center">
              <Button variant="primary" onClick={() => { setPreviewTarget(null); navigate(`/members/${previewTarget!.id}`); }}>
              Ver perfil
            </Button>
          </div>
        </Modal>
      )}

      {detailTarget !== null && (
        <Modal
          open={detailTarget !== null}
          onClose={() => setDetailTarget(null)}
          title={detailTarget?.name ?? ''}
          maxWidth="540px"
          icon={<IconEdit width="16" height="16" />}
        >
          {detailTarget && (() => {
            const avatar = AVATAR_COLORS[detailTarget.av];
            // El perfil solo es editable mientras no exista cuenta vinculada.
            // El rol es la excepción: el admin siempre puede cambiarlo.
            const canEditProfile = canAdminEditProfile(detailTarget.registration_status);
            return (
              <>
                {/* Cabecera mínima: el nombre ya está en el título, solo avatar y estado. */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-semibold shrink-0"
                    style={{ background: avatar.bg, color: avatar.fg }}>
                    {initials(detailTarget.name)}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {detailTarget.registration_status === 'pending'
                      ? <Badge variant="amber" dot>Pendiente</Badge>
                      : detailTarget.status === 'active'
                        ? <Badge variant="green" dot>Activo</Badge>
                        : <Badge variant="red" dot>Inactivo</Badge>}
                  </div>
                </div>

                {/* Inset grouped: datos del perfil + rol en una sola tarjeta.
                    Sin `overflow-hidden`: recortaría el menú de Rol al abrirse. */}
                <div className="bg-surface rounded-[24px] divide-y divide-divider">
                  <ProfileField
                    label="Nombre"
                    value={dForm.full_name}
                    onChange={canEditProfile ? (v) => setDForm((f) => ({ ...f, full_name: v })) : undefined}
                    disabled={detailSaving}
                    placeholder="Nombre completo"
                    autoComplete="off"
                  />
                  <ProfileField
                    label="Correo"
                    type="email"
                    inputMode="email"
                    value={dForm.email}
                    onChange={canEditProfile ? (v) => setDForm((f) => ({ ...f, email: v })) : undefined}
                    disabled={detailSaving}
                    placeholder="correo@ejemplo.com"
                    autoComplete="off"
                  />
                  <ProfileField
                    label="Teléfono"
                    type="tel"
                    inputMode="tel"
                    value={dForm.phone}
                    displayValue={fmtPhone(dForm.phone)}
                    onChange={canEditProfile ? (v) => setDForm((f) => ({ ...f, phone: v })) : undefined}
                    disabled={detailSaving}
                    placeholder="33 1234 5678"
                    autoComplete="off"
                  />
                  <div className="relative flex items-center gap-3 px-4 py-3">
                    <span className="text-[12px] text-text-3 shrink-0">Rol</span>
                    {isTrainer ? (
                      <span className="flex-1 min-w-0 text-right text-[13px] text-text-2">
                        {dForm.role === 'member' ? 'Miembro' : dForm.role === 'trainer' ? 'Entrenador' : 'Admin'}
                      </span>
                    ) : (
                      <SelectMenu
                        className="flex-1 min-w-0"
                        value={dForm.role as Role}
                        options={ROLE_OPTIONS}
                        onChange={(role) => setDForm((f) => ({ ...f, role }))}
                        ariaLabel="Rol del miembro"
                      />
                    )}
                  </div>
                </div>

                {!canEditProfile && (
                  <p className="flex items-start gap-1.5 px-1 text-[11px] leading-relaxed text-text-3">
                    <IconLock width="12" height="12" className="mt-0.5 shrink-0" />
                    Este miembro ya tiene cuenta y administra sus datos desde la app. Solo puedes cambiar el rol y la referencia interna.
                  </p>
                )}
  
                {/* Ref. interna: campo especial de admin, marcado solo por el acento. */}
                <div className="bg-surface rounded-[24px] px-4 py-3">
                  <label htmlFor="member-alias" className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] font-semibold text-accent">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Ref. interna
                    <span className="ml-auto text-[9px] tracking-[0.08em] text-accent/70">Admin</span>
                  </label>
                  <input
                    id="member-alias"
                    type="text"
                    value={dForm.alias}
                    onChange={(e) => setDForm((f) => ({ ...f, alias: e.target.value }))}
                    placeholder="Referencia para identificar al miembro"
                    className="mt-1.5 w-full bg-transparent border-none outline-none text-[13px] text-text font-sans placeholder:text-text-3/40"
                  />
                </div>
  
                {/* Una sola acción principal; el peligro queda como texto secundario. */}
                <div className="flex flex-col gap-1 pt-1">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={guardarDetail}
                    disabled={detailSaving || (canEditProfile && !dForm.full_name.trim())}
                  >
                    {detailSaving ? 'Guardando…' : 'Guardar cambios'}
                  </Button>
                  {detailTarget.registration_status === 'registered' && (
                    <button
                      type="button"
                      onClick={handleUnlink}
                      disabled={detailSaving}
                      className="mx-auto mt-2 px-3 py-2 bg-transparent border-none text-[12px] text-red-text/80 hover:text-red-text transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-sans"
                    >
                      Desvincular cuenta
                    </button>
                  )}
                </div>
              </>
            );
          })()}
        </Modal>
      )}

      {linkTarget !== null && (
        <Modal open={linkTarget !== null} onClose={() => setLinkTarget(null)} title="Vincular perfil pendiente" className="max-w-[540px] w-full" icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        }>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0"
                style={{ background: linkTarget ? AVATAR_COLORS[avatarIndex(linkTarget.id)].bg : 'var(--surface2)', color: linkTarget ? AVATAR_COLORS[avatarIndex(linkTarget.id)].fg : 'var(--text-3)' }}>
                {linkTarget ? initials(linkTarget.name) : '?'}
              </div>
              <div>
                <div className="text-[14px] font-semibold">{linkTarget?.name}</div>
                <div className="text-[11px] text-text-3">Perfil pendiente — busca el usuario registrado para vincular</div>
              </div>
            </div>
  
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre, email o teléfono..."
                value={linkSearch}
                onChange={(e) => searchLinkCandidates(e.target.value)}
                className="w-full bg-surface2 border border-border2 text-text text-[13px] px-3 py-[9px] pl-9 rounded-2xl outline-none font-sans"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
  
            {linkLoading ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                <span className="text-[12px] text-text-3">Buscando usuarios...</span>
              </div>
            ) : linkCandidates.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2 text-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-3/40">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span className="text-[13px] text-text-3">No hay usuarios registrados sin vincular</span>
                <span className="text-[11px] text-text-3/60">Los usuarios deben registrarse primero para poder vincularlos</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-[320px] overflow-y-auto scrollbar-none">
                {linkCandidates.map((c) => (
                  <div key={c.id}
                    className="flex items-center gap-3 p-3 rounded-tile bg-surface2/50 border border-border transition-colors group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium">{c.full_name}</span>
                        {c.alias && c.alias !== c.full_name && (
                          <span className="text-[11px] text-text-3 truncate max-w-[120px]">({c.alias})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {c.email && <span className="text-[11px] text-text-3">{c.email}</span>}
                        {c.email && c.phone && <span className="text-[8px] text-text-3/40">·</span>}
                        {c.phone && <span className="text-[11px] text-text-3">{fmtPhone(c.phone)}</span>}
                      </div>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => confirmLink(c.id)}
                      className="shrink-0">
                      Vincular
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {deleteTarget !== null && (
        <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Eliminar miembro" className="max-w-[400px]" icon={<IconAlert width="16" height="16" />}>
          <div className="flex flex-col gap-4">
            <div className="text-[13px] text-text-1 leading-relaxed">
              ¿Estás seguro de eliminar permanentemente a <strong>{deleteTarget?.name}</strong>?
            </div>
            <div className="text-[12px] text-red-text bg-red-bg rounded-tile p-3.5 leading-relaxed">
              Se borrarán del sistema: perfil, membresías, pagos, planes de entrenamiento, check-ins y su cuenta de usuario.
              Esta acción no se puede deshacer.
            </div>
          </div>
          <div className="flex justify-end gap-2.5 mt-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDelete}>Eliminar</Button>
          </div>
        </Modal>
      )}

      {unlinkTarget !== null && (
        <Modal open={unlinkTarget !== null} onClose={() => setUnlinkTarget(null)} title="Desvincular cuenta" className="max-w-[400px]" icon={<IconAlert width="16" height="16" />}>
          <div className="flex flex-col gap-4">
            <div className="text-[13px] text-text-1 leading-relaxed">
              ¿Desvincular cuenta de <strong>{unlinkTarget?.name}</strong>?
            </div>
            <div className="text-[12px] text-amber-text bg-amber-bg rounded-tile p-3.5 leading-relaxed">
              El perfil volverá a estado pendiente sin perder membresías, pagos ni historial.
            </div>
          </div>
          <div className="flex justify-end gap-2.5 mt-2">
            <Button variant="ghost" onClick={() => setUnlinkTarget(null)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmUnlink}>Desvincular</Button>
          </div>
        </Modal>
      )}
    </>
  );
}
