import { supabase } from '@/lib/supabase'
import { checkInsService } from '@/services/checkIns.service'
import { localDateKey, startOfWeek } from '@/lib/dates'

export interface SessionSetInput {
  exercise_id: string | null
  exercise_name: string
  set_index: number
  weight: number | null
  reps: number | null
  completed: boolean
}

export interface SaveSessionResult {
  id: string
  totalSets: number
  totalVolume: number
}

export interface WeeklyStats {
  sessions: number
  visits: number
  volume: number
  streak: number
}

function volumeOf(weight: number | null, reps: number | null): number {
  if (weight == null || reps == null) return 0
  return Math.max(0, weight) * Math.max(0, reps)
}

export const sessionsService = {
  /**
   * Guarda una sesión finalizada con sus series completadas.
   * Se llama al finalizar; si el usuario cierra antes, no se escribe nada.
   */
  saveSession: async (input: {
    memberId: string
    planId: string | null
    planName: string
    startedAt: string
    sets: SessionSetInput[]
  }): Promise<SaveSessionResult> => {
    const completed = input.sets.filter(s => s.completed)
    const totalVolume = completed.reduce((acc, s) => acc + volumeOf(s.weight, s.reps), 0)

    const { data: session, error } = await supabase
      .from('workout_sessions')
      .insert({
        member_id: input.memberId,
        plan_id: input.planId,
        plan_name: input.planName,
        started_at: input.startedAt,
        finished_at: new Date().toISOString(),
        total_sets: completed.length,
        total_volume: Number(totalVolume.toFixed(2)),
      })
      .select('id')
      .single()

    if (error) throw error

    if (completed.length > 0) {
      const { error: setsError } = await supabase
        .from('workout_sets')
        .insert(completed.map(s => ({
          session_id: session.id,
          exercise_id: s.exercise_id,
          exercise_name: s.exercise_name,
          set_index: s.set_index,
          weight: s.weight,
          reps: s.reps,
          completed: true,
        })))

      if (setsError) {
        // Evita dejar una sesión sin series si el insert falla.
        await supabase.from('workout_sessions').delete().eq('id', session.id)
        throw setsError
      }
    }

    return { id: session.id, totalSets: completed.length, totalVolume }
  },

  /** Estadísticas de la semana actual (lunes a hoy) + racha de sesiones. */
  getWeeklyStats: async (memberId: string): Promise<WeeklyStats> => {
    const monday = startOfWeek()
    const since = monday.toISOString()

    const [sessionsRes, visitsRes] = await Promise.all([
      supabase
        .from('workout_sessions')
        .select('id, started_at, total_volume')
        .eq('member_id', memberId)
        .gte('started_at', since),
      checkInsService.getSinceByMember(memberId, since).catch(() => [] as string[]),
    ])

    if (sessionsRes.error) throw sessionsRes.error

    const sessions = sessionsRes.data || []
    const volume = sessions.reduce((acc: number, s: any) => acc + Number(s.total_volume || 0), 0)

    // Racha: días consecutivos con sesión, contando desde hoy o ayer.
    const { data: recent, error: recentError } = await supabase
      .from('workout_sessions')
      .select('started_at')
      .eq('member_id', memberId)
      .order('started_at', { ascending: false })
      .limit(200)

    if (recentError) throw recentError

    const trainedDays = new Set((recent || []).map((r: any) => localDateKey(new Date(r.started_at))))
    let streak = 0
    const cursor = new Date()
    if (!trainedDays.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1)
    while (trainedDays.has(localDateKey(cursor))) {
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    }

    return {
      sessions: sessions.length,
      visits: (visitsRes || []).length,
      volume,
      streak,
    }
  },
}
