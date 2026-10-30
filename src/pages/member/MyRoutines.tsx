import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'
import { routinesService, type RoutineListItem } from '@/services/routines.service'
import { trainingService, type TrainingPlan, type PlanExercise } from '@/services/training.service'
import { Button } from '@/components/ui/atoms/Button'
import { Input } from '@/components/ui/atoms/Input'
import { Modal } from '@/components/ui/molecules/Modal'
import { RoutineBuilder, type EditPlanData } from '@/components/routine-builder/RoutineBuilder'
import { WorkoutSession } from '@/components/workout/WorkoutSession'
import { ScreenHeader } from '@/components/ui/layout/ScreenHeader'
import { ScheduleSheet } from '@/components/schedule/ScheduleSheet'
import { formatSchedule } from '@/lib/dates'

type AssignedPlan = TrainingPlan & {
  creator: { id: string; full_name: string } | null
  visible?: boolean
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })

function summaryOf(r: RoutineListItem): string {
  if (r.exercise_names.length === 0) return 'Aún sin ejercicios'
  const shown = r.exercise_names.slice(0, 4).join(' · ')
  return r.exercise_names.length > 4 ? `${shown} · …` : shown
}

export default function MyRoutinesPage() {
  const user = useAuthStore(s => s.user)

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [routines, setRoutines] = useState<RoutineListItem[]>([])
  const [assignedPlans, setAssignedPlans] = useState<AssignedPlan[]>([])
  const [searchParams, setSearchParams] = useSearchParams()

  // Builder (crear/editar)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editData, setEditData] = useState<EditPlanData | null>(null)

  // Acciones por tarjeta
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RoutineListItem | null>(null)

  // Compartir
  const [shareFor, setShareFor] = useState<RoutineListItem | null>(null)
  const [shareCode, setShareCode] = useState('')
  const [shareLoading, setShareLoading] = useState(false)

  // Programación
  const [scheduleFor, setScheduleFor] = useState<RoutineListItem | null>(null)
  const [scheduleSaving, setScheduleSaving] = useState(false)

  // Importar
  const [importOpen, setImportOpen] = useState(false)
  const [importCode, setImportCode] = useState('')
  const [importing, setImporting] = useState(false)

  // Sesión de entrenamiento (solo UI)
  const [session, setSession] = useState<{ planId: string; name: string; exercises: PlanExercise[]; loading: boolean } | null>(null)
  const sessionReq = useRef(0)

  const loadAll = useCallback(async () => {
    if (!user) return
    setLoadError(null)
    try {
      const [mine, assigned] = await Promise.all([
        routinesService.getMine(user.id),
        trainingService.getByMemberAll(user.id),
      ])
      setRoutines(mine)
      setAssignedPlans(assigned as AssignedPlan[])
    } catch (e: any) {
      setLoadError(e?.message || 'No se pudieron cargar tus rutinas')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    loadAll()
  }, [user, loadAll])

  const openCreate = () => {
    setEditData(null)
    setBuilderOpen(true)
  }

  const openEdit = useCallback(async (r: RoutineListItem) => {
    setMenuFor(null)
    try {
      const { routine, exercises } = await routinesService.getDetail(r.id)
      setEditData({
        id: routine.id,
        name: routine.name,
        description: routine.description,
        exercises: exercises.map(ex => ({
          exercise_id: ex.exercise_id,
          exercise_name: ex.exercise_name,
          muscle: ex.muscle,
          sets: ex.sets,
          reps: ex.reps,
          rest_seconds: ex.rest_seconds,
          notes: ex.notes,
          reference_link: ex.reference_link,
          order_index: ex.order_index,
          set_details: ex.set_details,
        })),
      })
      setBuilderOpen(true)
    } catch (e: any) {
      toast.error('Error al cargar la rutina: ' + e.message)
    }
  }, [])

  // ?edit=<id>: abrir el builder automáticamente (flujo desde Mi plan)
  useEffect(() => {
    if (loading) return
    const editId = searchParams.get('edit')
    if (!editId) return
    const target = routines.find(r => r.id === editId)
    if (target) openEdit(target)
    setSearchParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  // Toggle optimista de visibilidad en Mi plan
  const togglePlanVisibility = useCallback(async (r: RoutineListItem) => {
    setMenuFor(null)
    const next = !r.show_in_plan
    setRoutines(prev => prev.map(x => (x.id === r.id ? { ...x, show_in_plan: next } : x)))
    try {
      await routinesService.setPlanVisibility(r.id, next)
      toast.success(next ? 'Rutina visible en Mi plan' : 'Rutina oculta de Mi plan')
    } catch (e: any) {
      setRoutines(prev => prev.map(x => (x.id === r.id ? { ...x, show_in_plan: !next } : x)))
      toast.error('Error al actualizar: ' + e.message)
    }
  }, [])

  // Toggle optimista para planes asignados (RPC por miembro)
  const toggleAssignedVisibility = useCallback(async (a: AssignedPlan) => {
    setMenuFor(null)
    const next = !(a.visible !== false)
    setAssignedPlans(prev => prev.map(x => (x.id === a.id ? { ...x, visible: next } : x)))
    try {
      await trainingService.setAssignedVisibility(a.id, next)
      toast.success(next ? 'Rutina visible en Mi plan' : 'Rutina oculta de Mi plan')
    } catch (e: any) {
      setAssignedPlans(prev => prev.map(x => (x.id === a.id ? { ...x, visible: !next } : x)))
      toast.error('Error al actualizar: ' + e.message)
    }
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await routinesService.deletePersonal(deleteTarget.id)
      toast.success('Rutina eliminada')
      setDeleteTarget(null)
      await loadAll()
    } catch (e: any) {
      toast.error('Error al eliminar: ' + e.message)
    }
  }

  const openShare = async (r: RoutineListItem) => {
    setMenuFor(null)
    setShareFor(r)
    setShareCode('')
    setShareLoading(true)
    try {
      const code = await routinesService.generateShareCode(r.id)
      setShareCode(code)
      setRoutines(prev => prev.map(x => (x.id === r.id ? { ...x, share_code: code } : x)))
    } catch (e: any) {
      toast.error(e.message)
      setShareFor(null)
    } finally {
      setShareLoading(false)
    }
  }

  const regenerate = async () => {
    if (!shareFor) return
    setShareLoading(true)
    try {
      const code = await routinesService.generateShareCode(shareFor.id, true)
      setShareCode(code)
      setRoutines(prev => prev.map(x => (x.id === shareFor.id ? { ...x, share_code: code } : x)))
      toast.success('Código regenerado. El anterior ya no funciona.')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setShareLoading(false)
    }
  }

  const revoke = async () => {
    if (!shareFor) return
    setShareLoading(true)
    try {
      await routinesService.revokeShareCode(shareFor.id)
      setShareCode('')
      setRoutines(prev => prev.map(x => (x.id === shareFor.id ? { ...x, share_code: null } : x)))
      toast.success('Código revocado')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setShareLoading(false)
    }
  }

  const copyCode = async () => {
    if (!shareCode) return
    try {
      await navigator.clipboard.writeText(shareCode)
      toast.success('Código copiado al portapapeles')
    } catch {
      toast.error('No se pudo copiar automáticamente. Cópialo manualmente.')
    }
  }

  const handleImport = async () => {
    const code = importCode.trim()
    if (!code || importing) return
    setImporting(true)
    try {
      await routinesService.importByCode(code)
      toast.success('¡Rutina importada! Ya es una copia tuya y puedes editarla.')
      setImportOpen(false)
      setImportCode('')
      await loadAll()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setImporting(false)
    }
  }

  const startWorkout = async (planId: string, planName: string) => {
    setMenuFor(null)
    const req = ++sessionReq.current
    setSession({ planId, name: planName, exercises: [], loading: true })
    try {
      const exercises = await trainingService.getExercises(planId)
      if (sessionReq.current !== req) return
      setSession({ planId, name: planName, exercises, loading: false })
    } catch (e: any) {
      if (sessionReq.current !== req) return
      toast.error('No se pudieron cargar los ejercicios: ' + e.message)
      setSession(null)
    }
  }

  const closeSession = () => {
    sessionReq.current += 1
    setSession(null)
  }

  const saveSchedule = async (days: number[]) => {
    if (!scheduleFor) return
    setScheduleSaving(true)
    try {
      await trainingService.setSchedule(scheduleFor.id, days)
      setRoutines(prev => prev.map(r => (
        r.id === scheduleFor.id ? { ...r, scheduled_days: days.length > 0 ? days : null } : r
      )))
      toast.success(days.length > 0 ? 'Días actualizados' : 'Rutina sin días programados')
      setScheduleFor(null)
    } catch (e: any) {
      toast.error('No se pudo programar: ' + e.message)
    } finally {
      setScheduleSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="p-4 sm:p-7 flex items-center justify-center min-h-[60vh]">
        <div className="text-sm text-text-3">Inicia sesión para ver tus rutinas</div>
      </div>
    )
  }

  return (
    <>
      <ScreenHeader
        title="Entrenamiento"
        subtitle="Tus rutinas"
        actions={
          <>
            <button
              type="button"
              onClick={() => { setImportCode(''); setImportOpen(true) }}
              aria-label="Importar rutina con código"
              className="w-9 h-9 rounded-full bg-surface2 border border-border text-text-2 flex items-center justify-center cursor-pointer transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
              </svg>
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 h-10 px-2 rounded-lg bg-transparent text-accent text-[14px] font-semibold border-none cursor-pointer active:opacity-70 transition-opacity"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nueva
            </button>
          </>
        }
      />

      <div className="px-4 sm:px-5 py-4 pb-10 flex-1 mx-auto w-full max-w-[560px]">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map(i => <div key={i} className="h-[120px] rounded-2xl skeleton" />)}
          </div>
        ) : loadError ? (
          <div className="bg-surface  rounded-2xl p-8 text-center flex flex-col items-center gap-3">
            <div className="text-sm font-semibold">No se pudieron cargar tus rutinas</div>
            <div className="text-xs text-text-3 max-w-[280px]">{loadError}</div>
            <button
              onClick={() => { setLoading(true); loadAll() }}
              className="mt-1 px-4 py-2 rounded-full bg-accent text-accent-contrast text-[12px] font-bold border-none cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        ) : routines.length === 0 ? (
          <div className="bg-surface  rounded-2xl p-8 text-center flex flex-col items-center gap-3 animate-slide-up">
            <div className="w-14 h-14 rounded-full bg-accent-dim text-accent flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M6.5 6.5l11 11M4 9v6M20 9v6M7 7v10M17 7v10" />
              </svg>
            </div>
            <div className="text-sm font-semibold">Aún no tienes rutinas</div>
            <div className="text-xs text-text-3 max-w-[280px] leading-relaxed">
              Crea tu primera rutina o importa una que alguien haya compartido contigo mediante un código.
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-1 w-full sm:w-auto">
              <button
                onClick={openCreate}
                className="px-4 py-2.5 rounded-full bg-accent text-accent-contrast text-[12px] font-bold border border-accent/25 cursor-pointer"
              >
                Crear mi primera rutina
              </button>
              <button
                onClick={() => { setImportCode(''); setImportOpen(true) }}
                className="px-4 py-2.5 rounded-full bg-surface2 text-text-2 text-[12px] font-semibold border border-border cursor-pointer"
              >
                Importar con código
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {routines.map((r, i) => (
              <article
                key={r.id}
                className={`bg-surface  rounded-2xl p-4 sm:p-5 animate-slide-up ${i < 7 ? `stagger-${i + 1}` : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-[15px] font-bold truncate">{r.name}</h2>
                      {r.share_code && (
                        <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide bg-green-bg text-green-text px-2 py-[2px] rounded-full">
                          Compartida
                        </span>
                      )}
                      {!r.show_in_plan && (
                        <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide bg-surface2 text-text-3 px-2 py-[2px] rounded-full border border-border">
                          Oculta
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-text-3 mt-1 truncate">{summaryOf(r)}</p>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-text-3">
                      <span>{r.exercise_count} ejercicio{r.exercise_count !== 1 ? 's' : ''}</span>
                      <span className="text-border2">·</span>
                      <span>Actualizada {formatDate(r.updated_at)}</span>
                    </div>
                    {r.scheduled_days && r.scheduled_days.length > 0 && (
                      <div className="mt-1 text-[11px] font-semibold text-accent">
                        {formatSchedule(r.scheduled_days)}
                      </div>
                    )}
                  </div>

                  <div className="relative shrink-0">
                    <button
                      type="button"
                      aria-label={`Acciones de ${r.name}`}
                      aria-expanded={menuFor === r.id}
                      onClick={() => setMenuFor(menuFor === r.id ? null : r.id)}
                      className="w-9 h-9 rounded-full bg-surface2 border border-border text-text-2 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" />
                      </svg>
                    </button>

                    {menuFor === r.id && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setMenuFor(null)} />
                        <div className="absolute right-0 top-10 z-30 w-48 bg-surface2 border border-border2 rounded-2xl  overflow-hidden">
                          <MenuItem
                            label="Editar rutina"
                            icon={<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7m-2.5-11.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />}
                            onClick={() => openEdit(r)}
                          />
                          <MenuItem
                            label="Programar días"
                            icon={<><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>}
                            onClick={() => { setMenuFor(null); setScheduleFor(r) }}
                          />
                          <MenuItem
                            label="Compartir por código"
                            icon={<><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></>}
                            onClick={() => openShare(r)}
                          />
                          <MenuItem
                            label={r.show_in_plan ? 'Ocultar de Mi plan' : 'Mostrar en Mi plan'}
                            icon={r.show_in_plan
                              ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>
                              : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                            onClick={() => togglePlanVisibility(r)}
                          />
                          <MenuItem
                            label="Eliminar"
                            danger
                            icon={<><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>}
                            onClick={() => { setMenuFor(null); setDeleteTarget(r) }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => startWorkout(r.id, r.name)}
                  disabled={r.exercise_count === 0}
                  className="mt-4 w-full py-3 rounded-full bg-accent text-accent-contrast text-[13px] font-bold border border-accent/25 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {r.exercise_count === 0 ? 'Agrega ejercicios para entrenar' : 'Empezar rutina'}
                </button>
              </article>
            ))}
          </div>
        )}

        {/* Rutinas asignadas por el entrenador */}
        {!loading && !loadError && assignedPlans.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] uppercase tracking-[0.08em] text-text-3 font-bold whitespace-nowrap">
                Asignadas por tu entrenador
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="flex flex-col gap-3">
              {assignedPlans.map(a => (
                <article key={a.id} className="bg-surface  rounded-2xl p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-[15px] font-bold truncate">{a.name}</h2>
                      <p className="text-[12px] text-text-3 mt-1 truncate">
                        Por {a.creator?.full_name ?? 'tu entrenador'}
                        {a.description ? ` · ${a.description}` : ''}
                      </p>
                      {a.visible === false && (
                        <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-wide bg-surface2 text-text-3 px-2 py-[2px] rounded-full border border-border">
                          Oculta de Mi plan
                        </span>
                      )}
                      {a.scheduled_days && a.scheduled_days.length > 0 && (
                        <div className="mt-1 text-[11px] font-semibold text-accent">
                          {formatSchedule(a.scheduled_days)}
                        </div>
                      )}
                    </div>

                    <div className="relative shrink-0">
                      <button
                        type="button"
                        aria-label={`Acciones de ${a.name}`}
                        aria-expanded={menuFor === a.id}
                        onClick={() => setMenuFor(menuFor === a.id ? null : a.id)}
                        className="w-9 h-9 rounded-full bg-surface2 border border-border text-text-2 flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" />
                        </svg>
                      </button>

                      {menuFor === a.id && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setMenuFor(null)} />
                          <div className="absolute right-0 top-10 z-30 w-48 bg-surface2 border border-border2 rounded-2xl  overflow-hidden">
                            <MenuItem
                              label={a.visible !== false ? 'Ocultar de Mi plan' : 'Mostrar en Mi plan'}
                              icon={a.visible !== false
                                ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>
                                : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                              onClick={() => toggleAssignedVisibility(a)}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => startWorkout(a.id, a.name)}
                    className="mt-4 w-full py-3 rounded-full bg-accent text-accent-contrast text-[13px] font-bold border border-accent/25 cursor-pointer transition-all active:scale-[0.99]"
                  >
                    Empezar rutina
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sesión de entrenamiento (solo UI) */}
      <WorkoutSession
        open={session !== null}
        onClose={closeSession}
        planName={session?.name ?? ''}
        planId={session?.planId ?? null}
        memberId={user.id}
        exercises={session?.exercises ?? []}
        loading={session?.loading}
      />

      {/* Eliminar rutina */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar rutina"
        compact
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-text">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        }
      >
        <p className="text-[13px] leading-relaxed text-text-2">
          ¿Eliminar <strong className="text-text">{deleteTarget?.name}</strong>? Se borrarán también sus ejercicios. Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>Eliminar</Button>
        </div>
      </Modal>

      {/* Modal compartir */}
      <Modal
        open={!!shareFor}
        onClose={() => setShareFor(null)}
        title={`Compartir "${shareFor?.name ?? ''}"`}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        }
      >
        <p className="text-[12px] text-text-3 leading-relaxed -mt-1">
          Comparte este código con otro miembro: al importarlo recibirá una <strong className="text-text-2">copia independiente</strong>. Modificar su copia nunca afectará tu rutina original.
        </p>

        {shareLoading ? (
          <div className="py-6 text-center text-sm text-text-3">Generando código...</div>
        ) : shareCode ? (
          <>
            <div className="flex items-center justify-center gap-2 py-4">
              <div className="font-mono text-3xl sm:text-4xl font-bold tracking-[0.25em] bg-surface2 border border-border2 rounded-2xl px-6 py-4 select-all">
                {shareCode}
              </div>
              <button
                onClick={copyCode}
                title="Copiar código"
                className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer border border-border text-text-3 transition-colors bg-transparent shrink-0"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
            <div className="flex justify-between items-center gap-2">
              <Button variant="ghost" size="sm" disabled={shareLoading} onClick={revoke}>Revocar código</Button>
              <Button variant="primary" size="sm" disabled={shareLoading} onClick={regenerate}>Regenerar</Button>
            </div>
          </>
        ) : (
          <div className="py-4 text-center text-sm text-text-3">
            Esta rutina no tiene un código activo (fue revocada o nunca se generó).
            <div className="mt-3">
              <Button variant="primary" size="sm" disabled={shareLoading} onClick={regenerate}>Generar código</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal importar */}
      <Modal
        open={importOpen}
        onClose={() => !importing && setImportOpen(false)}
        title="Importar rutina con código"
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
          </svg>
        }
      >
        <p className="text-[12px] text-text-3 leading-relaxed -mt-1">
          Ingresa el código que te compartió otro miembro. Recibirás una copia editable en tu lista de rutinas.
        </p>
        <Input
          label="Código *"
          value={importCode}
          onChange={e => setImportCode(e.target.value.toUpperCase())}
          placeholder="ABCD-EFGH"
          maxLength={9}
          className="font-mono tracking-[0.2em] uppercase"
          onKeyDown={e => { if (e.key === 'Enter') handleImport() }}
        />
        <div className="flex justify-end gap-2 mt-1">
          <Button variant="ghost" size="sm" onClick={() => setImportOpen(false)} disabled={importing}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={handleImport} disabled={!importCode.trim() || importing}>
            {importing ? 'Importando…' : 'Importar'}
          </Button>
        </div>
      </Modal>

      {/* Builder crear/editar */}
      <RoutineBuilder
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onSave={() => { loadAll() }}
        editPlan={editData}
        kind="personal"
      />

      {/* Programar días */}
      <ScheduleSheet
        open={scheduleFor !== null}
        onClose={() => setScheduleFor(null)}
        planName={scheduleFor?.name}
        initialDays={scheduleFor?.scheduled_days ?? null}
        saving={scheduleSaving}
        onSave={saveSchedule}
      />
    </>
  )
}

function MenuItem({ label, icon, onClick, danger }: { label: string; icon: ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[12px] font-medium bg-transparent border-none cursor-pointer transition-colors ${
        danger ? 'text-red-text' : 'text-text-2'
      }`}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {icon}
      </svg>
      {label}
    </button>
  )
}
