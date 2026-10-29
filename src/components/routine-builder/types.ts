import type { PlanSet } from '@/services/training.service'

/** Serie en edición: los inputs guardan texto para permitir vacío y decimales. */
export type BuilderSet = {
  weight: string
  reps: string
}

export type BuilderExercise = {
  /** Identificador local estable para listas y edición. */
  key: string
  exercise_id: string | null
  exercise_name: string
  muscle: string | null
  sets: number | null
  reps: number | null
  rest_seconds: number | null
  notes: string | null
  reference_link: string | null
  set_details: BuilderSet[]
}

export type EditPlanData = {
  id: string
  name: string
  description?: string | null
  exercises: {
    exercise_id?: string | null
    exercise_name: string
    muscle: string | null
    sets: number | null
    reps: number | null
    rest_seconds: number | null
    notes: string | null
    reference_link: string | null
    order_index: number
    /** Null o ausente = rutina antigua sin series detalladas. */
    set_details?: PlanSet[] | null
  }[]
}
