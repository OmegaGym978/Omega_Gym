import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'
import { exercisesService, type Exercise } from '@/services/exercises.service'
import { exerciseStatsService, type ExerciseStats } from '@/services/exerciseStats.service'
import { routinesService, type RoutineListItem } from '@/services/routines.service'
import { trainingService } from '@/services/training.service'
import { muscleLabel } from '@/lib/exercise-labels'
import { splitInstructions } from '@/lib/instructions'
import { ScreenHeader } from '@/components/ui/layout/ScreenHeader'
import { BottomSheet } from '@/components/ui/molecules/BottomSheet'
import { ListGroup } from '@/components/ui/molecules/ListGroup'
import { ListTile } from '@/components/ui/molecules/ListTile'
import { ConfirmSheet } from '@/components/ui/molecules/ConfirmSheet'
import { ActivityChart } from '@/components/profile/ActivityChart'

type Tab = 'resumen' | 'historial' | 'indicaciones'
type Metric = 'weight' | 'oneRm' | 'volume'

const TABS: { key: Tab; label: string }[] = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'historial', label: 'Historial' },
  { key: 'indicaciones', label: 'Indicaciones' },
]

const METRICS: { key: Metric; label: string }[] = [
  { key: 'weight', label: 'Mayor Peso' },
  { key: 'oneRm', label: '1RM' },
  { key: 'volume', label: 'Mejor Volumen' },
]

const EMPTY_STATS: ExerciseStats = { points: [], history: [], prMaxWeight: null, prOneRm: null, totalSets: 0 }

function fmtKg(value: number | null): string {
  if (value == null || value <= 0) return '—'
  return `${Math.round(value).toLocaleString('es-MX')} kg`
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

function metricValue(point: ExerciseStats['points'][number], metric: Metric): number {
  if (metric === 'weight') return point.maxWeight
  if (metric === 'oneRm') return point.oneRm
  return point.volume
}

export default function ExerciseDetailPage() {
  const { exerciseId } = useParams<{ exerciseId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)

  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [stats, setStats] = useState<ExerciseStats>(EMPTY_STATS)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('resumen')
  const [metric, setMetric] = useState<Metric>('weight')

  const [menuOpen, setMenuOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [routines, setRoutines] = useState<RoutineListItem[]>([])
  const [routinesLoading, setRoutinesLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) return
      setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  useEffect(() => {
    if (!exerciseId || !user) return
    let ignore = false

    ;(async () => {
      setLoading(true)
      setStatsLoading(true)

      const [exerciseResult, statsResult] = await Promise.allSettled([
        exercisesService.getById(exerciseId),
        exerciseStatsService.getForExercise(user.id, exerciseId),
      ])

      if (ignore) return

      setExercise(exerciseResult.status === 'fulfilled' ? exerciseResult.value : null)
      setStats(statsResult.status === 'fulfilled' ? statsResult.value : EMPTY_STATS)
      setLoading(false)
      setStatsLoading(false)
    })()

    return () => { ignore = true }
  }, [exerciseId, user])

  const chartData = useMemo(
    () => stats.points.slice(-8).map(point => ({
      label: shortDate(point.date),
      value: Math.round(metricValue(point, metric)),
    })),
    [stats.points, metric],
  )

  const steps = useMemo(
    () => splitInstructions(exercise?.instructions_es),
    [exercise?.instructions_es],
  )

  const isCustom = !!exercise?.created_by && exercise.created_by === user?.id

  async function share() {
    if (!exercise) return
    const url = `${window.location.origin}/my-profile/exercises/${exercise.id}`
    const data = {
      title: exercise.name_es || exercise.name,
      text: `${exercise.name_es || exercise.name} · ${muscleLabel(exercise.muscle_group)}`,
      url,
    }
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> }
    if (typeof nav.share === 'function') {
      try { await nav.share(data) } catch { /* cancelado */ }
      return
    }
    try {
      await (navigator as Navigator).clipboard.writeText(url)
      toast.success('Enlace copiado al portapapeles')
    } catch {
      toast.error('No se pudo compartir el ejercicio')
    }
  }

  async function openAddToRoutine() {
    setMenuOpen(false)
    if (!user) return
    setAddOpen(true)
    setRoutinesLoading(true)
    try {
      setRoutines(await routinesService.getMine(user.id))
    } catch (e: any) {
      toast.error('No se pudieron cargar tus rutinas: ' + e.message)
      setRoutines([])
    } finally {
      setRoutinesLoading(false)
    }
  }

  async function addToRoutine(planId: string) {
    if (!exercise) return
    try {
      const { exercises } = await routinesService.getDetail(planId)
      const payload = exercises.map((e, index) => ({
        exercise_id: e.exercise_id,
        exercise_name: e.exercise_name,
        muscle: e.muscle,
        sets: e.sets,
        reps: e.reps,
        rest_seconds: e.rest_seconds,
        notes: e.notes,
        reference_link: e.reference_link,
        day: null,
        set_details: e.set_details ?? null,
        order_index: index,
      }))

      payload.push({
        exercise_id: exercise.id,
        exercise_name: exercise.name_es || exercise.name,
        muscle: exercise.muscle_group,
        sets: 1,
        reps: 12,
        rest_seconds: null,
        notes: null,
        reference_link: exercise.gif_url ?? null,
        day: null,
        set_details: [{ weight: null, reps: 12 }],
        order_index: payload.length,
      })

      await trainingService.upsertExercises(planId, payload)
      toast.success('Ejercicio agregado a la rutina')
      setAddOpen(false)
    } catch (e: any) {
      toast.error('No se pudo agregar: ' + e.message)
    }
  }

  async function removeExercise() {
    if (!exercise) return
    try {
      await exercisesService.deleteCustom(exercise.id)
      toast.success('Ejercicio eliminado')
      navigate('/my-profile/exercises', { replace: true })
    } catch (e: any) {
      toast.error('No se pudo eliminar: ' + e.message)
    }
  }

  if (!user) {
    return <div className="p-4 text-sm text-text-3">Inicia sesión para ver este ejercicio.</div>
  }

  if (!loading && !exercise) {
    return (
      <>
        <ScreenHeader title="Ejercicio" back="/my-profile/exercises" centerTitle />
        <div className="p-8 text-center text-sm text-text-3">No se encontró el ejercicio.</div>
      </>
    )
  }

  const image = exercise?.gif_url || exercise?.image_url || null

  return (
    <>
      <ScreenHeader
        title={exercise?.name_es || exercise?.name || 'Ejercicio'}
        back="/my-profile/exercises"
        centerTitle
        actions={
          <>
            <button
              type="button"
              onClick={share}
              aria-label="Compartir ejercicio"
              className="w-9 h-9 rounded-full bg-surface2 text-text-2 flex items-center justify-center border-none cursor-pointer active:opacity-70 transition-opacity"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(v => !v)}
                aria-label="Opciones del ejercicio"
                aria-expanded={menuOpen}
                className="w-9 h-9 rounded-full bg-surface2 text-text-2 flex items-center justify-center border-none cursor-pointer active:opacity-70 transition-opacity"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-10 z-30 w-52 bg-surface2 rounded-2xl overflow-hidden shadow-lg">
                  <MenuItem label="Agregar a una rutina" onClick={openAddToRoutine} />
                  <MenuItem label="Ver historial" onClick={() => { setTab('historial'); setMenuOpen(false) }} />
                  {isCustom && (
                    <MenuItem
                      label="Eliminar ejercicio"
                      danger
                      onClick={() => { setMenuOpen(false); setConfirmDelete(true) }}
                    />
                  )}
                </div>
              )}
            </div>
          </>
        }
      />

      <div className="px-4 sm:px-5 py-4 flex-1 mx-auto w-full max-w-[560px]">
        {/* Área superior común a las pestañas */}
        {!loading && exercise && (
          <div className="mb-4">
            {image ? (
              <div className="bg-white rounded-3xl overflow-hidden">
                <img
                  src={image}
                  alt={exercise.name_es || exercise.name}
                  className="w-full max-h-[320px] object-contain mx-auto"
                />
              </div>
            ) : (
              <div className="bg-surface rounded-3xl h-40 flex items-center justify-center text-text-3">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6.5 6.5l11 11M4 9v6M20 9v6M7 7v10M17 7v10" />
                </svg>
              </div>
            )}

            <div className="mt-3">
              <h2 className="text-[24px] font-bold leading-tight">{exercise.name_es || exercise.name}</h2>
              <div className="text-[13px] text-text-3 mt-1">
                Primario: {muscleLabel(exercise.muscle_group)}
                {exercise.equipment ? ` · ${exercise.equipment}` : ''}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border overflow-x-auto">
          {TABS.map(item => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`tab-underline relative shrink-0 px-4 py-3 text-[13px] font-semibold border-none bg-transparent cursor-pointer transition-colors ${
                tab === item.key ? 'active text-accent' : 'text-text-3'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-4 flex flex-col gap-3">
            <div className="h-48 rounded-3xl skeleton" />
            <div className="h-24 rounded-2xl skeleton" />
          </div>
        ) : tab === 'resumen' ? (
          <div className="mt-4 flex flex-col gap-4">
            {/* Progreso */}
            <section className="bg-surface rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[13px] font-semibold">Progreso</div>
                <div className="text-[10px] uppercase tracking-[0.08em] text-text-3 font-bold">
                  {stats.points.length} sesi{stats.points.length === 1 ? 'ón' : 'ones'}
                </div>
              </div>

              {statsLoading ? (
                <div className="h-[132px] rounded-2xl skeleton" />
              ) : stats.points.length === 0 ? (
                <div className="h-[132px] flex flex-col items-center justify-center gap-2">
                  <div className="w-11 h-11 rounded-full bg-surface2 text-text-3 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <line x1="6" y1="20" x2="6" y2="13" /><line x1="12" y1="20" x2="12" y2="6" /><line x1="18" y1="20" x2="18" y2="10" />
                    </svg>
                  </div>
                  <div className="text-[12px] text-text-3">Aún no hay datos</div>
                </div>
              ) : (
                <ActivityChart data={chartData} />
              )}
            </section>

            {/* Métricas */}
            <div className="flex gap-2 overflow-x-auto">
              {METRICS.map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setMetric(item.key)}
                  className={`shrink-0 px-3.5 py-2 rounded-full text-[12px] font-semibold border-none cursor-pointer active:opacity-70 transition-colors ${
                    metric === item.key ? 'bg-accent text-accent-contrast' : 'bg-surface2 text-text-2'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Récords */}
            <section className="bg-surface rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-divider">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="text-amber-text">
                  <path d="M6 3h12v4a6 6 0 0 1-12 0z" /><path d="M6 5H3v2a4 4 0 0 0 4 4" /><path d="M18 5h3v2a4 4 0 0 1-4 4" /><line x1="12" y1="13" x2="12" y2="19" /><line x1="8" y1="21" x2="16" y2="21" />
                </svg>
                <span className="text-[13px] font-semibold">Récords Personales</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-b border-divider">
                <span className="text-[13px] text-text-2">Mayor Peso</span>
                <span className="text-[13px] font-semibold">{fmtKg(stats.prMaxWeight)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 last:border-b-0">
                <span className="text-[13px] text-text-2">Mejor 1RM</span>
                <span className="text-[13px] font-semibold">{fmtKg(stats.prOneRm)}</span>
              </div>
            </section>
          </div>
        ) : tab === 'historial' ? (
          <div className="mt-4">
            {statsLoading ? (
              <div className="flex flex-col gap-2">
                {[0, 1, 2].map(i => <div key={i} className="h-16 rounded-2xl skeleton" />)}
              </div>
            ) : stats.history.length === 0 ? (
              <div className="bg-surface rounded-2xl p-10 text-center flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-surface2 text-text-3 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
                  </svg>
                </div>
                <div className="text-sm font-semibold">Aún no hay historial</div>
                <div className="text-[12px] text-text-3">Registra una sesión para ver tu progreso aquí.</div>
              </div>
            ) : (
              <ListGroup>
                {stats.history.map(item => (
                  <ListTile
                    key={item.sessionId}
                    title={new Date(item.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                    subtitle={`${item.sets} serie${item.sets !== 1 ? 's' : ''} · ${fmtKg(item.volume)} de volumen`}
                    trailing={<span className="text-[12px] font-semibold text-text-2">{fmtKg(item.maxWeight)}</span>}
                  />
                ))}
              </ListGroup>
            )}
          </div>
        ) : (
          <div className="mt-4">
            {steps.length === 0 ? (
              <div className="bg-surface rounded-2xl p-10 text-center text-[13px] text-text-3">
                Este ejercicio no tiene indicaciones en el catálogo.
              </div>
            ) : (
              <ol className="space-y-5">
                {steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-6 shrink-0 text-[15px] font-bold text-accent leading-relaxed">
                      {index + 1}
                    </span>
                    <p className="text-[15px] text-text leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>

      {/* Agregar a rutina */}
      <BottomSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Agregar a una rutina"
        subtitle={exercise?.name_es || exercise?.name}
      >
        {routinesLoading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map(i => <div key={i} className="h-16 rounded-2xl skeleton" />)}
          </div>
        ) : routines.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-sm font-semibold">No tienes rutinas propias</div>
            <div className="text-[12px] text-text-3 mt-1">Crea una rutina para agregar este ejercicio.</div>
            <button
              type="button"
              onClick={() => { setAddOpen(false); navigate('/my-routines') }}
              className="mt-4 h-11 px-5 rounded-full bg-accent text-accent-contrast text-[13px] font-bold border-none cursor-pointer active:opacity-70"
            >
              Ir a Entrenamiento
            </button>
          </div>
        ) : (
          <ListGroup>
            {routines.map(r => (
              <ListTile
                key={r.id}
                title={r.name}
                subtitle={`${r.exercise_count} ejercicio${r.exercise_count !== 1 ? 's' : ''}`}
                chevron
                onClick={() => addToRoutine(r.id)}
              />
            ))}
          </ListGroup>
        )}
      </BottomSheet>

      <ConfirmSheet
        open={confirmDelete}
        title="Eliminar ejercicio"
        description={`¿Eliminar "${exercise?.name_es || exercise?.name}"? Se quitará de tus rutinas y el historial conservará el nombre.`}
        confirmLabel="Eliminar"
        danger
        onClose={() => setConfirmDelete(false)}
        onConfirm={removeExercise}
      />

    </>
  )
}

function MenuItem({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 text-left text-[13px] font-medium bg-transparent border-none border-b border-divider last:border-b-0 cursor-pointer active:opacity-70 transition-opacity ${
        danger ? 'text-red-text' : 'text-text-2'
      }`}
    >
      {label}
    </button>
  )
}
