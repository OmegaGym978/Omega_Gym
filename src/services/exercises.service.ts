import { supabase } from '@/lib/supabase'

function escapeSearch(s: string): string {
  return s.replace(/[%_\\]/g, '\\$&')
}

export interface Exercise {
  id: string
  external_id: string | null
  name: string
  name_es: string
  category: string
  body_part: string
  equipment: string
  target: string
  muscle_group: string
  secondary_muscles: string[] | null
  instructions_es: string | null
  gif_url: string | null
  image_url: string | null
  is_active: boolean
  created_at: string
  /** NULL = catálogo global; uuid = ejercicio personal del miembro. */
  created_by?: string | null
}

export interface ExerciseFilters {
  search?: string
  category?: string
  muscle_group?: string
  equipment?: string
  limit?: number
  offset?: number
}

export const exercisesService = {
  getAll: async (filters?: ExerciseFilters): Promise<Exercise[]> => {
    let query = supabase
      .from('exercises')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (filters?.search) {
      const escaped = escapeSearch(filters.search)
      query = query.or(`name.ilike.%${escaped}%,name_es.ilike.%${escaped}%`)
    }

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.muscle_group) {
      query = query.eq('muscle_group', filters.muscle_group)
    }

    if (filters?.equipment) {
      query = query.eq('equipment', filters.equipment)
    }

    if (filters?.offset !== undefined && filters?.limit) {
      query = query.range(filters.offset, filters.offset + filters.limit - 1)
    } else if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) throw error
    return (data || []) as Exercise[]
  },

  getById: async (id: string): Promise<Exercise | null> => {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data as Exercise
  },

  getByIds: async (ids: string[]): Promise<Exercise[]> => {
    if (ids.length === 0) return []
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .in('id', ids)

    if (error) throw error
    return (data || []) as Exercise[]
  },

  search: async (query: string, limit: number = 20): Promise<Exercise[]> => {
    if (!query.trim()) return []
    const escaped = escapeSearch(query.trim())
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${escaped}%,name_es.ilike.%${escaped}%`)
      .order('name')
      .limit(limit)

    if (error) throw error
    return (data || []) as Exercise[]
  },

  getCategories: async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from('exercises')
      .select('category')
      .eq('is_active', true)
      .order('category')

    if (error) throw error
    const unique = [...new Set((data || []).map((r: any) => r.category))]
    return unique
  },

  getEquipment: async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from('exercises')
      .select('equipment')
      .eq('is_active', true)
      .order('equipment')

    if (error) throw error
    const unique = [...new Set((data || []).map((r: any) => r.equipment))]
    return unique
  },

  getMuscleGroups: async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from('exercises')
      .select('muscle_group')
      .eq('is_active', true)
      .order('muscle_group')

    if (error) throw error
    const unique = [...new Set((data || []).map((r: any) => r.muscle_group))]
    return unique
  },

  /** Crea un ejercicio personal del miembro (visible solo para él). */
  createCustom: async (input: {
    name: string
    muscle_group: string
    equipment: string
    gif_url?: string | null
    image_url?: string | null
    instructions_es?: string | null
    created_by: string
  }): Promise<Exercise> => {
    const name = input.name.trim()
    const { data, error } = await supabase
      .from('exercises')
      .insert({
        name,
        name_es: name,
        category: input.muscle_group,
        body_part: input.muscle_group,
        target: input.muscle_group,
        muscle_group: input.muscle_group,
        equipment: input.equipment,
        gif_url: input.gif_url?.trim() || null,
        image_url: input.image_url?.trim() || null,
        instructions_es: input.instructions_es?.trim() || null,
        is_active: true,
        created_by: input.created_by,
      })
      .select()
      .single()

    if (error) throw error
    return data as Exercise
  },

  /** Elimina un ejercicio personal (RLS solo permite los propios). */
  deleteCustom: async (id: string): Promise<void> => {
    const { error } = await supabase.from('exercises').delete().eq('id', id)
    if (error) throw error
  },
}
