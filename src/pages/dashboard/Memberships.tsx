import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useCacheStore } from '@/store/cache.store';
import { membershipsService, type MembershipListItem, type MembershipType } from '@/services/memberships.service';
import { membersService, type MemberListItem } from '@/services/members.service';
import { paymentsService } from '@/services/payments.service';
import { Modal } from '@/components/ui/molecules/Modal';
import { DatePicker } from '@/components/ui/molecules/DatePicker';
import { Button } from '@/components/ui/atoms/Button';
import { Badge } from '@/components/ui/atoms/Badge';
import { IconButton } from '@/components/ui/atoms/IconButton';
import { LoadingSpinner } from '@/components/ui/atoms/LoadingSpinner';
import { ScreenHeader } from '@/components/ui/layout/ScreenHeader';
import { SearchInput } from '@/components/ui/molecules/SearchInput';
import { TabBar } from '@/components/ui/molecules/TabBar';
import { Pagination } from '@/components/ui/molecules/Pagination';
import { ResponsiveTable, type Column } from '@/components/ui/molecules/ResponsiveTable';
import { IconEye, IconEdit, IconPlus, IconCalendar, IconTrash, IconAlert } from '@/lib/icons';
import { MetricCard } from '@/components/ui/atoms/MetricCard';
import { initials, fmtDate, fmtPhone, daysDiff, avatarIndex, AVATAR_COLORS, newRequestId, getErrorMessage } from '@/lib/helpers';
import { useScrollTopOnPageChange } from '@/hooks/useScrollTopOnPageChange';
import { toast } from 'sonner';

const ROWS_PER_PAGE = 7;

type MembershipStatus = 'active' | 'warning' | 'expired';

interface Member {
  id: string;
  member_id: string;
  name: string;
  email: string;
  plan: string;
  inicio: string;
  vence: string;
  status: MembershipStatus;
  isVisita: boolean;
}

function getStatus(m: Member): MembershipStatus {
  if (m.isVisita) return 'active';
  const diffVal = daysDiff(m.vence);
  if (diffVal === null) return 'active';
  const diff = -diffVal;
  if (diff < 0) return 'expired';
  if (diff <= 7) return 'warning';
  return 'active';
}

function toMember(item: MembershipListItem): Member {
  return {
    id: item.id,
    member_id: item.member_id,
    name: item.member_name,
    email: item.member_email ?? '',
    plan: item.type_name,
    inicio: item.start_date,
    vence: item.end_date,
    status: 'active',
    isVisita: item.type_name === 'Visita',
  };
}

/**
 * ¿El miembro ya tiene una membresía activa **vigente**?
 * Se mantiene como referencia del criterio del servidor: el filtro del
 * selector se aplica en la consulta (`withoutActiveMembership`).
 */

export default function MembershipsPage() {
  const user = useAuthStore((s) => s.user);
  const isTrainer = user?.role === 'trainer';
  const [currentFilter, setCurrentFilter] = useState<'all' | MembershipStatus>('all');
  const [currentPage, setCurrentPage] = useState(1);
  useScrollTopOnPageChange(currentPage);
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [memberList, setMemberList] = useState<MemberListItem[]>([]);
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [selMember, setSelMember] = useState('');
  const [selType, setSelType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'pending' | ''>('');
  const [saving, setSaving] = useState(false);
  /** Candado síncrono: el `disabled` del botón llega en el siguiente render. */
  const savingRef = useRef(false);
  /** Clave de idempotencia del intento en curso (se reutiliza al reintentar). */
  const attemptRef = useRef<{ signature: string; key: string } | null>(null);
  const reqRef = useRef(0);
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [memberQuery, setMemberQuery] = useState('');
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);

  const [editId, setEditId] = useState<string | null>(null);
  const [editTypeId, setEditTypeId] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editStatus, setEditStatus] = useState<string>('active');
  const [editSaving, setEditSaving] = useState(false);
  const editSavingRef = useRef(false);
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberEmail, setEditMemberEmail] = useState('');
  const [editMemberPlan, setEditMemberPlan] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);

  const [previewTarget, setPreviewTarget] = useState<Member | null>(null);
  const [previewMember, setPreviewMember] = useState<MemberListItem | null>(null);
  const [previewLoadedFor, setPreviewLoadedFor] = useState<string | null>(null);

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const localDate = (str: string) => { const [y, m, d] = str.split('-').map(Number); return new Date(y, m - 1, d); };
  const navigate = useNavigate();

  useEffect(() => {
    if (!previewTarget) return;
    const ctrl = { cancelled: false }
    const memberId = previewTarget.member_id;
    membersService.getById(memberId)
      .then((data) => { if (!ctrl.cancelled) setPreviewMember(data) })
      .catch(() => { if (!ctrl.cancelled) setPreviewMember(null) })
      .finally(() => { if (!ctrl.cancelled) setPreviewLoadedFor(memberId) })
    return () => { ctrl.cancelled = true }
  }, [previewTarget]);

  // Derivado: hay carga mientras el miembro del modal no coincide con el pedido.
  const previewLoading = previewTarget !== null && previewLoadedFor !== previewTarget.member_id;

  const cacheGet = useCacheStore((s) => s.get);
  const cacheSet = useCacheStore((s) => s.set);
  const cacheInvalidate = useCacheStore((s) => s.invalidate);

  useEffect(() => {
    async function load() {
      const req = ++reqRef.current;
      setLoading(true);
      setError(null);
      try {
        const [result, mList, types] = await Promise.all([
          membershipsService.getAll({ pageSize: 300 }),
          (() => {
            const cached = cacheGet<MemberListItem[]>('member_list');
            if (cached) return { data: cached, count: cached.length }
            return membersService.getAll({ pageSize: 200 }).then(r => { cacheSet('member_list', r.data); return r })
          })(),
          (() => {
            const cached = cacheGet<MembershipType[]>('membership_types');
            if (cached) return cached
            return membershipsService.getTypes().then(t => { cacheSet('membership_types', t); return t })
          })(),
        ]);
        if (req !== reqRef.current) return;
        setMembers(result.data.map(toMember));
        setMemberList(mList.data);
        setMembershipTypes(types);
      } catch (e) {
        if (req !== reqRef.current) return;
        setError(getErrorMessage(e));
      } finally {
        if (req === reqRef.current) setLoading(false);
      }
    }
    load();
  }, [cacheGet, cacheSet]);

  const allWithStatus = useMemo(
    () => members.map((m) => ({ ...m, status: getStatus(m) })),
    [members]
  );

  /**
   * Lista del selector "Seleccionar miembro". El filtro de membresía activa se
   * resuelve en el servidor (`withoutActiveMembership`), con la misma regla que
   * valida el RPC create_membership_with_payment. No se escribe en la caché
   * compartida `member_list` porque es un subconjunto.
   */
  const loadPickerMembers = useCallback(async () => {
    setPickerLoading(true);
    setPickerError(null);
    try {
      const r = await membersService.getAll({
        pageSize: 200,
        role: 'member',
        withoutActiveMembership: true,
      });
      setMemberList(r.data);
    } catch (e) {
      // No se conserva la lista anterior: mostrar socios con membresía vigente
      // (datos viejos) es peor que un error visible con reintento.
      setMemberList([]);
      setPickerError(getErrorMessage(e, 'No se pudieron cargar los miembros'));
    } finally {
      setPickerLoading(false);
    }
  }, []);

  const openMemberPicker = useCallback(() => {
    setMemberPickerOpen(true);
    void loadPickerMembers();
  }, [loadPickerMembers]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allWithStatus
      .filter((m) => m.status !== 'expired')
      .filter((m) => currentFilter === 'all' || m.status === currentFilter)
      .filter((m) => !m.isVisita || m.inicio === today)
      .filter(
        (m) =>
          !q ||
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.plan.toLowerCase().includes(q)
      );
  }, [currentFilter, search, allWithStatus, today]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * ROWS_PER_PAGE;
  const rows = filtered.slice(start, start + ROWS_PER_PAGE);

  const activeCount = filtered.filter((m) => m.status === 'active').length;
  const warnCount = filtered.filter((m) => m.status === 'warning').length;

  const selTypeData = membershipTypes.find((t) => t.id === selType);
  const isVisita = selTypeData?.name === 'Visita';
  const computedEnd = startDate && selTypeData
    ? isVisita
      ? startDate
      : (() => {
          const [y, mo, d] = startDate.split('-').map(Number)
          const end = new Date(y, mo - 1, d + selTypeData.duration_days)
          return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
        })()
    : '';

  const resetForm = useCallback(() => {
    setSelMember('');
    setSelType('');
    setStartDate('');
    setPaymentMethod('');
    attemptRef.current = null;
  }, []);

  const guardarMembresia = useCallback(async () => {
    if (!selMember || !selType || !startDate) return;
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    // Una sola clave por intento: si la respuesta se pierde y el usuario
    // reintenta, el RPC devuelve la membresía ya creada en vez de duplicarla.
    // Cambiar cualquier campo del formulario genera una clave distinta.
    const signature = `${selMember}|${selType}|${startDate}|${computedEnd}|${paymentMethod}`;
    if (!attemptRef.current || attemptRef.current.signature !== signature) {
      attemptRef.current = { signature, key: newRequestId() };
    }
    try {
      await membershipsService.create({
        member_id: selMember,
        type_id: selType,
        start_date: startDate,
        end_date: computedEnd,
        payment_method: paymentMethod || 'cash',
        request_id: attemptRef.current.key,
      });
      attemptRef.current = null;
      setModalOpen(false);
      resetForm();
      cacheInvalidate('member_list');
      toast.success('Membresía creada correctamente');
      // El alta ya está confirmada: si falla el refresco no debe parecer un error.
      const req = ++reqRef.current;
      try {
        const result = await membershipsService.getAll({ pageSize: 300 });
        if (req === reqRef.current) setMembers(result.data.map(toMember));
      } catch { /* sólo falló el refresco */ }
    } catch (e) {
      const msg: string = getErrorMessage(e, 'intenta de nuevo');
      if (msg.toLowerCase().includes('ya tiene una membresía activa')) {
        // Autocorrección: la lista de miembros estaba desactualizada.
        cacheInvalidate('member_list');
        const req = ++reqRef.current;
        try {
          const result = await membershipsService.getAll({ pageSize: 300 });
          if (req === reqRef.current) setMembers(result.data.map(toMember));
        } catch { /* silencioso */ }
        void loadPickerMembers();
        toast.error('Ese miembro ya tiene una membresía activa. Actualizamos la lista.');
      } else {
        toast.error('Error al crear membresía: ' + msg);
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [selMember, selType, startDate, computedEnd, paymentMethod, resetForm, cacheInvalidate, loadPickerMembers]);

  const openEditModal = useCallback((membership: Member) => {
    setEditId(membership.id);
    setEditTypeId(membershipTypes.find((t) => t.name === membership.plan)?.id ?? '');
    setEditStart(membership.inicio.split('T')[0]);
    setEditEnd(membership.vence.split('T')[0]);
    setEditStatus(membership.status === 'expired' ? 'expired' : 'active');
    setEditMemberName(membership.name);
    setEditMemberEmail(membership.email);
    setEditMemberPlan(membership.plan);
  }, [membershipTypes]);

  const handleEditStartChange = useCallback((value: string) => {
    setEditStart(value);
    const type = membershipTypes.find((mt) => mt.id === editTypeId);
    if (type && value) {
      const [y, mo, d] = value.split('-').map(Number)
      const end = new Date(y, mo - 1, d + type.duration_days)
      setEditEnd(`${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`)
    }
  }, [editTypeId, membershipTypes]);

  const guardarEdicion = useCallback(async () => {
    if (!editId) return;
    if (editSavingRef.current) return;
    editSavingRef.current = true;
    setEditSaving(true);
    try {
      const selectedType = membershipTypes.find((t) => t.id === editTypeId);
      await membershipsService.update(editId, {
        type_id: selectedType?.id ?? '',
        start_date: editStart,
        end_date: editEnd,
        status: editStatus as 'active' | 'expired' | 'cancelled',
      });
      if (selectedType) {
        await paymentsService.updateAmountByMembership(editId, selectedType.price);
      }
      setEditId(null);
      cacheInvalidate('member_list');
      const req = ++reqRef.current;
      const result = await membershipsService.getAll({ pageSize: 300 });
      if (req === reqRef.current) setMembers(result.data.map(toMember));
      toast.success('Membresía actualizada correctamente');
    } catch (e) {
      toast.error('Error al actualizar: ' + getErrorMessage(e));
    } finally {
      editSavingRef.current = false;
      setEditSaving(false);
    }
  }, [editId, editTypeId, editStart, editEnd, editStatus, membershipTypes, cacheInvalidate]);

  const handleDelete = useCallback((m: Member) => {
    setDeleteTarget(m);
  }, []);

  const confirmDeleteMembership = useCallback(async () => {
    const target = deleteTarget;
    if (!target) return;
    if (deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    try {
      await membershipsService.delete(target.id);
      toast.success('Membresía eliminada correctamente');
    } catch (e) {
      toast.error('Error al eliminar: ' + getErrorMessage(e));
    } finally {
      deletingRef.current = false;
      setDeleting(false);
      setDeleteTarget(null);
      cacheInvalidate('member_list');
      // Refresca siempre: si el borrado falló, la fila fantasma desaparece de la vista.
      const req = ++reqRef.current;
      try {
        const result = await membershipsService.getAll({ pageSize: 300 });
        if (req === reqRef.current) setMembers(result.data.map(toMember));
      } catch { /* silencioso */ }
    }
  }, [deleteTarget, cacheInvalidate]);

  const columns: Column<Member>[] = [
    {
      key: 'name',
      label: 'Miembro',
      render: (m) => {
        const av = avatarIndex(m.id);
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold flex-shrink-0"
              style={{ background: AVATAR_COLORS[av].bg, color: AVATAR_COLORS[av].fg }}>
              {initials(m.name)}
            </div>
            <div>
              <div className="font-medium text-[13px]">{m.name}</div>
              <div className="text-[11px] text-text-3 mt-0.5">{m.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'plan',
      label: 'Plan',
      render: (m) => (
        <span className="font-mono text-[12px] text-text-2">{m.plan}</span>
      ),
    },
    {
      key: 'inicio',
      label: 'Inicio',
      hide: 'lg',
      render: (m) => <span className="text-[12px]">{fmtDate(m.inicio)}</span>,
    },
    {
      key: 'vence',
      label: 'Vencimiento',
      render: (m) => {
        if (m.isVisita) return <div className="text-[12px] text-text-3">—</div>;
        const diffVal = daysDiff(m.vence);
        const diff = diffVal !== null ? -diffVal : null;
        return (
          <div>
            <div className="text-[12px]">{fmtDate(m.vence)}</div>
            {diff !== null && diff >= 7 && <div className="text-[11px] text-text-3 mt-0.5">{diff} días restantes</div>}
            {diff !== null && diff >= 0 && diff < 7 && <div className="text-[11px] text-amber-text mt-0.5">Vence en {diff} día{diff === 1 ? '' : 's'}</div>}
            {diff !== null && diff < 0 && <div className="text-[11px] text-red-text mt-0.5">Venció hace {Math.abs(diff)} días</div>}
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Estado',
      render: (m) => {
        if (m.isVisita) return <Badge variant="gray" dot>Visita</Badge>;
        const diffVal = daysDiff(m.vence);
        const diff = diffVal !== null ? -diffVal : null;
        if (diff === null) return <Badge variant="gray" dot>—</Badge>;
        if (diff < 0) return <Badge variant="red" dot>Vencida</Badge>;
        if (diff <= 7) return <Badge variant="amber" dot>Por vencer</Badge>;
        return <Badge variant="green" dot>Activa</Badge>;
      },
    },
    {
      key: 'actions',
      label: '',
      render: (m) => (
        <div className="flex gap-1.5 justify-end">
          <IconButton title="Ver detalle" onClick={() => setPreviewTarget(m)}>
            <IconEye width="13" height="13" />
          </IconButton>
          <IconButton title="Editar" onClick={() => openEditModal(m)}>
            <IconEdit width="13" height="13" />
          </IconButton>
          {!isTrainer && (
          <IconButton title="Eliminar" onClick={() => handleDelete(m)}>
            <IconTrash width="13" height="13" />
          </IconButton>
          )}
        </div>
      ),
    },
  ];

  const availableTypes = membershipTypes.filter(
    (t) => t.is_active && t.name !== 'Trimestral' && t.name !== 'Anual',
  );

  return (
    // Acento de marca fijo: esta pantalla no debe heredar presets azules/ámbar.
    <div className="contents" data-brand-accent="coral">
      <ScreenHeader
        title="Membresías"
        subtitle="Control de planes y vencimientos"
        wide
        actions={
          <Button variant="plain" icon={<IconPlus />} onClick={() => { resetForm(); setModalOpen(true); void loadPickerMembers(); }}>
            Nueva membresía
          </Button>
        }
      />

      <div className="px-4 sm:px-6 py-4 flex-1 mx-auto w-full max-w-[720px]">
        {/* METRICS */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="animate-slide-up stagger-1">
            <MetricCard icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            } color="green" value={activeCount} label="Activas" />
          </div>
          <div className="animate-slide-up stagger-2">
            <MetricCard icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            } color="amber" value={warnCount} label="Por vencer" />
          </div>
        </div>

        {/* ALERT BANNER */}
        {warnCount > 0 && (
          <div className="bg-amber-bg rounded-tile p-3.5 flex items-start gap-3 text-xs text-amber-text mb-4">
            <div className="w-7 h-7 rounded-2xl bg-amber-bg flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="flex-1">
              <span className="sm:hidden">{warnCount} por vencer</span>
              <span className="hidden sm:inline">{warnCount} membresía{warnCount > 1 ? 's' : ''} por vencer en los próximos 7 días. Considera contactar a estos miembros.</span>
            </div>
          </div>
        )}

        {/* CONTROLS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mb-4">
          <div className="flex-1">
            <SearchInput value={search} onChange={(v) => { setSearch(v); setCurrentPage(1); }} placeholder="Buscar miembro, plan o email..." />
          </div>
          <div className="overflow-x-auto scrollbar-none pb-1">
            <TabBar tabs={[
              { key: 'all', label: 'Todos' },
              { key: 'active', label: 'Activos' },
              { key: 'warning', label: 'Por vencer' },
            ]} active={currentFilter} onChange={(k) => { setCurrentFilter(k as MembershipStatus | 'all'); setCurrentPage(1); }} />
          </div>
        </div>

        {/* Loading */}
        {loading && <LoadingSpinner text="Cargando membresías…" />}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-[60px] text-red-text">Error: {error}</div>
        )}

        {/* Table / Cards */}
        {!loading && !error && (
          <>
            <ResponsiveTable
              columns={columns}
              data={rows}
              keyExtractor={(m) => m.id}
              cardTitle={(m) => m.name}
              cardSubtitle={(m) => m.email}
              cardAvatar={(m) => {
                const av = avatarIndex(m.id);
                return (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0"
                    style={{ background: AVATAR_COLORS[av].bg, color: AVATAR_COLORS[av].fg }}>
                    {initials(m.name)}
                  </div>
                );
              }}
              cardFields={[
                { label: 'Plan', value: (m) => <span className="font-mono text-[12px] text-text-2">{m.plan}</span> },
                { label: 'Inicio', value: (m) => <span className="text-[12px]">{fmtDate(m.inicio)}</span> },
                {
                  label: 'Vencimiento',
                  value: (m) => {
                    if (m.isVisita) return <span className="text-[12px] text-text-3">—</span>;
        const diffVal = daysDiff(m.vence);
        const diff = diffVal !== null ? -diffVal : null;
                    return (
                      <div>
                        {diff !== null && diff >= 7 && <span className="text-[12px]">{fmtDate(m.vence)} ({diff}d)</span>}
                        {diff !== null && diff >= 0 && diff < 7 && <span className="text-[12px] text-amber-text">{fmtDate(m.vence)} ({diff}d)</span>}
                        {diff !== null && diff < 0 && <span className="text-[12px] text-red-text">{fmtDate(m.vence)} ({Math.abs(diff)}d)</span>}
                        {diff === null && <span className="text-[12px]">{fmtDate(m.vence)}</span>}
                      </div>
                    );
                  },
                },
                {
                  label: 'Estado',
                  value: (m) => {
                    if (m.isVisita) return <Badge variant="gray" dot>Visita</Badge>;
                    const diffVal = daysDiff(m.vence);
                    const diff = diffVal !== null ? -diffVal : null;
                    if (diff === null) return <Badge variant="gray" dot>—</Badge>;
                    if (diff < 0) return <Badge variant="red" dot>Vencida</Badge>;
                    if (diff <= 7) return <Badge variant="amber" dot>Por vencer</Badge>;
                    return <Badge variant="green" dot>Activa</Badge>;
                  },
                },
              ]}
              cardActions={(m: Member) => (
                <div className="flex">
                  <div className="ml-auto flex gap-1.5">
                    <IconButton title="Ver detalle" onClick={() => setPreviewTarget(m)}>
                      <IconEye width="13" height="13" />
                    </IconButton>
                    <IconButton title="Editar" onClick={() => openEditModal(m)}>
                      <IconEdit width="13" height="13" />
                    </IconButton>
                    {!isTrainer && (
                    <IconButton title="Eliminar" onClick={() => handleDelete(m)}>
                      <IconTrash width="13" height="13" />
                    </IconButton>
                    )}
                  </div>
                </div>
              )}
              emptyMessage="No se encontraron membresías con ese criterio."
            />

            <Pagination
              current={safePage}
              total={totalPages}
              start={start}
              end={Math.min(start + ROWS_PER_PAGE, filtered.length)}
              totalItems={filtered.length}
              label="membresías"
              onChange={setCurrentPage}
            />
          </>
        )}
      </div>

      <Modal compact icon={
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      } title="PREVIEW" open={previewTarget !== null} onClose={() => { setPreviewTarget(null); setPreviewMember(null); }}>
        {previewLoading ? (
          <div className="flex flex-col items-center py-10 gap-4">
            <div className="w-[64px] h-[64px] rounded-full bg-surface2 animate-pulse" />
            <div className="w-32 h-4 rounded bg-surface2 animate-pulse" />
            <div className="w-20 h-5 rounded-full bg-surface2 animate-pulse" />
            <div className="w-full space-y-3 mt-4">
              <div className="h-4 rounded bg-surface2 animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-surface2 animate-pulse" />
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="h-[52px] rounded bg-surface2 animate-pulse" />
                <div className="h-[52px] rounded bg-surface2 animate-pulse" />
                <div className="h-[52px] rounded bg-surface2 animate-pulse" />
                <div className="h-[52px] rounded bg-surface2 animate-pulse" />
              </div>
            </div>
          </div>
        ) : previewMember && previewTarget ? (
          <div className="flex flex-col gap-0">
            <div className="flex flex-col items-center mb-6">
              <div className="w-[64px] h-[64px] rounded-full flex items-center justify-center text-[22px] font-semibold mb-3"
                style={{ background: AVATAR_COLORS[avatarIndex(previewMember.id)].bg, color: AVATAR_COLORS[avatarIndex(previewMember.id)].fg }}>
                {initials(previewMember.full_name)}
              </div>
              <div className="text-[17px] font-semibold">{previewMember.full_name}</div>
              <div className="mt-1.5">
                {previewMember.role === 'member' ? <Badge variant="gray" dot>Miembro</Badge> : previewMember.role === 'trainer' ? <Badge variant="teal" dot>Entrenador</Badge> : <Badge variant="accent" dot>Admin</Badge>}
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-3.5">
              <div className="flex items-center gap-3">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-3 shrink-0">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span className="text-[12px] text-text-2">{previewMember.email}</span>
              </div>
              {previewMember.phone && (
                <div className="flex items-center gap-3">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-3 shrink-0">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span className="text-[12px] text-text-2">{fmtPhone(previewMember.phone)}</span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <div className="text-[11px] text-text-3 uppercase tracking-[0.08em] mb-3">Membresía actual</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface2 rounded px-3 py-2.5">
                  <div className="text-[10px] text-text-3 uppercase tracking-[0.06em]">Plan</div>
                  <div className="text-[13px] font-medium mt-0.5">{previewTarget!.plan}</div>
                </div>
                <div className="bg-surface2 rounded px-3 py-2.5">
                  <div className="text-[10px] text-text-3 uppercase tracking-[0.06em]">Inicio</div>
                  <div className="text-[12px] mt-0.5">{fmtDate(previewTarget!.inicio)}</div>
                </div>
                <div className="bg-surface2 rounded px-3 py-2.5">
                  <div className="text-[10px] text-text-3 uppercase tracking-[0.06em]">Vencimiento</div>
                  <div className="text-[12px] mt-0.5">{fmtDate(previewTarget!.vence)}</div>
                </div>
                <div className="bg-surface2 rounded px-3 py-2.5">
                  <div className="text-[10px] text-text-3 uppercase tracking-[0.06em]">Estado</div>
                  <div className="mt-0.5">
                    {previewTarget!.status === 'active' ? <Badge variant="green" dot>Activa</Badge> : previewTarget!.status === 'warning' ? <Badge variant="amber" dot>Por vencer</Badge> : <Badge variant="red" dot>Vencida</Badge>}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border text-center">
              <Button variant="primary" onClick={() => { setPreviewTarget(null); navigate(`/members/${previewTarget!.member_id}`); }}>
                Ir a perfil completo
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-16 text-text-3 text-[13px]">No se pudo cargar la información del miembro.</div>
        )}
      </Modal>

      <Modal
        open={modalOpen}
        onClose={() => { if (!saving) setModalOpen(false) }}
        title="Nueva membresía"
        className="mx-auto w-full"
        maxWidth="512px"
        panelClassName="bg-surface rounded-t-[32px]"
        icon={<IconPlus width="16" height="16" />}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[12px] text-text-2 font-medium tracking-[0.03em]">Tipo de membresía *</label>
            <div className="grid grid-cols-2 gap-2">
              {availableTypes.map((type, index) => {
                const selected = selType === type.id;
                const isVisitaType = type.name === 'Visita';
                // Con un número impar de tipos, el último ocupa toda la fila.
                const fullRow = index === availableTypes.length - 1 && availableTypes.length % 2 === 1;
                return (
                  <button key={type.id} type="button"
                    onClick={() => {
                      setSelType(type.id);
                      if (isVisitaType && paymentMethod === 'pending') setPaymentMethod('');
                      setStartDate(today);
                    }}
                    className={`relative flex flex-col items-center p-4 rounded-2xl border text-center transition-all duration-150 cursor-pointer font-sans
                      ${fullRow ? 'col-span-2' : ''}
                      ${selected
                        ? 'border-accent bg-accent/8'
                        : 'border-border2 bg-surface2'
                      }`}
                  >
                    <div className="text-[13px] font-semibold text-text">
                      {type.name}
                    </div>
                    <div className="text-[18px] font-bold tracking-tight mt-1 text-text">
                      ${type.price.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-text-2 mt-0.5">
                      {isVisitaType ? 'Hoy · 1 día' : `${type.duration_days} días`}
                    </div>
                    {selected && (
                      <svg
                        className="absolute top-3 right-3 text-accent"
                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {selType && (
            <>
              <div className="bg-surface2 rounded-[24px] overflow-hidden">
                <div className="px-4 py-3 border-b border-surface3">
                  <div className="text-[11px] text-text-2 mb-1">Miembro *</div>
                  {selMember ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                          style={{ background: AVATAR_COLORS[avatarIndex(selMember)].bg, color: AVATAR_COLORS[avatarIndex(selMember)].fg }}>
                          {initials(memberList.find(m => m.id === selMember)?.full_name || '')}
                        </div>
                        <span className="text-[14px] font-medium text-text truncate">
                          {memberList.find(m => m.id === selMember)?.full_name}
                        </span>
                      </div>
                      <button type="button" onClick={openMemberPicker}
                        className="text-[12px] font-semibold text-accent shrink-0 font-sans bg-transparent border-none cursor-pointer">
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={openMemberPicker}
                      className="flex items-center gap-2 w-full bg-transparent border-none text-text-2 text-[14px] p-0 text-left font-sans cursor-pointer">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      Seleccionar miembro
                    </button>
                  )}
                </div>

                {isVisita ? (
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="text-[11px] text-text-2">Pase del día</div>
                      <Badge variant="accent" dot>Vence hoy</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[14px] text-text">
                      <IconCalendar width="14" height="14" className="text-text-2 shrink-0" />
                      {localDate(startDate || today).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div className="mt-1 text-[11px] text-text-2 leading-relaxed">
                      Membresía válida únicamente el día de hoy. No requiere renovación.
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="px-4 py-3 border-b border-surface3">
                      <label className="block text-[11px] text-text-2 mb-1">Fecha de inicio *</label>
                      <DatePicker
                        variant="row"
                        clearable
                        value={startDate}
                        onChange={setStartDate}
                        aria-label="Fecha de inicio"
                      />
                    </div>
                    {computedEnd && (
                      <div className="px-4 py-3">
                        <div className="text-[11px] text-text-2 mb-1">Fecha de vencimiento</div>
                        <div className="flex items-center gap-2 text-[14px] text-text">
                          <IconCalendar width="14" height="14" className="text-text-2 shrink-0" />
                          {localDate(computedEnd).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] text-text-2 font-medium tracking-[0.03em]">Método de pago <span className="text-text-3 font-normal">(Efectivo por defecto)</span></label>
                <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                  {[
                    { value: 'cash' as const, label: 'Efectivo', disabled: false },
                    { value: 'transfer' as const, label: 'Transferencia', disabled: false },
                    { value: 'pending' as const, label: isVisita ? 'No disponible' : 'Pendiente', disabled: isVisita },
                  ].map((opt) => {
                    const selected = paymentMethod === opt.value;
                    const disabled = opt.disabled;
                    return (
                      <button key={opt.value} type="button"
                        onClick={() => {
                          if (!disabled) setPaymentMethod(selected ? '' : opt.value);
                        }}
                        disabled={disabled}
                        className={`shrink-0 h-9 px-4 rounded-full text-[12px] font-semibold border-none whitespace-nowrap transition-colors font-sans
                          ${disabled
                            ? 'bg-surface2 text-text-3 opacity-40 cursor-not-allowed'
                            : selected
                              ? 'bg-accent text-accent-contrast cursor-pointer'
                              : 'bg-surface2 text-text-2 cursor-pointer active:opacity-70'
                          }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {selTypeData && (
                  <div className="flex items-center gap-2 text-[12px] text-text-2 px-4 py-2.5 bg-surface2 rounded-[24px]">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-2 shrink-0">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    <span><strong className="text-text">${selTypeData.price.toLocaleString()}</strong> — {paymentMethod === 'pending' ? 'Pendiente' : 'Pagado'} · {paymentMethod === 'pending' ? '' : paymentMethod === 'transfer' ? 'Transferencia' : paymentMethod === 'cash' ? 'Efectivo' : 'Efectivo (por defecto)'} · {localDate(startDate || today).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-2 mt-1">
          <button
            type="button"
            onClick={guardarMembresia}
            disabled={!selMember || !selType || !startDate || saving}
            className="w-full h-12 rounded-full border-none bg-accent text-accent-contrast text-[15px] font-bold cursor-pointer font-sans active:opacity-70 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando…' : 'Guardar membresía'}
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            disabled={saving}
            className="w-full h-11 rounded-full border-none bg-transparent text-text-2 text-[14px] font-semibold cursor-pointer font-sans active:opacity-70 transition-opacity disabled:opacity-40"
          >
            Cancelar
          </button>
        </div>
      </Modal>

      <Modal
        open={memberPickerOpen}
        onClose={() => { setMemberPickerOpen(false); setMemberQuery('') }}
        title="Seleccionar miembro"
        maxWidth="512px"
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="text-[13px] text-text-2">Elige el miembro para asignar esta membresía:</div>
          <p className="text-[11px] text-text-3 leading-relaxed">
            Solo se listan socios sin membresía activa vigente. Los inactivos, pendientes y sin membresía sí aparecen.
          </p>

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              value={memberQuery}
              onChange={(e) => setMemberQuery(e.target.value)}
              placeholder="Buscar miembro…"
              className="w-full bg-surface text-text text-[15px] pl-10 pr-4 py-3 rounded-xl border-none outline-none font-sans placeholder:text-text-2 focus:ring-2 focus:ring-accent/30"
            />
          </div>

          <div className="bg-surface rounded-[32px] overflow-hidden max-h-[320px] overflow-y-auto scrollbar-none">
            {pickerLoading ? (
              <div className="px-4 py-8 text-center text-[13px] text-text-2">Cargando miembros…</div>
            ) : pickerError ? (
              <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
                <span className="text-[13px] text-red-text">{pickerError}</span>
                <button
                  type="button"
                  onClick={() => { void loadPickerMembers() }}
                  className="px-4 h-9 rounded-full bg-surface2 text-text text-[12px] font-semibold border-none cursor-pointer font-sans active:opacity-70 transition-opacity"
                >
                  Reintentar
                </button>
              </div>
            ) : (() => {
              const q = memberQuery.trim().toLowerCase();
              const available = memberList
                .filter((m) => !q || m.full_name.toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q));

              if (available.length === 0) {
                return (
                  <div className="px-4 py-6 text-center text-[13px] text-text-2">
                    {memberQuery
                      ? 'Sin resultados para esa búsqueda'
                      : 'No hay miembros sin membresía activa. Todos los socios ya tienen una vigente.'}
                  </div>
                );
              }

              return available.map((m) => {
                const isSelected = selMember === m.id;
                const av = avatarIndex(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { setSelMember(m.id); setMemberPickerOpen(false); setMemberQuery('') }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left bg-transparent border-none border-b border-divider last:border-b-0 cursor-pointer active:opacity-70 transition-opacity"
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0"
                      style={{ background: AVATAR_COLORS[av].bg, color: AVATAR_COLORS[av].fg }}>
                      {initials(m.full_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-medium text-text truncate">{m.full_name}</div>
                      {m.email && <div className="text-[12px] text-text-2 truncate mt-0.5">{m.email}</div>}
                    </div>
                    {isSelected && (
                      <svg className="shrink-0 text-accent" width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              });
            })()}
          </div>
        </div>
      </Modal>

      <Modal open={editId !== null} onClose={() => { if (!editSaving) setEditId(null) }} title="Editar membresía" className="max-w-[420px]" icon={<IconEdit width="16" height="16" />}>
        {editId && (
          <div className="flex flex-col gap-4">
            {/* MEMBER CONTEXT */}
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0"
                style={{ background: AVATAR_COLORS[avatarIndex(editId)].bg, color: AVATAR_COLORS[avatarIndex(editId)].fg }}>
                {initials(editMemberName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate">{editMemberName}</div>
                <div className="text-[11px] text-text-3 truncate">{editMemberEmail}</div>
              </div>
              <Badge variant="gray">{editMemberPlan}</Badge>
            </div>

            {/* PLAN TYPE */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] text-text-3 uppercase tracking-[0.08em] font-medium">Tipo de membresía</label>
              <div className="grid grid-cols-2 gap-2">
                {availableTypes.map((type, index) => {
                  const selected = editTypeId === type.id;
                  const fullRow = index === availableTypes.length - 1 && availableTypes.length % 2 === 1;
                  return (
                    <button key={type.id} type="button"
                      onClick={() => {
                        setEditTypeId(type.id);
                      if (editStart) {
                          const [y, mo, d] = editStart.split('-').map(Number)
                          const ed = new Date(y, mo - 1, d + type.duration_days)
                          setEditEnd(`${ed.getFullYear()}-${String(ed.getMonth() + 1).padStart(2, '0')}-${String(ed.getDate()).padStart(2, '0')}`)
                        }
                      }}
                      className={`relative flex flex-col items-center p-3 rounded-2xl border text-center transition-all duration-150 cursor-pointer font-sans
                        ${fullRow ? 'col-span-2' : ''}
                        ${selected
                          ? 'border-accent bg-accent/8 ring-1 ring-accent/40'
                          : 'border-border2 bg-surface2'
                        }`}
                    >
                      <div className={`text-[13px] font-semibold ${selected ? 'text-accent' : 'text-text'}`}>
                        {type.name}
                      </div>
                      <div className="text-[18px] font-bold tracking-tight mt-1">
                        ${type.price.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-text-3 mt-0.5">
                        {type.name === 'Visita' ? 'Hoy · 1 día' : `${type.duration_days} días`}
                      </div>
                      {selected && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DATES */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-text-3 uppercase tracking-[0.08em] font-medium">Inicio</label>
                <DatePicker
                  variant="field"
                  clearable
                  value={editStart}
                  onChange={handleEditStartChange}
                  aria-label="Fecha de inicio"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-text-3 uppercase tracking-[0.08em] font-medium">Vencimiento</label>
                <DatePicker
                  variant="field"
                  clearable
                  value={editEnd}
                  onChange={setEditEnd}
                  aria-label="Fecha de vencimiento"
                />
              </div>
            </div>

            {/* STATUS */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] text-text-3 uppercase tracking-[0.08em] font-medium">Estado</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'active', label: 'Activa', color: 'green' as const },
                  { value: 'expired', label: 'Vencida', color: 'red' as const },
                  { value: 'cancelled', label: 'Cancelada', color: 'gray' as const },
                ].map((opt) => {
                  const selected = editStatus === opt.value;
                  return (
                    <button key={opt.value} type="button"
                      onClick={() => setEditStatus(opt.value)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl border text-[12px] font-medium transition-all duration-150 cursor-pointer font-sans
                        ${selected
                          ? opt.color === 'green' ? 'border-green bg-green-bg text-green-text ring-1 ring-green/30'
                            : opt.color === 'red' ? 'border-red bg-red-bg text-red-text ring-1 ring-red/30'
                            : 'border-text-3 bg-surface2 text-text-3 ring-1 ring-text-3/30'
                          : 'border-border2 bg-surface2 text-text-2'
                        }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        selected
                          ? opt.color === 'green' ? 'bg-green'
                            : opt.color === 'red' ? 'bg-red'
                            : 'bg-text-3'
                          : 'bg-text-3'
                      }`} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SUMMARY */}
            {editId && (
              <div className="bg-surface2 rounded-tile p-4 space-y-1.5">
                <div className="text-[10px] text-text-3 uppercase tracking-[0.08em] font-medium mb-2">Resumen de cambios</div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-text-3">Tipo</span>
                  <span className="text-text font-medium">
                    {editMemberPlan}
                    {editTypeId && membershipTypes.find((t) => t.id === editTypeId)?.name !== editMemberPlan && (
                      <span className="text-accent"> → {membershipTypes.find((t) => t.id === editTypeId)?.name}</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-text-3">Vencimiento</span>
                  <span className="text-text font-medium">
                    {fmtDate(editEnd)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-text-3">Estado</span>
                  <span className={`font-medium ${
                    editStatus === 'active' ? 'text-green-text'
                      : editStatus === 'expired' ? 'text-red-text'
                      : 'text-text-3'
                  }`}>
                    {editStatus === 'active' ? 'Activa' : editStatus === 'expired' ? 'Vencida' : 'Cancelada'}
                  </span>
                </div>
                {editTypeId && (
                  <div className="flex items-center justify-between text-[12px] pt-1.5 border-t border-border mt-1.5">
                    <span className="text-text-3">Total</span>
                    <span className="text-text font-semibold">${membershipTypes.find((t) => t.id === editTypeId)?.price.toLocaleString() ?? '—'}</span>
                  </div>
                )}
              </div>
            )}

            {/* ACTIONS */}
            <div className="flex justify-end gap-2.5 pt-1">
              <Button variant="ghost" onClick={() => setEditId(null)} disabled={editSaving}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={guardarEdicion} disabled={!editTypeId || !editStart || !editEnd || editSaving}>
                {editSaving ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={deleteTarget !== null} onClose={() => { if (!deleting) setDeleteTarget(null) }} title="Eliminar membresía" className="max-w-[400px]" icon={<IconAlert width="16" height="16" />}>
        <div className="flex flex-col gap-4">
          <div className="text-[13px] text-text-1 leading-relaxed">
            ¿Estás seguro de eliminar la membresía <strong>{deleteTarget?.plan}</strong> de <strong>{deleteTarget?.name}</strong>?
          </div>
          <div className="text-[12px] text-red-text bg-red-bg rounded-tile p-3.5 leading-relaxed">
            Se eliminarán los pagos asociados a esta membresía.
            Esta acción no se puede deshacer.
          </div>
        </div>
        <div className="flex justify-end gap-2.5 mt-2">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancelar</Button>
          <Button variant="danger" onClick={confirmDeleteMembership} disabled={deleting}>
            {deleting ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
