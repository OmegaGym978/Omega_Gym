import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { trainingService, type PlanListItem, type PlanExercise } from '@/services/training.service';
import { membersService, type MemberListItem } from '@/services/members.service';
import { membershipsService, type Membership, type MembershipType } from '@/services/memberships.service';
import { exercisesService, type Exercise } from '@/services/exercises.service';
import { Button } from '@/components/ui/atoms/Button';
import { Badge } from '@/components/ui/atoms/Badge';
import { Checkmark } from '@/components/ui/atoms/Checkmark';
import { MetricCard } from '@/components/ui/atoms/MetricCard';
import { ScreenHeader } from '@/components/ui/layout/ScreenHeader';
import { RoutineBuilder, type EditPlanData } from '@/components/routine-builder/RoutineBuilder';
import { ScheduleSheet } from '@/components/schedule/ScheduleSheet';
import { formatSchedule } from '@/lib/dates';
import { Modal } from '@/components/ui/molecules/Modal';
import { IconAlert } from '@/lib/icons';
import { toast } from 'sonner';
import { initials, fmtDate } from '@/lib/helpers';

interface PlanMember {
  id: string;
  name: string;
  initials: string;
}

interface Plan {
  id: string;
  name: string;
  desc: string;
  type: 'assigned' | 'draft';
  trainer: string;
  members: PlanMember[];
  exerciseCount: number;
  exercises: PlanExercise[];
  scheduled_days: number[] | null;
}

const FILTER_TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'assigned', label: 'Asignados' },
  { key: 'draft', label: 'Sin asignar' },
];

function initialsOf(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function TrainingPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderEditPlan, setBuilderEditPlan] = useState<EditPlanData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ planId: string; memberId: string; memberName: string } | null>(null);
  const [assigneeOpen, setAssigneeOpen] = useState(true);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [membersList, setMembersList] = useState<MemberListItem[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [previewMember, setPreviewMember] = useState<MemberListItem | null>(null);
  const [previewMembership, setPreviewMembership] = useState<(Membership & { membership_types: MembershipType }) | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedExId, setSelectedExId] = useState<string | null>(null);
  const [catalogMap, setCatalogMap] = useState<Map<string, Exercise>>(new Map());
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);

  const navigate = useNavigate();

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await trainingService.getAll({ pageSize: 100 });
      const mapped: Plan[] = result.data.map((p: PlanListItem) => ({
        id: p.id,
        name: p.name,
        desc: p.description ?? '',
        type: p.type,
        trainer: p.trainer_name,
        members: (p.member_ids || []).map((memberId: string, i: number) => {
          const n = p.member_names[i] ?? '—';
          return { id: memberId, name: n, initials: initialsOf(n) };
        }),
        exerciseCount: p.exercise_count,
        exercises: [],
        scheduled_days: p.scheduled_days ?? null,
      }));
      setPlans(mapped);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const selectedPlan = plans.find(p => p.id === selectedId) || null;

  const loadDetail = useCallback(async (planId: string) => {
    setDetailLoading(true);
    try {
      const data = await trainingService.getById(planId);
      setPlans(prev => prev.map(p => {
        if (p.id !== planId) return p;
        return {
          ...p,
          exercises: data.exercises ?? [],
          members: (data.assignees || []).map((a: any) => ({
            id: a.id,
            name: a.full_name,
            initials: initialsOf(a.full_name),
          })),
        };
      }));

      const allExercises: PlanExercise[] = data.exercises || [];
      const catalogIds = [...new Set(allExercises.filter(e => !!e.exercise_id).map(e => e.exercise_id as string))];
      if (catalogIds.length > 0) {
        try {
          const catalogExs = await exercisesService.getByIds(catalogIds);
          const newMap = new Map<string, Exercise>();
          catalogExs.forEach(ce => newMap.set(ce.id, ce));
          setCatalogMap(newMap);
        } catch {
          // El catálogo es opcional para el detalle
        }
      }
    } catch {
      // se mantiene la lista previa
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => { if (selectedId) loadDetail(selectedId); }, [selectedId, loadDetail]);

  const filteredPlans = plans
    .filter(p => {
      if (filter === 'assigned') return p.type === 'assigned';
      if (filter === 'draft') return p.type === 'draft';
      return true;
    })
    .filter(p => {
      if (!search) return true;
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.members.some(m => m.name.toLowerCase().includes(q));
    });

  const metrics = { total: plans.length, assigned: plans.filter(p => p.type === 'assigned').length };

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await trainingService.delete(deleteTarget.id);
      setDeleteTarget(null);
      setSelectedId(null);
      fetchPlans();
      toast.success('Plan eliminado');
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleDuplicate(planId: string) {
    try {
      const newId = await trainingService.duplicate(planId);
      await fetchPlans();
      setSelectedId(newId);
      toast.success('Plan duplicado');
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleRemoveMember(planId: string, memberId: string) {
    if (!memberId) {
      toast.error('No se pudo identificar al miembro. Actualiza el plan para cargar los datos.');
      return;
    }
    try {
      await trainingService.removeAssignment(planId, memberId);
      await fetchPlans();
      if (selectedId === planId) loadDetail(planId);
      toast.success('Miembro removido del plan');
    } catch (e: any) { toast.error(e.message); }
  }

  async function confirmRemoveMember() {
    if (!removeTarget) return;
    await handleRemoveMember(removeTarget.planId, removeTarget.memberId);
    setRemoveTarget(null);
  }

  async function showMemberInfo(member: PlanMember) {
    setPreviewLoading(true);
    setPreviewMember(null);
    setPreviewMembership(null);
    try {
      const [profile, activeMs] = await Promise.all([
        membersService.getById(member.id),
        membershipsService.getActiveWithType(member.id),
      ]);
      setPreviewMember(profile);
      setPreviewMembership(activeMs);
    } catch {
      toast.error('Error al cargar información del miembro');
    } finally { setPreviewLoading(false); }
  }

  async function openAssignModal() {
    if (!selectedPlan) return;
    try {
      const [result, assignees] = await Promise.all([
        membersService.getAll({ pageSize: 200, role: 'member' }),
        trainingService.getAssignees(selectedPlan.id),
      ]);
      const assignedIds = new Set(assignees.map(a => a.id));
      setMembersList(result.data.filter(m => !assignedIds.has(m.id)));
      setSelectedMemberIds([]);
      setAssignModalOpen(true);
    } catch (e: any) { toast.error('Error al cargar miembros: ' + e.message); }
  }

  function toggleMemberSelection(memberId: string) {
    setSelectedMemberIds(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId],
    );
  }

  async function handleAssignMultiple() {
    if (!selectedPlan || selectedMemberIds.length === 0) return;
    setAssigning(true);
    try {
      await trainingService.assignMultiple(selectedPlan.id, selectedMemberIds);
      setAssignModalOpen(false);
      await fetchPlans();
      loadDetail(selectedPlan.id);
      toast.success(`Plan asignado a ${selectedMemberIds.length} miembro${selectedMemberIds.length !== 1 ? 's' : ''}`);
    } catch (e: any) { toast.error(e.message); } finally { setAssigning(false); }
  }

  function openNewPlan() { setBuilderEditPlan(null); setBuilderOpen(true); }

  async function openEditPlan(planId: string) {
    try {
      const data = await trainingService.getById(planId);
      setBuilderEditPlan({ id: data.id, name: data.name, description: data.description, exercises: data.exercises });
      setBuilderOpen(true);
    } catch (e: any) { toast.error('Error al cargar plan: ' + e.message); }
  }

  async function onBuilderSave(planId?: string) {
    await fetchPlans();
    if (planId) { setSelectedId(planId); loadDetail(planId); }
    else if (selectedId) loadDetail(selectedId);
  }

  async function saveSchedule(days: number[]) {
    if (!selectedPlan) return;
    setScheduleSaving(true);
    try {
      await trainingService.setSchedule(selectedPlan.id, days);
      setPlans(prev => prev.map(p => (
        p.id === selectedPlan.id ? { ...p, scheduled_days: days.length > 0 ? days : null } : p
      )));
      toast.success(days.length > 0 ? 'Días actualizados' : 'Plan sin días programados');
      setScheduleOpen(false);
    } catch (e: any) {
      toast.error('No se pudo programar: ' + e.message);
    } finally {
      setScheduleSaving(false);
    }
  }

  const selectedExercise = selectedPlan?.exercises.find(e => e.id === selectedExId) ?? null;
  const selectedCatalog = selectedExercise?.exercise_id ? catalogMap.get(selectedExercise.exercise_id) : null;

  return (
    <>
      <ScreenHeader
        title="Planes"
        subtitle={`${metrics.total} planes · ${metrics.assigned} asignados`}
        wide
        actions={
          <Button variant="plain" onClick={openNewPlan} icon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          }>
            Nuevo
          </Button>
        }
      />

      <div className="px-4 sm:px-6 py-4 flex-1 mx-auto w-full max-w-[1100px]">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <MetricCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>}
            color="accent"
            value={metrics.total}
            label="Planes totales"
          />
          <MetricCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
            color="green"
            value={metrics.assigned}
            label="Asignados"
          />
        </div>

        <div className="relative mb-3">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar plan o miembro..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface2 border border-border text-text text-[15px] pl-10 pr-4 py-3 rounded-full outline-none placeholder:text-text-3 focus:border-accent/60 transition-colors"
          />
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto">
          {FILTER_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold border cursor-pointer transition-colors ${
                filter === t.key
                  ? 'bg-accent text-accent-contrast border-accent'
                  : 'bg-surface2 text-text-3 border-border text-text-2'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map(i => <div key={i} className="h-[96px] rounded-2xl skeleton" />)}
          </div>
        ) : error ? (
          <div className="bg-surface  rounded-2xl p-6 text-center">
            <div className="text-sm text-red-text">Error: {error}</div>
            <button onClick={fetchPlans} className="mt-3 px-4 py-2 rounded-full bg-accent text-accent-contrast text-xs font-bold border-none cursor-pointer">
              Reintentar
            </button>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="bg-surface  rounded-2xl p-10 text-center text-sm text-text-3">
            Sin resultados
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {filteredPlans.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setSelectedId(p.id); setAssigneeOpen(true); }}
                className="text-left bg-surface  rounded-2xl p-4 cursor-pointer border-accent/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[15px] font-bold truncate">{p.name}</div>
                    <div className="text-[11px] text-text-3 truncate mt-0.5">
                      {p.type === 'assigned' ? `${p.members.length} miembro${p.members.length !== 1 ? 's' : ''}` : `Por ${p.trainer}`}
                    </div>
                  </div>
                  <Badge variant={p.type === 'assigned' ? 'green' : 'gray'}>
                    {p.type === 'assigned' ? 'Asignado' : 'Sin asignar'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <div className="flex -space-x-2">
                    {p.members.slice(0, 3).map(m => (
                      <span key={m.id} className="w-6 h-6 rounded-full bg-surface3 border border-surface text-text-2 text-[9px] font-bold flex items-center justify-center">
                        {m.initials}
                      </span>
                    ))}
                  </div>
                  <span className="text-[11px] text-text-3 ml-auto">{p.exerciseCount} ejercicios</span>
                </div>
                {p.scheduled_days && p.scheduled_days.length > 0 && (
                  <div className="mt-1.5 text-[11px] font-semibold text-accent">{formatSchedule(p.scheduled_days)}</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detalle a pantalla completa */}
      {selectedPlan && (
        <div className="fixed inset-0 z-40 bg-bg flex flex-col animate-picker-in">
          <ScreenHeader
            title={selectedPlan.name}
            subtitle={selectedPlan.desc || 'Detalle del plan'}
            back
            onBack={() => setSelectedId(null)}
            menu={false}
            wide
            actions={
              <>
                <button
                  onClick={() => setScheduleOpen(true)}
                  aria-label="Programar días"
                  className="w-9 h-9 rounded-full bg-surface2 border border-border text-text-2 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                </button>
                <button
                  onClick={() => handleDuplicate(selectedPlan.id)}
                  aria-label="Duplicar plan"
                  className="w-9 h-9 rounded-full bg-surface2 border border-border text-text-2 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                </button>
                <button
                  onClick={() => openEditPlan(selectedPlan.id)}
                  aria-label="Editar plan"
                  className="w-9 h-9 rounded-full bg-surface2 border border-border text-text-2 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                </button>
                <button
                  onClick={() => setDeleteTarget(selectedPlan)}
                  aria-label="Eliminar plan"
                  className="w-9 h-9 rounded-full bg-red-bg border border-red/20 text-red-text flex items-center justify-center cursor-pointer transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                </button>
              </>
            }
          />

          <div className="flex-1 overflow-y-auto pb-28">
            <div className="px-4 sm:px-6 py-4 mx-auto w-full max-w-[1100px] flex flex-col gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={selectedPlan.type === 'assigned' ? 'green' : 'gray'}>
                  {selectedPlan.type === 'assigned' ? 'Asignado' : 'Sin asignar'}
                </Badge>
                <Badge variant="gray">Por {selectedPlan.trainer}</Badge>
                <Badge variant="accent">{selectedPlan.exercises.length} ejercicios</Badge>
                {selectedPlan.scheduled_days && selectedPlan.scheduled_days.length > 0 && (
                  <Badge variant="teal">{formatSchedule(selectedPlan.scheduled_days)}</Badge>
                )}
              </div>

              {/* Asignados */}
              <div className="bg-surface  rounded-2xl overflow-hidden">
                <button
                  onClick={() => setAssigneeOpen(v => !v)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 bg-transparent border-none cursor-pointer text-left"
                >
                  <span className="text-[13px] font-semibold">
                    Asignados <span className="text-text-3">({selectedPlan.members.length})</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={e => { e.stopPropagation(); openAssignModal(); }}
                      onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); openAssignModal(); } }}
                      className="px-3 py-1.5 rounded-full bg-accent text-accent-contrast text-[11px] font-bold"
                    >
                      + Asignar
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-text-3 transition-transform ${assigneeOpen ? 'rotate-180' : ''}`}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>

                {assigneeOpen && (
                  <div className="px-4 pb-3 flex flex-col gap-1.5">
                    {selectedPlan.members.length === 0 ? (
                      <div className="text-[12px] text-text-3 py-2">Aún no hay miembros asignados</div>
                    ) : selectedPlan.members.map(m => (
                      <div key={m.id} className="flex items-center gap-3 py-1.5">
                        <span className="w-8 h-8 rounded-full bg-surface3 text-text-2 text-[11px] font-bold flex items-center justify-center shrink-0">
                          {m.initials}
                        </span>
                        <span className="text-[13px] truncate flex-1">{m.name}</span>
                        <button
                          onClick={() => showMemberInfo(m)}
                          aria-label={`Ver ${m.name}`}
                          className="w-8 h-8 rounded-full bg-surface2 border border-border text-text-3 flex items-center justify-center cursor-pointer"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        </button>
                        <button
                          onClick={() => setRemoveTarget({ planId: selectedPlan.id, memberId: m.id, memberName: m.name })}
                          aria-label={`Quitar ${m.name}`}
                          className="w-8 h-8 rounded-full bg-transparent text-text-3 flex items-center justify-center cursor-pointer"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ejercicios */}
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] uppercase tracking-[0.08em] text-text-3 font-bold">Ejercicios del plan</span>
                {detailLoading && <span className="text-[11px] text-text-3">Cargando…</span>}
              </div>

              {selectedPlan.exercises.length === 0 && !detailLoading ? (
                <div className="bg-surface  rounded-2xl p-8 text-center">
                  <div className="text-sm font-semibold">Sin ejercicios</div>
                  <div className="text-[12px] text-text-3 mt-1">Edita el plan para agregar ejercicios.</div>
                </div>
              ) : (
                selectedPlan.exercises.map((e, i) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setSelectedExId(e.id)}
                    className="w-full flex items-center gap-3 bg-surface  rounded-2xl p-3 text-left cursor-pointer border-accent/30 transition-colors"
                  >
                    <span className="w-8 h-8 rounded-full bg-accent-dim text-accent text-[11px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold truncate">{e.exercise_name}</span>
                      {e.muscle && <span className="block text-[11px] text-text-3 truncate">{e.muscle}</span>}
                    </span>
                    <span className="shrink-0 text-[11px] text-text-3 font-mono">{e.sets ?? '—'} × {e.reps ?? '—'}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Asignar plan */}
      <Modal open={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Asignar plan" compact>
        <div className="flex flex-col gap-3">
          <p className="text-[12px] text-text-3">Selecciona los miembros para asignar este plan:</p>
          <div className="flex flex-col max-h-[260px] overflow-y-auto -mx-2 px-2">
            {membersList.length === 0 ? (
              <div className="text-[12px] text-text-3 py-3">No hay miembros disponibles</div>
            ) : membersList.map(m => {
              const isSelected = selectedMemberIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMemberSelection(m.id)}
                  className={`flex items-center gap-3 px-2 py-2.5 text-left rounded-xl border-none cursor-pointer transition-colors ${
                    isSelected ? 'bg-accent-dim' : 'bg-transparent'
                  }`}
                >
                  <Checkmark checked={isSelected} size="sm" />
                  <span className="w-8 h-8 rounded-full bg-surface3 text-text-2 text-[10px] font-bold flex items-center justify-center">{initialsOf(m.full_name)}</span>                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium truncate">{m.full_name}</span>
                    {m.email && <span className="block text-[11px] text-text-3 truncate">{m.email}</span>}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setAssignModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={handleAssignMultiple} disabled={selectedMemberIds.length === 0 || assigning}>
              {assigning ? 'Asignando...' : `Asignar (${selectedMemberIds.length})`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Vista rápida de miembro */}
      <Modal open={previewMember !== null} onClose={() => { setPreviewMember(null); setPreviewMembership(null); }} title="Miembro" compact>
        {previewLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
        ) : previewMember ? (
          <div className="flex flex-col">
            <div className="flex items-center gap-4 pb-5 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-accent-dim text-accent text-[16px] font-bold flex items-center justify-center">
                {initials(previewMember.full_name)}
              </div>
              <div>
                <div className="text-[15px] font-semibold">{previewMember.full_name}</div>
                {previewMember.role === 'admin' ? <Badge variant="accent" dot>Admin</Badge> : previewMember.role === 'trainer' ? <Badge variant="teal" dot>Entrenador</Badge> : <Badge variant="gray" dot>Miembro</Badge>}
              </div>
            </div>
            <div className="pt-4 pb-3">
              <div className="text-[10px] font-bold text-text-3 uppercase tracking-[0.08em] mb-3">Membresía actual</div>
              {previewMembership ? (
                <div className="flex flex-col gap-2.5">
                  <DetailRow label="Plan" value={previewMembership.membership_types.name} />
                  <DetailRow label="Inicio" value={fmtDate(previewMembership.start_date)} />
                  <DetailRow label="Vencimiento" value={fmtDate(previewMembership.end_date)} />
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-text-3">Estado</span>
                    {previewMembership.status === 'active' ? <Badge variant="green" dot>Activa</Badge> : previewMembership.status === 'expired' ? <Badge variant="red" dot>Vencida</Badge> : <Badge variant="amber" dot>Cancelada</Badge>}
                  </div>
                </div>
              ) : (
                <div className="text-[12px] text-text-3">Sin membresía activa</div>
              )}
            </div>
            <div className="pt-3 border-t border-border">
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={() => { setPreviewMember(null); setPreviewMembership(null); navigate(`/members/${previewMember.id}`); }}
              >
                Ir a perfil completo
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Eliminar plan" compact icon={<IconAlert width="16" height="16" />}>
        <div className="flex flex-col gap-4">
          <div className="text-[13px] leading-relaxed">
            ¿Estás seguro de eliminar el plan <strong>{deleteTarget?.name}</strong>?
          </div>
          <div className="text-[12px] text-text-3 bg-red-bg border border-red/20 rounded-2xl p-3 leading-relaxed">
            Se eliminarán todos los ejercicios asociados. Esta acción no se puede deshacer.
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button variant="danger" size="sm" onClick={confirmDelete}>Eliminar</Button>
        </div>
      </Modal>

      <Modal open={removeTarget !== null} onClose={() => setRemoveTarget(null)} title="Quitar miembro" compact icon={<IconAlert width="16" height="16" />}>
        <div className="flex flex-col gap-4">
          <div className="text-[13px] leading-relaxed">
            ¿Seguro que quieres quitar a <strong>{removeTarget?.memberName}</strong> del plan?
          </div>
          <div className="text-[12px] text-text-3 bg-red-bg border border-red/20 rounded-2xl p-3 leading-relaxed">
            Solo se elimina la asignación del miembro a este plan. El miembro y su información no se borran.
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="ghost" size="sm" onClick={() => setRemoveTarget(null)}>Cancelar</Button>
          <Button variant="danger" size="sm" onClick={confirmRemoveMember}>Quitar</Button>
        </div>
      </Modal>

      <RoutineBuilder open={builderOpen} onClose={() => setBuilderOpen(false)} onSave={onBuilderSave} editPlan={builderEditPlan} />

      <ScheduleSheet
        open={scheduleOpen && !!selectedPlan}
        onClose={() => setScheduleOpen(false)}
        planName={selectedPlan?.name}
        initialDays={selectedPlan?.scheduled_days ?? null}
        saving={scheduleSaving}
        onSave={saveSchedule}
      />

      {/* Detalle de ejercicio */}
      <Modal
        open={!!selectedExercise}
        onClose={() => setSelectedExId(null)}
        title={selectedExercise?.exercise_name ?? ''}
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-accent">
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
          </svg>
        }
      >
        {selectedExercise && (
          <>
            {(selectedCatalog?.gif_url || selectedCatalog?.image_url) && (
              <div className="rounded-2xl overflow-hidden bg-surface2 border border-border -mx-1">
                <img
                  src={selectedCatalog.gif_url || selectedCatalog.image_url!}
                  alt={selectedExercise.exercise_name}
                  className="max-h-[300px] object-contain mx-auto sm:w-full"
                />
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              {selectedExercise.muscle && (
                <span className="bg-accent-dim text-accent text-[11px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wide">{selectedExercise.muscle}</span>
              )}
              {selectedCatalog?.equipment && selectedCatalog.equipment !== 'bodyweight' && (
                <span className="bg-surface2 text-text-3 text-[11px] px-2.5 py-1 rounded-full border border-border">{selectedCatalog.equipment}</span>
              )}
              {selectedCatalog?.body_part && (
                <span className="bg-surface2 text-text-3 text-[11px] px-2.5 py-1 rounded-full border border-border">{selectedCatalog.body_part}</span>
              )}
            </div>

            {selectedCatalog?.secondary_muscles && selectedCatalog.secondary_muscles.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-text-3 uppercase tracking-[0.05em] mb-1.5">Músculos secundarios</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedCatalog.secondary_muscles.map(m => (
                    <span key={m} className="bg-surface2 text-text-2 text-[11px] px-2 py-1 rounded-full border border-border">{m}</span>
                  ))}
                </div>
              </div>
            )}

            {selectedCatalog?.instructions_es && (
              <div>
                <div className="text-[11px] font-bold text-text-3 uppercase tracking-[0.05em] mb-2">Instrucciones</div>
                <div className="text-[13px] text-text-2 leading-relaxed pl-3 border-l-2 border-accent/30">
                  {selectedCatalog.instructions_es}
                </div>
              </div>
            )}

            {selectedExercise.notes && selectedExercise.notes !== selectedCatalog?.instructions_es && (
              <div className="bg-surface2 border border-border rounded-2xl p-3">
                <div className="text-[11px] font-bold text-text-3 uppercase tracking-[0.05em] mb-1">Notas del entrenador</div>
                <div className="text-[13px] text-text-2">{selectedExercise.notes}</div>
              </div>
            )}

            {selectedExercise.reference_link && (
              <a
                href={selectedExercise.reference_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[13px] text-accent transition-colors no-underline"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Ver referencia externa
              </a>
            )}

            {!selectedCatalog?.gif_url && !selectedCatalog?.image_url && !selectedCatalog?.instructions_es && !selectedExercise.notes && !selectedExercise.reference_link && (
              <div className="text-center text-[13px] text-text-3 py-4">
                Este ejercicio no tiene información detallada en el catálogo.
              </div>
            )}
          </>
        )}
      </Modal>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-text-3">{label}</span>
      <span className="text-[12px] font-medium text-text">{value}</span>
    </div>
  );
}
