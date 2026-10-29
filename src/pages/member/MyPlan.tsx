import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { trainingService, type TrainingPlan, type PlanExercise } from '@/services/training.service'
import { routinesService } from '@/services/routines.service'
import { sessionsService, type WeeklyStats } from '@/services/sessions.service'
import { ScreenHeader } from '@/components/ui/layout/ScreenHeader'
import { BottomSheet } from '@/components/ui/molecules/BottomSheet'
import { WorkoutSession } from '@/components/workout/WorkoutSession'
import { todayLabel, weekdayIndex } from '@/lib/dates'

type MemberPlan = TrainingPlan & {
  creator: { id: string; full_name: string } | null
  origin: 'assigned' | 'personal'
  visible?: boolean
}

type SessionState = {
  planId: string
  name: string
  exercises: PlanExercise[]
}

function plannedVolume(exercises: PlanExercise[]): number {
  return exercises.reduce((acc, ex) => {
    const sets = ex.set_details && ex.set_details.length > 0
      ? ex.set_details
      : [{ weight: null, reps: ex.reps }]
    return acc + sets.reduce((sum, s) => sum + (s.weight && s.reps ? s.weight * s.reps : 0), 0)
  }, 0)
}

function fmtVolume(value: number): string {
  if (!value) return '—'
  return `${Math.round(value).toLocaleString('es-MX')} kg`
}

export default function MyPlanPage() {
  const user = useAuthStore(s => s.user)

  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<MemberPlan[]>([])
  const [todayPlans, setTodayPlans] = useState<MemberPlan[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [exercises, setExercises] = useState<PlanExercise[]>([])
  const [exercisesLoading, setExercisesLoading] = useState(false)
  const [stats, setStats] = useState<WeeklyStats>({ sessions: 0, visits: 0, volume: 0, streak: 0 })
  const [session, setSession] = useState<SessionState | null>(null)
  const [viewOpen, setViewOpen] = useState(false)

  const loadStats = useCallback(async (memberId: string) => {
    try {
      const data = await sessionsService.getWeeklyStats(memberId)
      setStats(data)
    } catch {
      setStats({ sessions: 0, visits: 0, volume: 0, streak: 0 })
    }
  }, [])

  const loadExercises = useCallback(async (planId: string) => {
    setExercisesLoading(true)
    try {
      const data = await trainingService.getExercises(planId)
      setExercises(data)
    } catch {
      setExercises([])
    } finally {
      setExercisesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    let ignore = false
    ;(async () => {
      try {
        const [assigned, mine] = await Promise.all([
          trainingService.getByMemberAll(user.id),
          routinesService.getMine(user.id),
        ])
        if (ignore) return

        const merged: MemberPlan[] = [
          ...assigned
            .filter(p => p.visible !== false)
            .map((p): MemberPlan => ({ ...p, origin: 'assigned', scheduled_days: p.scheduled_days ?? null })),
          ...mine
            .filter(r => r.show_in_plan !== false)
            .map((r): MemberPlan => ({
              id: r.id,
              name: r.name,
              description: r.description,
              assigned_to: null,
              created_by: user.id,
              created_at: r.created_at,
              updated_at: r.updated_at,
              scheduled_days: r.scheduled_days ?? null,
              creator: null,
              origin: 'personal',
            })),
        ]

        const day = weekdayIndex()
        const todays = merged.filter(p => p.scheduled_days?.includes(day))

        setPlans(merged)
        setTodayPlans(todays)
        setActiveIdx(0)

        if (todays[0]) await loadExercises(todays[0].id)
        else setExercises([])
      } catch {
        setPlans([])
        setTodayPlans([])
      }

      await loadStats(user.id)
      if (!ignore) setLoading(false)
    })()
    return () => { ignore = true }
  }, [user, loadExercises, loadStats])

  const todayPlan = todayPlans[activeIdx] ?? null
  const hasPlans = plans.length > 0
  const canTrain = !!todayPlan && exercises.length > 0 && !exercisesLoading

  function selectTodayPlan(idx: number) {
    setActiveIdx(idx)
    const target = todayPlans[idx]
    if (target) loadExercises(target.id)
  }

  function startWorkout() {
    if (!todayPlan || exercises.length === 0) return
    setSession({ planId: todayPlan.id, name: todayPlan.name, exercises })
  }

  if (!user) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <div className="text-sm text-text-3">Inicia sesión para ver tu resumen.</div>
      </div>
    )
  }

  const firstName = user.full_name.split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const volumeValue = stats.volume > 0 ? fmtVolume(stats.volume) : fmtVolume(plannedVolume(exercises))
  const volumeLabel = stats.volume > 0 ? 'Levantado esta semana' : 'Planeado para hoy'

  return (
    <>
      <ScreenHeader title="Inicio" subtitle={todayLabel()} />

      <div className="px-4 sm:px-5 py-4 flex-1 mx-auto w-full max-w-[560px]">
        {/* Saludo */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="text-[20px] font-bold leading-tight truncate">{greeting}, {firstName}</div>
            <div className="text-[12px] text-text-3 mt-0.5 truncate">
              {hasPlans ? `${plans.length} rutina${plans.length !== 1 ? 's' : ''} disponible${plans.length !== 1 ? 's' : ''}` : 'Aún sin rutinas'}
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-center bg-surface rounded-2xl px-3.5 py-2">
            <span className="text-[18px] font-bold leading-none" style={{ color: stats.streak > 0 ? 'var(--accent)' : 'var(--text-3)' }}>
              {stats.streak}
            </span>
            <span className="text-[9px] text-text-3 uppercase tracking-[0.06em] mt-1">Racha</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            <div className="h-44 rounded-3xl skeleton" />
            <div className="h-24 rounded-2xl skeleton" />
          </div>
        ) : !hasPlans ? (
          <div className="bg-surface rounded-3xl p-8 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-accent-dim text-accent flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M6.5 6.5l11 11M4 9v6M20 9v6M7 7v10M17 7v10" />
              </svg>
            </div>
            <div className="text-sm font-semibold">Aún no tienes rutinas</div>
            <div className="text-[12px] text-text-3 max-w-[280px] leading-relaxed">
              Crea una rutina propia o pide a tu entrenador que te asigne un plan. Después podrás programarla por día.
            </div>
            <Link to="/my-routines" className="mt-1 h-11 px-5 rounded-full bg-accent text-accent-contrast text-[13px] font-bold inline-flex items-center no-underline active:opacity-70">
              Ir a Entrenamiento
            </Link>
          </div>
        ) : todayPlan ? (
          <>
            {/* Rutina de hoy */}
            <section className="bg-surface rounded-3xl p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-accent opacity-80" />
              <div className="text-[10px] uppercase tracking-[0.12em] font-bold text-accent">Hoy toca</div>
              <h2 className="text-[24px] font-bold leading-tight mt-1.5">{todayPlan.name}</h2>
              <div className="text-[12px] text-text-3 mt-1">
                {todayPlan.origin === 'assigned'
                  ? `Por ${todayPlan.creator?.full_name ?? 'tu entrenador'}`
                  : 'Rutina propia'}
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="bg-surface2 rounded-2xl px-3 py-2.5">
                  <div className="text-[17px] font-bold leading-none">{exercisesLoading ? '—' : exercises.length}</div>
                  <div className="text-[9px] text-text-3 uppercase tracking-[0.06em] mt-1">Ejercicios</div>
                </div>
                <div className="bg-surface2 rounded-2xl px-3 py-2.5">
                  <div className="text-[17px] font-bold leading-none">
                    {exercisesLoading ? '—' : exercises.reduce((acc, ex) => acc + (ex.set_details?.length ?? ex.sets ?? 0), 0)}
                  </div>
                  <div className="text-[9px] text-text-3 uppercase tracking-[0.06em] mt-1">Series</div>
                </div>
                <div className="bg-surface2 rounded-2xl px-3 py-2.5">
                  <div className="text-[17px] font-bold leading-none">{fmtVolume(plannedVolume(exercises))}</div>
                  <div className="text-[9px] text-text-3 uppercase tracking-[0.06em] mt-1">Planeado</div>
                </div>
              </div>

              <button
                type="button"
                onClick={startWorkout}
                disabled={!canTrain}
                className="mt-4 w-full h-14 rounded-full bg-accent text-accent-contrast text-[16px] font-bold border-none cursor-pointer active:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                {exercisesLoading ? 'Cargando…' : canTrain ? 'Empezar rutina' : 'Agrega ejercicios para entrenar'}
              </button>
              <button
                type="button"
                onClick={() => setViewOpen(true)}
                disabled={exercisesLoading || exercises.length === 0}
                className="mt-2 w-full h-11 rounded-full bg-transparent text-accent text-[14px] font-semibold border-none cursor-pointer active:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                Ver rutina
              </button>
            </section>

            {todayPlans.length > 1 && (
              <div className="mt-4">
                <div className="text-[10px] uppercase tracking-[0.08em] text-text-3 font-bold mb-2">Otra rutina de hoy</div>
                <div className="flex gap-2 overflow-x-auto">
                  {todayPlans.map((p, idx) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectTodayPlan(idx)}
                      className={`shrink-0 px-3.5 py-2 rounded-full text-[12px] font-semibold border-none cursor-pointer active:opacity-70 transition-colors ${
                        idx === activeIdx ? 'bg-accent text-accent-contrast' : 'bg-surface2 text-text-2'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Día de descanso */}
            <section className="bg-surface rounded-3xl p-6 text-center flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-surface2 text-text-2 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M12 3a9 9 0 1 0 9 9" /><path d="M12 7v5l3 2" />
                </svg>
              </div>
              <div className="text-[16px] font-semibold">Hoy es día de descanso</div>
              <div className="text-[12px] text-text-3 max-w-[300px] leading-relaxed">
                No tienes una rutina programada para hoy. Descansa, hidrátate y recupera.
              </div>
              <Link
                to="/my-routines"
                className="mt-2 h-11 px-5 rounded-full bg-surface2 text-text text-[13px] font-semibold inline-flex items-center no-underline active:opacity-70"
              >
                Explorar entrenamiento
              </Link>
            </section>
          </>
        )}

        {/* Estadísticas de la semana */}
        {!loading && hasPlans && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-surface rounded-2xl px-3 py-3">
              <div className="text-[18px] font-bold leading-none">{stats.sessions}</div>
              <div className="text-[9px] text-text-3 uppercase tracking-[0.06em] mt-1.5">Entrenos</div>
            </div>
            <div className="bg-surface rounded-2xl px-3 py-3">
              <div className="text-[18px] font-bold leading-none">{stats.visits}</div>
              <div className="text-[9px] text-text-3 uppercase tracking-[0.06em] mt-1.5">Visitas</div>
            </div>
            <div className="bg-surface rounded-2xl px-3 py-3">
              <div className="text-[18px] font-bold leading-none truncate">{volumeValue}</div>
              <div className="text-[9px] text-text-3 uppercase tracking-[0.06em] mt-1.5 leading-tight">{volumeLabel}</div>
            </div>
          </div>
        )}
      </div>

      {/* Detalle de la rutina de hoy */}
      <BottomSheet
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title={todayPlan?.name ?? 'Rutina de hoy'}
        subtitle={`${exercises.length} ejercicio${exercises.length !== 1 ? 's' : ''}`}
      >
        <div className="flex flex-col gap-2">
          {exercises.map((ex, index) => (
            <div key={ex.id} className="bg-surface rounded-2xl px-4 py-3 flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-accent-dim text-accent text-[11px] font-bold flex items-center justify-center shrink-0">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold truncate">{ex.exercise_name}</span>
                {ex.muscle && <span className="block text-[11px] text-text-3 truncate">{ex.muscle}</span>}
              </span>
              <span className="shrink-0 text-[11px] text-text-3 font-mono">{ex.sets ?? '—'} × {ex.reps ?? '—'}</span>
            </div>
          ))}
        </div>
      </BottomSheet>

      {/* Sesión */}
      <WorkoutSession
        open={session !== null}
        onClose={() => setSession(null)}
        planName={session?.name ?? ''}
        planId={session?.planId ?? null}
        memberId={user.id}
        exercises={session?.exercises ?? []}
        onSaved={() => { loadStats(user.id) }}
      />
    </>
  )
}
