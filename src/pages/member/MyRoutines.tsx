import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'
import { routinesService, type RoutineListItem } from '@/services/routines.service'
import { trainingService, type TrainingPlan, type PlanExercise } from '@/services/training.service'
import { Button } from '@/components/ui/atoms/Button'
import { Input } from '@/components/ui/atoms/Input'
import { Modal } from '@/components/ui/molecules/Modal'
import { RoutineBuilder, type EditPlanData } from '@/components/routine-builder/RoutineBuilder'

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

export default function MyRoutinesPage() {
  const user = useAuthStore(s => s.user)

  const [loading, setLoading] = useState(true)
  const [routines, setRoutines] = useState<RoutineListItem[]>([])
  const [assignedPlans, setAssignedPlans] = useState<(TrainingPlan & { creator: { id: string; full_name: string } | null; visible?: boolean })[]>([])
  const [searchParams, setSearchParams] = useSearchParams()

  // Builder (crear/editar)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editData, setEditData] = useState<EditPlanData | null>(null)

  // Detalle expandido
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detailExercises, setDetailExercises] = useState<PlanExercise[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailDay, setDetailDay] = useState(0)

  // Compartir
  const [shareFor, setShareFor] = useState<RoutineListItem | null>(null)
  const [shareCode, setShareCode] = useState<string>('')
  const [shareLoading, setShareLoading] = useState(false)

  // Importar
  const [importOpen, setImportOpen] = useState(false)
  const [importCode, setImportCode] = useState('')
  const [importing, setImporting] = useState(false)

  // Eliminar en dos pasos
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const loadRoutines = useCallback(async () => {
    if (!user) return
    const data = await routinesService.getMine(user.id)
    setRoutines(data)
    if (detailId && !data.some(r => r.id === detailId)) {
      setDetailId(null)
      setDetailExercises([])
    }
  }, [user, detailId])

  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const [mine, assigned] = await Promise.all([
          routinesService.getMine(user.id),
          trainingService.getByMemberAll(user.id),
        ])
        setRoutines(mine)
        setAssignedPlans(assigned)
      } catch (e: any) {
        toast.error('Error al cargar rutinas: ' + e.message)
      }
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

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

  const openCreate = () => {
    setEditData(null)
    setBuilderOpen(true)
  }

  const openEdit = async (r: RoutineListItem) => {
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
          day: ex.day,
          order_index: ex.order_index,
        })),
      })
      setBuilderOpen(true)
    } catch (e: any) {
      toast.error('Error al cargar la rutina: ' + e.message)
    }
  }

  const closeDetail = useCallback(() => {
    setDetailId(null)
    setDetailExercises([])
  }, [])

  const loadDetail = useCallback(async (planId: string) => {
    setDetailId(planId)
    setDetailExercises([])
    setDetailDay(0)
    setDetailLoading(true)
    try {
      const { exercises } = await routinesService.getDetail(planId)
      setDetailExercises(exercises)
    } catch (e: any) {
      toast.error('Error al cargar ejercicios: ' + e.message)
      setDetailId(null)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const toggleDetail = useCallback((r: RoutineListItem) => {
    if (detailId === r.id) closeDetail()
    else loadDetail(r.id)
  }, [detailId, closeDetail, loadDetail])

  const toggleAssignedDetail = useCallback((planId: string) => {
    if (detailId === planId) closeDetail()
    else loadDetail(planId)
  }, [detailId, closeDetail, loadDetail])

  // Toggle optimista de visibilidad en Mi plan
  const togglePlanVisibility = useCallback(async (r: RoutineListItem) => {
    const next = !r.show_in_plan
    setRoutines(prev => prev.map(x => x.id === r.id ? { ...x, show_in_plan: next } : x))
    try {
      await routinesService.setPlanVisibility(r.id, next)
      toast.success(next ? 'Rutina visible en Mi plan' : 'Rutina oculta de Mi plan')
    } catch (e: any) {
      setRoutines(prev => prev.map(x => x.id === r.id ? { ...x, show_in_plan: !next } : x))
      toast.error('Error al actualizar: ' + e.message)
    }
  }, [])

  // Toggle optimista para planes asignados (RPC por miembro; no afecta a otros miembros)
  const toggleAssignedVisibility = useCallback(async (a: TrainingPlan & { visible?: boolean }) => {
    const next = !(a.visible !== false)
    setAssignedPlans(prev => prev.map(x => x.id === a.id ? { ...x, visible: next } : x))
    try {
      await trainingService.setAssignedVisibility(a.id, next)
      toast.success(next ? 'Rutina visible en Mi plan' : 'Rutina oculta de Mi plan')
    } catch (e: any) {
      setAssignedPlans(prev => prev.map(x => x.id === a.id ? { ...x, visible: !next } : x))
      toast.error('Error al actualizar: ' + e.message)
    }
  }, [])

  const handleDelete = async (r: RoutineListItem) => {
    try {
      await routinesService.deletePersonal(r.id)
      toast.success('Rutina eliminada')
      setConfirmDeleteId(null)
      await loadRoutines()
    } catch (e: any) {
      toast.error('Error al eliminar: ' + e.message)
    }
  }

  const openShare = async (r: RoutineListItem) => {
    setShareFor(r)
    setShareCode('')
    setShareLoading(true)
    try {
      const code = await routinesService.generateShareCode(r.id)
      setShareCode(code)
      setRoutines(prev => prev.map(x => x.id === r.id ? { ...x, share_code: code } : x))
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
      setRoutines(prev => prev.map(x => x.id === shareFor.id ? { ...x, share_code: code } : x))
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
      setRoutines(prev => prev.map(x => x.id === shareFor.id ? { ...x, share_code: null } : x))
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
      await loadRoutines()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setImporting(false)
    }
  }

  const onBuilderSave = async () => {
    await loadRoutines()
  }

  if (!user) {
    return (
      <div className="p-4 sm:p-7 flex items-center justify-center min-h-[60vh]">
        <div className="text-sm text-text-3">Inicia sesión para ver tus rutinas</div>
      </div>
    )
  }

  const exsByDay: Record<number, PlanExercise[]> = {}
  detailExercises.forEach(e => {
    const d = e.day ?? 0
    if (!exsByDay[d]) exsByDay[d] = []
    exsByDay[d].push(e)
  })
  const detailDays = Object.keys(exsByDay).map(Number).sort((a, b) => a - b)

  // Panel de detalle compartido entre rutinas propias y asignadas
  const renderDetail = (embedded: boolean) => (
    <div className={embedded ? '' : 'mt-4 pt-4 border-t border-border'}>
      {detailLoading ? (
        <div className="text-xs text-text-3 py-4 text-center">Cargando ejercicios...</div>
      ) : detailExercises.length === 0 ? (
        <div className="text-xs text-text-3 py-4 text-center">Esta rutina no tiene ejercicios todavía.</div>
      ) : (
        <>
          <div className="flex gap-1.5 mb-3 overflow-x-auto">
            {detailDays.map(d => (
              <button key={d} onClick={() => setDetailDay(d)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all duration-150 border ${
                  d === detailDay ? 'bg-accent text-black border-accent' : 'bg-transparent text-text-2 border-border'
                }`}>
                {DAY_NAMES[d]}
                <span className={`inline-block ml-1.5 rounded-full px-[5px] py-[1px] text-[10px] ${
                  d === detailDay ? 'bg-black/20 text-black/80' : 'bg-surface2 text-text-3'
                }`}>{exsByDay[d].length}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            {(exsByDay[detailDay] || []).map((e, idx) => (
              <div key={e.id} className="flex items-center gap-3 px-3 py-2.5 bg-surface2 border border-border rounded-lg">
                <div className="w-6 h-6 rounded-full bg-surface3 border border-border flex items-center justify-center text-[10px] font-semibold text-text-3 shrink-0">{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{e.exercise_name}</div>
                  {e.muscle && <span className="text-[10px] bg-surface3 text-text-3 px-1.5 py-[1px] rounded-full">{e.muscle}</span>}
                </div>
                <div className="shrink-0 text-xs text-text-3 font-mono">{e.sets ?? '—'} × {e.reps ?? '—'}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )

  return (<>
    <header className="px-4 sm:px-7 h-14 flex items-center justify-between border-b border-border bg-surface2 sticky top-0 z-40">
      <div className="flex items-center gap-2 text-xs sm:text-[13px] text-text-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 17H5a2 2 0 0 0-2 2 2 2 0 0 0 2 2h14a2 2 0 0 0 2-2 2 2 0 0 0-2-2h-4"/><rect x="7" y="3" width="10" height="14" rx="1"/></svg>
        <span className="text-text-4 mx-0.5">/</span>
        <span className="font-medium text-text-1">Mis rutinas</span>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button title="Importar código" aria-label="Importar código"
          onClick={() => { setImportCode(''); setImportOpen(true) }}
          className="sm:hidden w-8 h-8 rounded-md flex items-center justify-center cursor-pointer border border-border text-text-3 hover:bg-surface2 hover:text-text transition-colors bg-transparent shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
        </button>
        <span className="hidden sm:block">
          <Button variant="ghost" size="sm" onClick={() => { setImportCode(''); setImportOpen(true) }}>
            Importar código
          </Button>
        </span>
        <Button variant="primary" size="sm" onClick={openCreate}>+ Nueva rutina</Button>
      </div>
    </header>

    <div className="p-4 sm:p-7 flex-1 max-w-screen-xl mx-auto w-full">
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-sm text-text-3">Cargando...</div>
        </div>
      ) : routines.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center flex flex-col items-center gap-3 animate-slide-up">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7"><path d="M9 17H5a2 2 0 0 0-2 2 2 2 0 0 0 2 2h14a2 2 0 0 0 2-2 2 2 0 0 0-2-2h-4"/><rect x="7" y="3" width="10" height="14" rx="1"/></svg>
          </div>
          <div className="text-sm font-semibold">Aún no tienes rutinas propias</div>
          <div className="text-sm text-text-3 max-w-sm">Crea tu primera rutina o importa una que un compañero haya compartido contigo mediante un código.</div>
          <div className="flex gap-2 mt-1">
            <Button variant="primary" size="sm" onClick={openCreate}>Crear mi primera rutina</Button>
            <Button variant="ghost" size="sm" onClick={() => setImportOpen(true)}>Importar con código</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {routines.map((r, i) => {
            const isDetailOpen = detailId === r.id
            return (
              <div key={r.id}
                className={`bg-surface border border-border rounded-xl overflow-hidden transition-all duration-200 hover:border-accent/20 animate-slide-up ${i > 6 ? '' : `stagger-${Math.min(i + 1, 7)}`}`}>
                {/* Card header */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => toggleDetail(r)}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[15px] font-bold truncate">{r.name}</span>
                        {r.share_code && (
                          <span className="text-[10px] font-bold uppercase tracking-wide bg-green-bg text-green-text px-2 py-[2px] rounded-full">Compartida</span>
                        )}
                      </div>
                      {r.description && (
                        <div className="text-xs text-text-3 mt-1 line-clamp-2">{r.description}</div>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-text-3">
                        <span className="inline-flex items-center gap-1">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M9 17H5a2 2 0 0 0-2 2 2 2 0 0 0 2 2h14a2 2 0 0 0 2-2 2 2 0 0 0-2-2h-4"/><rect x="7" y="3" width="10" height="14" rx="1"/></svg>
                          {r.exercise_count} ejercicio{r.exercise_count !== 1 ? 's' : ''}
                        </span>
                        <span>·</span>
                        <span>Actualizada {formatDate(r.updated_at)}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePlanVisibility(r) }}
                          title={r.show_in_plan ? 'Visible en Mi plan — clic para ocultar' : 'Oculta de Mi plan — clic para mostrar'}
                          className="ml-auto inline-flex items-center gap-1.5 cursor-pointer bg-transparent border-none p-0 text-text-3 hover:text-text-2 transition-colors">
                          <span
                            className={`relative inline-block w-[28px] h-[15px] rounded-full transition-colors duration-200 ${r.show_in_plan ? '' : 'bg-surface3 border border-border'}`}
                            style={r.show_in_plan ? { background: 'var(--accent)', border: '1px solid var(--accent)' } : undefined}>
                            <span
                              className={`absolute top-[1.5px] w-[10.5px] h-[10.5px] rounded-full transition-all duration-200 ${r.show_in_plan ? 'left-[14.5px]' : 'left-[2.5px]'}`}
                              style={{ background: r.show_in_plan ? '#fff' : 'var(--text-3)' }} />
                          </span>
                          <span className={`text-[11px] font-semibold ${r.show_in_plan ? 'text-accent' : ''}`}>En Mi plan</span>
                        </button>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {confirmDeleteId === r.id ? (
                        <>
                          <button onClick={() => handleDelete(r)}
                            className="px-2.5 py-1.5 rounded-md text-[11px] font-bold cursor-pointer border-none transition-colors"
                            style={{ background: 'var(--red-bg)', color: 'var(--red-text)' }}>
                            Sí, eliminar
                          </button>
                          <button onClick={() => setConfirmDeleteId(null)}
                            className="px-2.5 py-1.5 rounded-md text-[11px] font-medium cursor-pointer bg-surface2 border border-border text-text-2 hover:text-text transition-colors">
                            No
                          </button>
                        </>
                      ) : (
                        <>
                          <button title="Ver detalle" onClick={() => toggleDetail(r)}
                            className={`w-8 h-8 rounded-md flex items-center justify-center cursor-pointer border transition-colors ${isDetailOpen ? 'bg-accent-dim border-accent/30 text-accent' : 'bg-transparent border-border text-text-3 hover:bg-surface2 hover:text-text'}`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 transition-transform duration-200" style={{ transform: isDetailOpen ? 'rotate(180deg)' : '' }}><polyline points="6 9 12 15 18 9"/></svg>
                          </button>
                          <button title="Editar" onClick={() => openEdit(r)}
                            className="w-8 h-8 rounded-md flex items-center justify-center cursor-pointer border border-border text-text-3 hover:bg-surface2 hover:text-text transition-colors bg-transparent">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button title="Compartir por código" onClick={() => openShare(r)}
                            className="w-8 h-8 rounded-md flex items-center justify-center cursor-pointer border border-border text-text-3 hover:bg-surface2 hover:text-text transition-colors bg-transparent">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                          </button>
                          <button title="Eliminar" onClick={() => setConfirmDeleteId(r.id)}
                            className="w-8 h-8 rounded-md flex items-center justify-center cursor-pointer border border-border text-text-3 hover:bg-red-bg hover:border-red/30 transition-colors bg-transparent"
                            style={{ color: undefined }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 hover:text-red-text"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Detalle */}
                  {isDetailOpen && renderDetail(false)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Rutinas asignadas por el entrenador (solo lectura) */}
      {!loading && assignedPlans.length > 0 && (
        <>
          <div className="flex items-center gap-2 mt-8 mb-3">
            <div className="h-[1px] flex-1 bg-border" />
            <span className="text-[10px] uppercase tracking-[0.08em] text-text-3 font-bold whitespace-nowrap">Asignadas por tu entrenador</span>
            <div className="h-[1px] flex-1 bg-border" />
          </div>
          <div className="flex flex-col gap-2">
            {assignedPlans.map((a) => {
              const isOpen = detailId === a.id
              return (
                <div key={a.id} className="bg-surface border border-border rounded-xl overflow-hidden transition-all duration-200 hover:border-accent/20">
                  <div className="p-4 cursor-pointer select-none" onClick={() => toggleAssignedDetail(a.id)}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-bold truncate">{a.name}</div>
                        <div className="text-[11px] text-text-3 mt-0.5 truncate">Por {a.creator?.full_name ?? 'tu entrenador'}</div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleAssignedVisibility(a) }}
                        title={a.visible !== false ? 'Visible en Mi plan — clic para ocultar' : 'Oculta de Mi plan — clic para mostrar'}
                        className="inline-flex items-center gap-1.5 shrink-0 cursor-pointer bg-transparent border-none p-0 text-text-3 hover:text-text-2 transition-colors"
                        style={{ marginRight: 2 }}>
                        <span
                          className={`relative inline-block w-[28px] h-[15px] rounded-full transition-colors duration-200 ${a.visible !== false ? '' : 'bg-surface3 border border-border'}`}
                          style={a.visible !== false ? { background: 'var(--accent)', border: '1px solid var(--accent)' } : undefined}>
                          <span
                            className={`absolute top-[1.5px] w-[10.5px] h-[10.5px] rounded-full transition-all duration-200 ${a.visible !== false ? 'left-[14.5px]' : 'left-[2.5px]'}`}
                            style={{ background: a.visible !== false ? '#fff' : 'var(--text-3)' }} />
                        </span>
                        <span className={`text-[11px] font-semibold ${a.visible !== false ? 'text-accent' : ''}`}>En Mi plan</span>
                      </button>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        style={{ color: isOpen ? 'var(--accent)' : undefined }}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>
                  {isOpen && <div className="px-4 pb-4">{renderDetail(true)}</div>}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>

    {/* Modal compartir */}
    <Modal open={!!shareFor} onClose={() => setShareFor(null)} title={`Compartir "${shareFor?.name ?? ''}"`} icon={
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
    }>
      <p className="text-[12px] text-text-3 leading-relaxed -mt-1">
        Comparte este código con otro miembro: al importarlo recibirá una <strong className="text-text-2">copia independiente</strong>. Modificar su copia nunca afectará tu rutina original.
      </p>

      {shareLoading ? (
        <div className="py-6 text-center text-sm text-text-3">Generando código...</div>
      ) : shareCode ? (
        <>
          <div className="flex items-center justify-center gap-2 py-4">
            <div className="font-mono text-3xl sm:text-4xl font-bold tracking-[0.25em] bg-surface2 border border-border2 rounded-lg px-6 py-4 select-all"
              style={{ letterSpacing: '0.22em' }}>
              {shareCode}
            </div>
            <button onClick={copyCode} title="Copiar código"
              className="w-10 h-10 rounded-md flex items-center justify-center cursor-pointer border border-border text-text-3 hover:text-accent hover:border-accent/40 transition-colors bg-transparent shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
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
    <Modal open={importOpen} onClose={() => !importing && setImportOpen(false)} title="Importar rutina con código" icon={
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
    }>
      <p className="text-[12px] text-text-3 leading-relaxed -mt-1">
        Ingresa el código que te compartió otro miembro. Recibirás una copia editable en tu lista de rutinas.
      </p>
      <Input
        label="Código *"
        value={importCode}
        onChange={(e) => setImportCode(e.target.value.toUpperCase())}
        placeholder="ABCD-EFGH"
        maxLength={9}
        className="font-mono tracking-[0.2em] uppercase"
        onKeyDown={(e) => { if (e.key === 'Enter') handleImport() }}
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
      onSave={onBuilderSave}
      editPlan={editData}
      kind="personal"
    />
  </>);
}
