import { supabase } from '@/lib/supabase'
import { isMissingColumnError } from '@/lib/supabase-errors'

function escapeSearch(s: string): string {
  return s.replace(/[%_\\]/g, '\\$&')
}

export interface TrainingPlan {
  id: string
  name: string
  description: string | null
  assigned_to: string | null
  created_by: string
  created_at: string
  updated_at: string
  /** Días programados (0=lunes … 6=domingo). NULL/vacío = sin programar. */
  scheduled_days: number[] | null
}

export interface PlanExercise {
  id: string
  plan_id: string
  exercise_id: string | null
  exercise_name: string
  muscle: string | null
  sets: number | null
  reps: number | null
  rest_seconds: number | null
  day: number | null
  notes: string | null
  reference_link: string | null
  /** Series planificadas (peso/reps). NULL en rutinas anteriores al cambio. */
  set_details: PlanSet[] | null
  order_index: number
  created_at: string
}

export type PlanSet = {
  weight: number | null
  reps: number | null
}

export type ExerciseInput = {
  exercise_id?: string | null
  exercise_name: string
  muscle?: string | null
  sets?: number | null
  reps?: number | null
  rest_seconds?: number | null
  notes?: string | null
  reference_link?: string | null
  /** Columna legacy: ya no se usa para repartir por días. Se escribe siempre `null`. */
  day?: number | null
  set_details?: PlanSet[] | null
  order_index: number
}

export interface PlanListItem {
  id: string
  name: string
  description: string | null
  type: 'assigned' | 'draft'
  trainer_name: string
  member_name: string | null
  member_ids: string[]
  member_names: string[]
  member_count: number
  assigned_to: string | null
  exercise_count: number
  scheduled_days: number[] | null
  created_at: string
}

export interface PlanFilters {
  search?: string
  type?: string
  page?: number
  pageSize?: number
}

export const trainingService = {
  /**
   * Listado para el panel de staff (admin/entrenador).
   * Solo planes `kind='trainer'`: las rutinas personales de los miembros
   * no deben aparecer aquí (SPEC_001 regla 5 / TKT-OMEGYM-027).
   * La RLS (training_plans_select) ya las bloquea; el filtro es defensa
   * en profundidad y evita depender solo de la política.
   */
  getAll: async (filters?: PlanFilters): Promise<{ data: PlanListItem[]; count: number }> => {
    let query = supabase
      .from('training_plans')
      .select(`
        *,
        creator:profiles!training_plans_created_by_fkey(full_name),
        assignee:profiles!training_plans_assigned_to_fkey(full_name),
        plan_exercises(count)
      `, { count: 'exact' })
      .eq('kind', 'trainer')

    if (filters?.search) {
      const escaped = escapeSearch(filters.search)
      query = query.or(`name.ilike.%${escaped}%,description.ilike.%${escaped}%`)
    }

    const from = ((filters?.page ?? 1) - 1) * (filters?.pageSize ?? 20)
    const to = from + (filters?.pageSize ?? 20) - 1

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    const plan_ids: string[] = (data || []).map(p => p.id)

    const [assignmentsRes, memberProfileRes] = await Promise.all([
      supabase
        .from('plan_assignments')
        .select('plan_id, member_id')
        .in('plan_id', plan_ids),
      supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', [...new Set((data || []).map((p: any) => p.assigned_to).filter(Boolean))]),
    ])

    const memberNameById: Record<string, string> = {}
    for (const prof of memberProfileRes.data || []) {
      memberNameById[prof.id] = prof.full_name
    }
    const assigneeIdsByPlan: Record<string, string[]> = {}
    for (const a of assignmentsRes.data || []) {
      if (!assigneeIdsByPlan[a.plan_id]) assigneeIdsByPlan[a.plan_id] = []
      if (!assigneeIdsByPlan[a.plan_id].includes(a.member_id)) assigneeIdsByPlan[a.plan_id].push(a.member_id)
    }

    return {
      data: (data || []).map((p: any): PlanListItem => {
        const memberIds = assigneeIdsByPlan[p.id] || []
        if (p.assigned_to && !memberIds.includes(p.assigned_to)) memberIds.push(p.assigned_to)
        const memberNames = memberIds.map(id => memberNameById[id] || '—')
        const type = memberIds.length > 0 ? 'assigned' : 'draft'
        const memberName = memberNames[0] || null
        const extraCount = memberIds.length - 1
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          type,
          trainer_name: p.creator?.full_name ?? '—',
          member_name: extraCount > 0 ? `${memberName} +${extraCount}` : memberName,
          member_ids: memberIds,
          member_names: memberNames,
          member_count: memberIds.length,
          assigned_to: p.assigned_to ?? null,
          exercise_count: p.plan_exercises?.[0]?.count ?? 0,
          scheduled_days: p.scheduled_days ?? null,
          created_at: p.created_at,
        }
      }),
      count: count ?? 0,
    }
  },

  getById: async (id: string) => {
    const { data: plan, error } = await supabase
      .from('training_plans')
      .select(`
        *,
        creator:profiles!training_plans_created_by_fkey(full_name),
        assignee:profiles!training_plans_assigned_to_fkey(full_name)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    const [exercisesRes, assigneesRes] = await Promise.all([
      supabase
        .from('plan_exercises')
        .select('*')
        .eq('plan_id', id)
        .order('order_index'),
      supabase
        .from('plan_assignments')
        .select('member_id, member:profiles(full_name)')
        .eq('plan_id', id),
    ])

    if (exercisesRes.error) throw exercisesRes.error

    return {
      ...plan,
      exercises: (exercisesRes.data || []) as PlanExercise[],
      assignees: (assigneesRes.data || []).map(a => ({ id: a.member_id, full_name: (a.member as any).full_name })),
    }
  },

  create: async (input: {
    name: string
    description?: string
    created_by: string
    assigned_to?: string
    kind?: 'trainer' | 'personal'
    scheduled_days?: number[] | null
  }) => {
    const basePayload = {
      name: input.name,
      description: input.description || null,
      created_by: input.created_by,
      assigned_to: input.assigned_to || null,
      kind: input.kind || 'trainer',
    }
    const payload = { ...basePayload, scheduled_days: input.scheduled_days ?? null }

    let result = await supabase.from('training_plans').insert(payload).select().single()
    if (result.error && isMissingColumnError(result.error, 'scheduled_days')) {
      // Migración pendiente en el entorno: se crea sin programación.
      result = await supabase.from('training_plans').insert(basePayload).select().single()
    }
    if (result.error) throw result.error
    return result.data as TrainingPlan
  },

  delete: async (id: string): Promise<void> => {
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

  update: async (id: string, input: {
    name?: string
    description?: string | null
    assigned_to?: string | null
    scheduled_days?: number[] | null
  }) => {
    const payload: Record<string, unknown> = {}
    if (input.name !== undefined) payload.name = input.name
    if (input.description !== undefined) payload.description = input.description
    if (input.assigned_to !== undefined) payload.assigned_to = input.assigned_to || null
    if (input.scheduled_days !== undefined) payload.scheduled_days = input.scheduled_days

    const { data, error } = await supabase
      .from('training_plans')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as TrainingPlan
  },

  duplicate: async (id: string): Promise<string> => {
    const plan = await trainingService.getById(id)

    const basePayload = {
      name: plan.name + ' (copia)',
      description: plan.description,
      created_by: plan.created_by,
      assigned_to: null,
      // Una copia del staff siempre es un plan de entrenamiento
      kind: 'trainer' as const,
    }
    const payload = { ...basePayload, scheduled_days: plan.scheduled_days ?? null }

    let planResult = await supabase.from('training_plans').insert(payload).select().single()
    if (planResult.error && isMissingColumnError(planResult.error, 'scheduled_days')) {
      planResult = await supabase.from('training_plans').insert(basePayload).select().single()
    }
    if (planResult.error) throw planResult.error
    const newPlan = planResult.data

    if (plan.exercises && plan.exercises.length > 0) {
      const rows = (plan.exercises as PlanExercise[]).map(ex => ({
        plan_id: newPlan.id,
        exercise_id: ex.exercise_id || null,
        exercise_name: ex.exercise_name,
        muscle: ex.muscle,
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: ex.rest_seconds,
        notes: ex.notes,
        reference_link: ex.reference_link,
        day: ex.day,
        set_details: ex.set_details ?? null,
        order_index: ex.order_index,
      }))

      const { error: exError } = await supabase.from('plan_exercises').insert(rows)
      if (exError) {
        if (!isMissingColumnError(exError, 'set_details')) throw exError
        // Migración pendiente: la copia se hace sin series detalladas.
        const legacy = rows.map(row => {
          const copy = { ...row }
          delete (copy as { set_details?: unknown }).set_details
          return copy
        })
        const retry = await supabase.from('plan_exercises').insert(legacy)
        if (retry.error) throw retry.error
      }
    }

    return newPlan.id
  },

  unlink: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('training_plans')
      .update({ assigned_to: null })
      .eq('id', id)

    if (error) throw error

    const { error: aError } = await supabase
      .from('plan_assignments')
      .delete()
      .eq('plan_id', id)

    if (aError) throw aError
  },

  assign: async (id: string, memberId: string): Promise<void> => {
    const { error } = await supabase
      .from('training_plans')
      .update({ assigned_to: memberId })
      .eq('id', id)

    if (error) throw error

    const { error: aError } = await supabase
      .from('plan_assignments')
      .insert({ plan_id: id, member_id: memberId })

    if (aError && aError.code !== '23505') throw aError
  },

  getByMemberAll: async (memberId: string) => {
    const [assignmentsRes, legacyRes] = await Promise.all([
      supabase
        .from('plan_assignments')
        .select('plan_id, visible')
        .eq('member_id', memberId),
      supabase
        .from('training_plans')
        .select('id')
        .eq('assigned_to', memberId),
    ])

    if (assignmentsRes.error) throw assignmentsRes.error
    if (legacyRes.error) throw legacyRes.error

    const ids = new Set<string>()
    for (const a of assignmentsRes.data || []) ids.add(a.plan_id)
    for (const l of legacyRes.data || []) ids.add(l.id)

    if (ids.size === 0) return []

    const { data, error } = await supabase
      .from('training_plans')
      .select(`*, creator:profiles!training_plans_created_by_fkey(id, full_name)`)
      .in('id', [...ids])

    if (error) throw error

    // Preferencia por miembro desde plan_assignments (undefined = visible por defecto)
    const visibilityByPlan: Record<string, boolean> = {}
    for (const a of assignmentsRes.data || []) visibilityByPlan[a.plan_id] = a.visible ?? true

    return ((data || []) as (TrainingPlan & { kind?: 'trainer' | 'personal'; creator: { id: string; full_name: string } | null; visible?: boolean })[])
      .map(p => ({ ...p, visible: p.kind === 'personal' ? true : (visibilityByPlan[p.id] ?? p.visible ?? true) }))
  },

  /** Visibilidad de un plan asignado en Mi plan (RPC SECURITY DEFINER, por miembro) */
  setAssignedVisibility: async (planId: string, visible: boolean): Promise<void> => {
    const { error } = await supabase.rpc('set_assignment_visibility', {
      p_plan_id: planId,
      p_visible: visible,
    })

    if (error) throw error
  },

  getByMember: async (memberId: string) => {
    const plans = await trainingService.getByMemberAll(memberId)
    return plans[0] ?? null
  },

  assignMultiple: async (planId: string, memberIds: string[]): Promise<void> => {
    if (memberIds.length === 0) return
    const { error } = await supabase
      .from('plan_assignments')
      .insert(memberIds.map(memberId => ({ plan_id: planId, member_id: memberId })))

    if (error) throw error
  },

  getAssignees: async (planId: string): Promise<{ id: string; full_name: string }[]> => {
    const { data, error } = await supabase
      .from('plan_assignments')
      .select('member_id, member:profiles(full_name)')
      .eq('plan_id', planId)

    if (error) throw error
    return (data || []).map(a => ({ id: a.member_id, full_name: (a.member as any).full_name }))
  },

  removeAssignment: async (planId: string, memberId: string): Promise<void> => {
    const { error } = await supabase
      .from('plan_assignments')
      .delete()
      .eq('plan_id', planId)
      .eq('member_id', memberId)

    if (error) throw error
  },

  /** Programa los días de la semana de un plan (0=lunes … 6=domingo). */
  setSchedule: async (planId: string, days: number[]): Promise<void> => {
    const normalized = [...new Set(days.filter(d => d >= 0 && d <= 6))].sort((a, b) => a - b)
    const { error } = await supabase
      .from('training_plans')
      .update({ scheduled_days: normalized.length > 0 ? normalized : null })
      .eq('id', planId)

    if (error) throw error
  },

  // ---- Exercises ----

  getExercises: async (planId: string): Promise<PlanExercise[]> => {
    const { data, error } = await supabase
      .from('plan_exercises')
      .select('*')
      .eq('plan_id', planId)
      .order('order_index')

    if (error) throw error
    return (data || []) as PlanExercise[]
  },

  upsertExercises: async (planId: string, exercises: ExerciseInput[]): Promise<void> => {
    const { error: delError } = await supabase
      .from('plan_exercises')
      .delete()
      .eq('plan_id', planId)

    if (delError) throw delError
    if (exercises.length === 0) return

    const rows = exercises.map((ex, i) => ({
      plan_id: planId,
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
      // Migración pendiente: se guardan los agregados sin series detalladas.
      const legacy = rows.map(row => {
        const copy = { ...row }
        delete (copy as { set_details?: unknown }).set_details
        return copy
      })
      const retry = await supabase.from('plan_exercises').insert(legacy)
      if (retry.error) throw retry.error
    }
  },
}
