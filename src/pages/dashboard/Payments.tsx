import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/atoms/Button';
import { Badge } from '@/components/ui/atoms/Badge';
import { IconButton } from '@/components/ui/atoms/IconButton';
import { LoadingSpinner } from '@/components/ui/atoms/LoadingSpinner';
import { ScreenHeader } from '@/components/ui/layout/ScreenHeader';
import { SearchInput } from '@/components/ui/molecules/SearchInput';
import { TabBar } from '@/components/ui/molecules/TabBar';
import { MonthPicker } from '@/components/ui/molecules/MonthPicker';
import { BottomSheet } from '@/components/ui/molecules/BottomSheet';
import { ListGroup } from '@/components/ui/molecules/ListGroup';
import { ListTile } from '@/components/ui/molecules/ListTile';
import { Pagination } from '@/components/ui/molecules/Pagination';
import { IconEdit, IconDots, IconChevronLeft, IconChevronRight, IconCalendar, IconRefresh, IconClose, IconDownload } from '@/lib/icons';
import { MetricCard } from '@/components/ui/atoms/MetricCard';
import { initials, fmtDate, fmtMoney, avatarIndex, getErrorMessage, AVATAR_COLORS } from '@/lib/helpers';
import { useScrollTopOnPageChange } from '@/hooks/useScrollTopOnPageChange';
import { paymentsService } from '@/services/payments.service';
import { rangeBounds, exportPaymentsPdf } from '@/lib/payments-pdf';
import { useCacheStore } from '@/store/cache.store';
import { Modal } from '@/components/ui/molecules/Modal';
import { ResponsiveTable, type Column } from '@/components/ui/molecules/ResponsiveTable';
import { toast } from 'sonner';
import { membersService, type MemberListItem } from '@/services/members.service';

const ROWS_PER_PAGE = 8;

type PaymentMethod = 'cash' | 'card' | 'transfer';
type PaymentStatus = 'paid' | 'pending' | 'cancelled';

interface Payment {
  id: string;
  member_id: string;
  member: string;
  email: string;
  concept: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  status: PaymentStatus;
  notes: string | null;
  membership_id: string;
  av: number;
}

const METHOD_LABELS: Record<PaymentMethod, string> = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia' };
const METHOD_COLORS: Record<PaymentMethod, string> = { cash: 'var(--green-text)', card: 'var(--teal-text)', transfer: 'var(--amber-text)' };

type FilterKey = 'all' | PaymentStatus;

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<FilterKey>('all');
  const [currentPage, setCurrentPage] = useState(1);
  useScrollTopOnPageChange(currentPage);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [monthRevenue, setMonthRevenue] = useState({ collected: 0, pending: 0 });

  const [receiptTarget, setReceiptTarget] = useState<Payment | null>(null);
  const [editTarget, setEditTarget] = useState<Payment | null>(null);
  const [editStatus, setEditStatus] = useState<PaymentStatus>('paid');
  const [editSaving, setEditSaving] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  /** Cambia para forzar una recarga manual desde el menú de opciones. */
  const [reloadKey, setReloadKey] = useState(0);

  // Exportación del rango de meses a PDF.
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFromYear, setExportFromYear] = useState(() => new Date().getFullYear());
  const [exportFromMonth, setExportFromMonth] = useState(() => new Date().getMonth());
  const [exportToYear, setExportToYear] = useState(() => new Date().getFullYear());
  const [exportToMonth, setExportToMonth] = useState(() => new Date().getMonth());
  const [exporting, setExporting] = useState(false);

  const cacheGet = useCacheStore((s) => s.get);
  const cacheSet = useCacheStore((s) => s.set);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const monthRange = useMemo(() => {
    const start = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`;
    const endDate = new Date(viewYear, viewMonth + 1, 0);
    const end = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
    return { monthStart: start, monthEnd: end };
  }, [viewYear, viewMonth]);

  const changeMonth = (delta: number) => {
    const base = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setCurrentPage(1);
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setCurrentFilter('all');
    setCurrentPage(1);
  };

  /** Abre la hoja de exportación con el mes que se está viendo en ambos extremos. */
  const openExport = () => {
    setExportFromYear(viewYear);
    setExportFromMonth(viewMonth);
    setExportToYear(viewYear);
    setExportToMonth(viewMonth);
    setExportOpen(true);
  };

  const exportMonthIndexFrom = exportFromYear * 12 + exportFromMonth;
  const exportMonthIndexTo = exportToYear * 12 + exportToMonth;
  const exportRangeInvalid = exportMonthIndexFrom > exportMonthIndexTo;

  const handleExport = async (mode: 'download' | 'preview') => {
    if (exporting || exportRangeInvalid) return;

    // La pestaña de vista previa se abre dentro del gesto del usuario: si se
    // abriera después del `await`, el navegador la bloquearía.
    const previewWindow = mode === 'preview' ? window.open('', '_blank') : null;

    setExporting(true);
    try {
      const { from, to } = rangeBounds(
        exportFromYear,
        exportFromMonth,
        exportToYear,
        exportToMonth
      );
      const result = await paymentsService.getAll({
        page: 1,
        pageSize: 1000,
        dateFrom: from,
        dateTo: to,
      });

      if (result.data.length === 0) {
        previewWindow?.close();
        toast.error('No hay pagos registrados en ese periodo.');
        return;
      }

      const delivered = await exportPaymentsPdf(
        {
          fromYear: exportFromYear,
          fromMonth: exportFromMonth,
          toYear: exportToYear,
          toMonth: exportToMonth,
          payments: result.data,
        },
        mode,
        previewWindow
      );

      setExportOpen(false);
      toast.success(
        delivered === 'preview'
          ? 'Vista previa abierta en una nueva pestaña.'
          : 'PDF descargado.'
      );
    } catch (e) {
      previewWindow?.close();
      toast.error('No se pudo generar el PDF: ' + getErrorMessage(e, 'Intenta de nuevo.'));
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setCurrentPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const handleEditSave = useCallback(async () => {
    if (!editTarget) return;
    setEditSaving(true);
    try {
      await paymentsService.update(editTarget.id, { status: editStatus });
      setEditTarget(null);
      const result = await paymentsService.getAll({
        page: currentPage,
        pageSize: ROWS_PER_PAGE,
        status: currentFilter !== 'all' ? currentFilter : undefined,
        search: search || undefined,
        dateFrom: monthRange.monthStart,
        dateTo: monthRange.monthEnd,
      });
      setPayments(result.data.map((p): Payment => ({
        id: p.id,
        member_id: p.member_id,
        member: p.member_name,
        email: p.member_email ?? '',
        concept: p.concept,
        amount: p.amount,
        date: p.date,
        method: p.method as PaymentMethod,
        status: p.status as PaymentStatus,
        notes: null,
        membership_id: '',
        av: avatarIndex(p.id),
      })));
      setCount(result.count);
      toast.success('Estado actualizado correctamente');
    } catch (e) {
      toast.error('Error al actualizar: ' + getErrorMessage(e, 'Intenta de nuevo.'));
    } finally {
      setEditSaving(false);
    }
  }, [editTarget, editStatus, monthRange, currentPage, currentFilter, search]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [result, , rev] = await Promise.all([
          paymentsService.getAll({
            page: currentPage,
            pageSize: ROWS_PER_PAGE,
            status: currentFilter !== 'all' ? currentFilter : undefined,
            search: search || undefined,
            dateFrom: monthRange.monthStart,
            dateTo: monthRange.monthEnd,
          }),
          (() => {
            const cached = cacheGet<MemberListItem[]>('member_list')
            if (cached) return { data: cached }
            return membersService.getAll({ pageSize: 200 }).then(r => {
              cacheSet('member_list', r.data)
              return r
            })
          })(),
          paymentsService.getRevenueInRange(monthRange.monthStart, monthRange.monthEnd),
        ]);
        setPayments(result.data.map((p): Payment => ({
          id: p.id,
          member_id: p.member_id,
          member: p.member_name,
          email: p.member_email ?? '',
          concept: p.concept,
          amount: p.amount,
          date: p.date,
          method: p.method as PaymentMethod,
          status: p.status as PaymentStatus,
          notes: null,
          membership_id: '',
          av: avatarIndex(p.id),
        })));
        setCount(result.count);
        setMonthRevenue(rev);
      } catch (e) {
        setError(getErrorMessage(e, 'No se pudieron cargar los pagos.'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [monthRange, currentPage, currentFilter, search, reloadKey, cacheGet, cacheSet]);

  const totalPages = Math.max(1, Math.ceil(count / ROWS_PER_PAGE));

  const filters = [
    { key: 'all' as FilterKey, label: 'Todos' },
    { key: 'paid' as FilterKey, label: 'Pagados' },
    { key: 'pending' as FilterKey, label: 'Pendientes' },
    { key: 'cancelled' as FilterKey, label: 'Cancelados' },
  ];

  const paymentColumns: Column<Payment>[] = [
    {
      key: 'member',
      label: 'Miembro',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[12px] font-semibold flex-shrink-0"
            style={{ background: AVATAR_COLORS[p.av].bg, color: AVATAR_COLORS[p.av].fg }}>
            {initials(p.member)}
          </div>
          <div>
            <div className="font-medium text-[13px]">{p.member}</div>
            <div className="text-[11px] text-text-3 mt-0.5">{p.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'concept',
      label: 'Concepto',
      hide: 'lg',
      render: (p) => <span className="text-[12px]">{p.concept}</span>,
    },
    {
      key: 'amount',
      label: 'Monto',
      align: 'right',
      render: (p) => (
        <div className="flex items-center gap-2 justify-end">
          <span className="font-mono text-[13px] font-medium">{fmtMoney(p.amount)}</span>
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Fecha',
      hide: 'lg',
      render: (p) => <span className="text-[12px]">{fmtDate(p.date)}</span>,
    },
    {
      key: 'method',
      label: 'Método',
      hide: 'lg',
      render: (p) => (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: METHOD_COLORS[p.method] }}>
          {p.method === 'cash' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /></svg>}
          {p.method === 'card' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>}
          {p.method === 'transfer' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>}
          {METHOD_LABELS[p.method]}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (p) => (
        <>{p.status === 'paid' ? <Badge variant="green" dot>Pagado</Badge> : p.status === 'pending' ? <Badge variant="amber" dot>Pendiente</Badge> : <Badge variant="red" dot>Cancelado</Badge>}</>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (p) => (
        <div className="flex justify-end">
          <div className="flex items-center gap-3">
          <IconButton title="Ver recibo" onClick={() => setReceiptTarget(p)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
          </IconButton>
          <IconButton title="Editar estado" onClick={() => { setEditTarget(p); setEditStatus(p.status); }}>
            <IconEdit width="13" height="13" />
          </IconButton>
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <ScreenHeader
        title="Pagos"
        subtitle="Historial y cobros del gimnasio"
        wide
        menu={false}
        actions={
          <>
            <IconButton title="Exportar pagos" onClick={openExport}>
              <IconDownload width="16" height="16" />
            </IconButton>
            <IconButton title="Opciones" onClick={() => setOptionsOpen(true)}>
              <IconDots width="16" height="16" />
            </IconButton>
          </>
        }
      />

      <div className="px-4 sm:px-6 py-4 flex-1 mx-auto w-full max-w-[720px]">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="animate-slide-up stagger-1">
            <MetricCard icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
            } color="green" neutralValue value={fmtMoney(monthRevenue.collected)} label="Recaudado" />
          </div>
          <div className="animate-slide-up stagger-2">
            <MetricCard icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            } color="amber" neutralValue value={fmtMoney(monthRevenue.pending)} label="Pendiente" />
          </div>
        </div>

        {/* NAVEGADOR DE MES */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Mes anterior"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface text-text-2 border-none cursor-pointer active:opacity-70 transition-colors"
          >
            <IconChevronLeft width="16" height="16" />
          </button>

          <MonthPicker
            year={viewYear}
            month={viewMonth}
            onChange={(year, month) => {
              setViewYear(year);
              setViewMonth(month);
              setCurrentPage(1);
            }}
          />

          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Mes siguiente"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface text-text-2 border-none cursor-pointer active:opacity-70 transition-colors"
          >
            <IconChevronRight width="16" height="16" />
          </button>
        </div>

        {/* BUSCADOR + FILTROS (scroll horizontal en móvil) */}
        <div className="scrollbar-none -mx-4 px-4 mb-4 flex items-center gap-2 overflow-x-auto whitespace-nowrap sm:mx-0 sm:px-0">
          <div className="w-[210px] shrink-0 sm:w-auto sm:min-w-[220px] sm:flex-1">
            <SearchInput
              variant="inset"
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Buscar miembro..."
            />
          </div>
          <TabBar
            tabs={filters}
            active={currentFilter}
            onChange={(k) => { setCurrentFilter(k as FilterKey); setCurrentPage(1); }}
            className="shrink-0 overflow-visible"
          />
        </div>

        {loading && <LoadingSpinner text="Cargando pagos…" />}

        {!loading && error && (
          <div className="text-center py-[60px] text-red-text">Error: {error}</div>
        )}

        {!loading && !error && (
          <div className="animate-slide-up stagger-5 bg-surface rounded-[24px] overflow-hidden">
            <div className="px-3 sm:px-5 py-3 sm:py-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-2xl bg-amber-bg text-amber-text flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>
                </div>
                <div>
                  <div className="text-[13px] font-semibold">Pagos</div>
                  <div className="text-[11px] text-text-3 mt-0.5 hidden sm:block">Historial de transacciones registradas</div>
                </div>
              </div>
            </div>
            <ResponsiveTable
              columns={paymentColumns}
              data={payments}
              keyExtractor={(p) => p.id}
              cardTitle={(p) => p.member}
              cardSubtitle={(p) => p.email}
              cardAvatar={(p) => {
                const c = AVATAR_COLORS[p.av];
                return (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0"
                    style={{ background: c.bg, color: c.fg }}>
                    {initials(p.member)}
                  </div>
                );
              }}
              cardFields={[
                {
                  label: 'Monto',
                  value: (p: Payment) => (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold">{fmtMoney(p.amount)}</span>
                    </div>
                  ),
                },
                { label: 'Estado', value: (p: Payment) => (
                  p.status === 'paid' ? <Badge variant="green" dot>Pagado</Badge> : p.status === 'pending' ? <Badge variant="amber" dot>Pendiente</Badge> : <Badge variant="red" dot>Cancelado</Badge>
                )},
                { label: 'Concepto', value: (p: Payment) => p.concept },
                { label: 'Método', value: (p: Payment) => (
                  <span className="text-[11px] font-medium" style={{ color: METHOD_COLORS[p.method] }}>{METHOD_LABELS[p.method]}</span>
                )},
                { label: 'Fecha', value: (p: Payment) => fmtDate(p.date) },
              ]}
              cardActions={(p: Payment) => (
                <div className="flex">
                  <div className="ml-auto flex items-center gap-3">
                    <IconButton title="Ver recibo" onClick={() => setReceiptTarget(p)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                    </IconButton>
                    <IconButton title="Editar estado" onClick={() => { setEditTarget(p); setEditStatus(p.status); }}>
                      <IconEdit width="13" height="13" />
                    </IconButton>
                  </div>
                </div>
              )}
              emptyMessage="No se encontraron pagos con ese criterio."
            />

            <Pagination
              current={currentPage}
              total={totalPages}
              start={(currentPage - 1) * ROWS_PER_PAGE + 1}
              end={Math.min(currentPage * ROWS_PER_PAGE, count)}
              totalItems={count}
              label="pagos"
              onChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      <Modal compact icon={
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      } title="COMPROBANTE" open={receiptTarget !== null} onClose={() => setReceiptTarget(null)}>
        {receiptTarget && (
          <>
            <div className="flex flex-col items-center mb-5">
              <div className="w-11 h-11 rounded-full flex items-center justify-center bg-accent-dim mb-2.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
              <div className="text-[28px] font-semibold font-mono leading-none -tracking-[0.03em]" style={{ color: receiptTarget.status === 'paid' ? 'var(--green-text)' : 'var(--amber-text)' }}>
                <span>{fmtMoney(receiptTarget.amount)}</span>
              </div>
              <div className="mt-2">
                {receiptTarget.status === 'paid' ? <Badge variant="green" dot>Pagado</Badge> : receiptTarget.status === 'pending' ? <Badge variant="amber" dot>Pendiente</Badge> : <Badge variant="red" dot>Cancelado</Badge>}
              </div>
            </div>

            <div className="border-t border-dashed border-border pt-4 space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[11px] text-text-3 uppercase tracking-[0.06em]">Miembro</span>
                <div className="text-right">
                  <div className="text-[13px] font-medium">{receiptTarget.member}</div>
                  <div className="text-[11px] text-text-3">{receiptTarget.email}</div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[11px] text-text-3 uppercase tracking-[0.06em]">Concepto</span>
                <span className="text-[12px] text-right max-w-[200px]">{receiptTarget.concept}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[11px] text-text-3 uppercase tracking-[0.06em]">Método</span>
                <span className="inline-flex items-center gap-1.5 text-[12px] font-medium" style={{ color: METHOD_COLORS[receiptTarget.method] }}>
                  {receiptTarget.method === 'cash' && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /></svg>}
                  {receiptTarget.method === 'card' && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>}
                  {receiptTarget.method === 'transfer' && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>}
                  {METHOD_LABELS[receiptTarget.method]}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[11px] text-text-3 uppercase tracking-[0.06em]">Fecha</span>
                <span className="text-[12px]">{fmtDate(receiptTarget.date)}</span>
              </div>

              {receiptTarget.notes && (
                <div className="flex justify-between items-start">
                  <span className="text-[11px] text-text-3 uppercase tracking-[0.06em]">Notas</span>
                  <span className="text-[11px] text-text-2 text-right max-w-[200px] italic">{receiptTarget.notes}</span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-border mt-4 pt-3 flex justify-center">
              <span className="text-[10px] text-text-3 tracking-[0.08em]">omega gym · recibo #{receiptTarget.id.slice(0, 8)}</span>
            </div>
          </>
        )}
      </Modal>

      <Modal compact icon={
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      } title="EDITAR ESTADO" open={editTarget !== null} onClose={() => setEditTarget(null)}>
        {editTarget && (
          <div className="flex flex-col gap-0">
            <div className="flex flex-col items-center mb-5">
              <div className="text-[32px] font-semibold font-mono leading-none -tracking-[0.03em]" style={{ color: editTarget.status === 'paid' ? 'var(--green-text)' : editTarget.status === 'pending' ? 'var(--amber-text)' : 'var(--red-text)' }}>
                {fmtMoney(editTarget.amount)}
              </div>
              <div className="text-[12px] text-text-3 mt-1">{editTarget.concept}</div>
              <div className="mt-2">
                {editTarget.status === 'paid' ? <Badge variant="green" dot>Pagado</Badge> : editTarget.status === 'pending' ? <Badge variant="amber" dot>Pendiente</Badge> : <Badge variant="red" dot>Cancelado</Badge>}
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="text-[11px] text-text-3 uppercase tracking-[0.08em] mb-3">Cambiar estado</div>
              <div className="grid grid-cols-2 gap-2">
                {([['paid', 'Pagado', 'green', '✓'],
                  ['pending', 'Pendiente', 'amber', '⋯']] as const).map(([val, label, color, symbol]) => (
                  <button
                    key={val}
                    onClick={() => setEditStatus(val)}
                    className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-2xl border text-center transition-all duration-150 ${
                      editStatus === val
                        ? 'border-' + color + ' bg-' + color + '-dim'
                        : 'border-border2 bg-surface2'
                    }`}
                    style={{
                      borderColor: editStatus === val ? `var(--${color})` : undefined,
                      background: editStatus === val ? `color-mix(in srgb, var(--${color}) 10%, var(--surface2))` : undefined,
                    }}
                  >
                    <span className="text-[15px] font-semibold" style={{ color: `var(--${color}-text)` }}>{symbol}</span>
                    <span className="text-[11px] font-medium" style={{ color: editStatus === val ? `var(--${color}-text)` : 'var(--text-3)' }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {editTarget.status !== editStatus && (
              <div className="mt-4 pt-3 border-t border-border flex items-center gap-2 text-[11px] text-text-3">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Este cambio se guardará de forma permanente.
              </div>
            )}

            <div className="flex justify-end gap-2.5 mt-5">
              <Button variant="ghost" onClick={() => setEditTarget(null)} disabled={editSaving}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleEditSave} disabled={editStatus === editTarget!.status || editSaving}>
                {editSaving ? 'Guardando…' : 'Guardar cambio'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <BottomSheet
        open={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        title="Opciones"
        subtitle="Pagos"
        maxWidth="420px"
      >
        <ListGroup>
          <ListTile
            icon={<IconCalendar width="16" height="16" />}
            title="Ir al mes actual"
            onClick={() => { goToCurrentMonth(); setOptionsOpen(false); }}
          />
          <ListTile
            icon={<IconRefresh width="16" height="16" />}
            title="Recargar"
            subtitle="Volver a consultar los pagos del mes"
            onClick={() => { setReloadKey((k) => k + 1); setOptionsOpen(false); }}
          />
          <ListTile
            icon={<IconClose width="16" height="16" />}
            title="Limpiar filtros"
            subtitle="Búsqueda, estado y página"
            danger
            onClick={() => { clearFilters(); setOptionsOpen(false); }}
          />
        </ListGroup>
      </BottomSheet>

      {/* Exportar pagos — reporte del mes seleccionado */}
      <BottomSheet
        open={exportOpen}
        onClose={() => { if (!exporting) setExportOpen(false) }}
        title={<span className="text-[22px] font-bold tracking-tight">Exportar pagos</span>}
        panelClassName="bg-surface rounded-t-sheet"
        maxWidth="440px"
      >
        <p className="-mt-1 mb-4 text-[13px] text-text-2">Selecciona el rango de meses</p>

        <div className="overflow-hidden rounded-[24px] bg-surface2">
          <div className="border-b border-surface3">
            <MonthPicker
              variant="list"
              label="Desde"
              year={exportFromYear}
              month={exportFromMonth}
              onChange={(year, month) => {
                setExportFromYear(year);
                setExportFromMonth(month);
              }}
              disabled={exporting}
            />
          </div>
          <MonthPicker
            variant="list"
            label="Hasta"
            year={exportToYear}
            month={exportToMonth}
            onChange={(year, month) => {
              setExportToYear(year);
              setExportToMonth(month);
            }}
            disabled={exporting}
          />
        </div>

        {exportRangeInvalid && (
          <p className="mt-3 px-1 text-[12px] text-red-text">
            El mes «Desde» no puede ser posterior al mes «Hasta».
          </p>
        )}

        <div className="mt-5 flex flex-col gap-1">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => handleExport('download')}
            disabled={exporting || exportRangeInvalid}
          >
            {exporting ? 'Generando…' : 'Descargar PDF'}
          </Button>
          <button
            type="button"
            onClick={() => handleExport('preview')}
            disabled={exporting || exportRangeInvalid}
            className="w-full h-14 rounded-full bg-surface2 text-text text-[16px] font-semibold border-none cursor-pointer font-sans active:opacity-70 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Vista previa
          </button>
          <button
            type="button"
            onClick={() => setExportOpen(false)}
            disabled={exporting}
            className="w-full h-11 rounded-full bg-transparent text-accent text-[14px] font-semibold border-none cursor-pointer font-sans active:opacity-70 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
