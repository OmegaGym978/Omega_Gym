import { supabase } from '@/lib/supabase'
import { isMissingColumnError } from '@/lib/supabase-errors'
import type { TrainingPlan, PlanExercise, ExerciseInput } from '@/services/training.service'

export type Routine = TrainingPlan & {
  kind: 'trainer' | 'personal'
  share_code: string | null
}

export interface RoutineListItem {
  id: string
  name: string
  description: string | null
  share_code: string | null
  show_in_plan: boolean
  exercise_count: number
  /** Nombres de ejercicios ordenados por `order_index` (para el resumen de la tarjeta). */
  exercise_names: string[]
  /** Días programados (0=lunes … 6=domingo). */
  scheduled_days: number[] | null
  created_at: string
  updated_at: string
}

export const routinesService = {
  /** Rutinas personales del dueño (RLS garantiza que solo sean las propias) */
  getMine: async (ownerId: string): Promise<RoutineListItem[]> => {
    const fetchRows = (withSchedule: boolean) => supabase
      .from('training_plans')
      .select(`id, name, description, share_code, show_in_plan, ${withSchedule ? 'scheduled_days, ' : ''}created_at, updated_at, plan_exercises(exercise_name, order_index)`)
      .eq('created_by', ownerId)
      .eq('kind', 'personal')
      .order('updated_at', { ascending: false })

    let result = await fetchRows(true)
    if (result.error && isMissingColumnError(result.error, 'scheduled_days')) {
      // Migración pendiente en el entorno: se omite la programación.
      result = await fetchRows(false)
    }
    if (result.error) throw result.error

    const data = result.data

    return (data || []).map((r: any): RoutineListItem => {
      const rows = ((r.plan_exercises || []) as { exercise_name: string; order_index: number }[])
        .slice()
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))

      return {
        id: r.id,
        name: r.name,
        description: r.description,
        share_code: r.share_code ?? null,
        show_in_plan: r.show_in_plan ?? true,
        exercise_count: rows.length,
        exercise_names: rows.map(ex => ex.exercise_name),
        scheduled_days: r.scheduled_days ?? null,
        created_at: r.created_at,
        updated_at: r.updated_at,
      }
    })
  },

  /** Detalle completo (plan + ejercicios) para editar o ver */
  getDetail: async (routineId: string): Promise<{ routine: Routine; exercises: PlanExercise[] }> => {
    const [planRes, exercisesRes] = await Promise.all([
      supabase.from('training_plans').select('*').eq('id', routineId).single(),
      supabase
        .from('plan_exercises')
        .select('*')
        .eq('plan_id', routineId)
        .order('order_index'),
    ])

    if (planRes.error) throw planRes.error
    if (exercisesRes.error) throw exercisesRes.error

    return {
      routine: planRes.data as Routine,
      exercises: (exercisesRes.data || []) as PlanExercise[],
    }
  },

  createPersonal: async (input: {
    name: string
    description?: string | null
    created_by: string
  }): Promise<Routine> => {
    const { data, error } = await supabase
      .from('training_plans')
      .insert({
        name: input.name,
        description: input.description || null,
        created_by: input.created_by,
        kind: 'personal',
      })
      .select()
      .single()

    if (error) throw error
    return data as Routine
  },

  updatePersonal: async (id: string, input: {
    name?: string
    description?: string | null
  }): Promise<void> => {
    const payload: Record<string, unknown> = {}
    if (input.name !== undefined) payload.name = input.name
    if (input.description !== undefined) payload.description = input.description

    const { error } = await supabase
      .from('training_plans')
      .update(payload)
      .eq('id', id)

    if (error) throw error
  },

  /** Muestra u oculta una rutina propia en la vista Mi plan */
  setPlanVisibility: async (id: string, visible: boolean): Promise<void> => {
    const { error } = await supabase
      .from('training_plans')
      .update({ show_in_plan: visible })
      .eq('id', id)

    if (error) throw error
  },

  deletePersonal: async (id: string): Promise<void> => {
    const { error: exError } = await supabase
      .from('plan_exercises')
      .delete()
      .eq('plan_id', id)

    if (exError) throw exError

    const { error } = await supabase
      .from('training_plans')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  saveExercises: async (routineId: string, exercises: ExerciseInput[]): Promise<void> => {
    const { error: delError } = await supabase
      .from('plan_exercises')
      .delete()
      .eq('plan_id', routineId)

    if (delError) throw delError
    if (exercises.length === 0) return

    const rows = exercises.map((ex, i) => ({
      plan_id: routineId,
      exercise_id: ex.exercise_id || null,
      exercise_name: ex.exercise_name,
      muscle: ex.muscle || null,
      sets: ex.sets || null,
      reps: ex.reps || null,
      rest_seconds: ex.rest_seconds || null,
      notes: ex.notes || null,
      reference_link: ex.reference_link || null,
      day: ex.day ?? null,
      set_details: ex.set_details ?? null,
      order_index: ex.order_index ?? i,
    }))

    const { error } = await supabase.from('plan_exercises').insert(rows)
    if (error) {
      if (!isMissingColumnError(error, 'set_details')) throw error
      const legacy = rows.map(row => {
        const copy = { ...row }
        delete (copy as { set_details?: unknown }).set_details
        return copy
      })
      const retry = await supabase.from('plan_exercises').insert(legacy)
      if (retry.error) throw retry.error
    }
  },

  /** Código vigente o nuevo; regenerate=true invalida el anterior */
  generateShareCode: async (routineId: string, regenerate = false): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_share_code', {
      p_plan_id: routineId,
      p_regenerate: regenerate,
    })

    if (error) throw error
    return data as string
  },

  revokeShareCode: async (routineId: string): Promise<void> => {
    const { error } = await supabase.rpc('revoke_share_code', {
      p_plan_id: routineId,
    })

    if (error) throw error
  },

  /** Crea una copia independiente a nombre del llamador; retorna id de la nueva rutina */
  importByCode: async (code: string): Promise<string> => {
    const { data, error } = await supabase.rpc('import_routine_by_code', {
      p_code: code,
    })

    if (error) throw error
    return data as string
  },
}
