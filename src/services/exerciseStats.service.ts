import { supabase } from '@/lib/supabase'

export interface ExerciseSessionStat {
  sessionId: string
  date: string
  sets: number
  maxWeight: number
  oneRm: number
  volume: number
}

export interface ExerciseStats {
  /** Sesiones ascendentes (para el gráfico). */
  points: ExerciseSessionStat[]
  /** Sesiones descendentes (para el historial). */
  history: ExerciseSessionStat[]
  prMaxWeight: number | null
  prOneRm: number | null
  totalSets: number
}

const EMPTY: ExerciseStats = { points: [], history: [], prMaxWeight: null, prOneRm: null, totalSets: 0 }

function oneRmOf(weight: number | null, reps: number | null): number {
  if (weight == null || reps == null || weight <= 0 || reps <= 0) return 0
  return weight * (1 + reps / 30)
}

/**
 * Estadísticas de un ejercicio para el miembro: series completadas agrupadas
 * por sesión. RLS limita las filas a las sesiones propias.
 */
export const exerciseStatsService = {
  getForExercise: async (memberId: string, exerciseId: string): Promise<ExerciseStats> => {
    const { data: sessions, error: sessionsError } = await supabase
      .from('workout_sessions')
      .select('id, started_at')
      .eq('member_id', memberId)
      .order('started_at', { ascending: false })
      .limit(200)

    if (sessionsError) throw sessionsError
    if (!sessions || sessions.length === 0) return EMPTY

    const dates = new Map<string, string>()
    for (const s of sessions) dates.set(s.id, s.started_at)

    const { data: sets, error: setsError } = await supabase
      .from('workout_sets')
      .select('session_id, weight, reps')
      .eq('exercise_id', exerciseId)
      .eq('completed', true)
      .in('session_id', [...dates.keys()])

    if (setsError) throw setsError
    if (!sets || sets.length === 0) return EMPTY

    const bySession = new Map<string, ExerciseSessionStat>()
    for (const set of sets) {
      const date = dates.get(set.session_id)
      if (!date) continue

      const weight = set.weight != null ? Number(set.weight) : null
      const reps = set.reps != null ? Number(set.reps) : null
      const volume = weight != null && reps != null ? Math.max(0, weight) * Math.max(0, reps) : 0
      const oneRm = oneRmOf(weight, reps)

      const current = bySession.get(set.session_id) ?? {
        sessionId: set.session_id,
        date,
        sets: 0,
        maxWeight: 0,
        oneRm: 0,
        volume: 0,
      }

      current.sets += 1
      current.maxWeight = Math.max(current.maxWeight, weight ?? 0)
      current.oneRm = Math.max(current.oneRm, oneRm)
      current.volume += volume
      bySession.set(set.session_id, current)
    }

    const all = [...bySession.values()].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )

    const prMaxWeight = all.reduce<number | null>(
      (acc, p) => (p.maxWeight > 0 ? Math.max(acc ?? 0, p.maxWeight) : acc),
      null,
    )
    const prOneRm = all.reduce<number | null>(
      (acc, p) => (p.oneRm > 0 ? Math.max(acc ?? 0, p.oneRm) : acc),
      null,
    )

    return {
      points: all,
      history: [...all].reverse(),
      prMaxWeight,
      prOneRm,
      totalSets: sets.length,
    }
  },
}
