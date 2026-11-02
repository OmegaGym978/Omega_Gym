import { supabase } from '@/lib/supabase'
import { one, type Embedded } from '@/lib/embed'

export interface MembershipType {
  id: string
  name: string
  price: number
  duration_days: number
  description: string | null
  is_active: boolean
  created_at: string
}

export interface Membership {
  id: string
  member_id: string
  type_id: string
  start_date: string
  end_date: string
  status: 'active' | 'expired' | 'cancelled'
  created_at: string
}

/** Membresía activa con su tipo embebido (vista del miembro). */
export type ActiveMembership = Membership & { membership_types: MembershipType }

/** Membresía con el nombre del tipo embebido (historial del miembro). */
export type MembershipWithType = Membership & { membership_types: { name: string | null } | null }

export interface MembershipListItem {
  id: string
  member_id: string
  member_name: string
  member_email: string | null
  type_name: string
  start_date: string
  end_date: string
  status: string
  days_remaining: number
  payment_status: 'paid' | 'pending' | null
}

/** Fila de `memberships` con perfil y tipo embebidos. */
interface MembershipRow {
  id: string
  member_id: string
  start_date: string
  end_date: string
  status: string
  profiles: Embedded<{ full_name: string | null; email: string | null }>
  membership_types: Embedded<{ name: string | null }>
}

const syncExpired = async () => {
  await supabase.rpc('sync_membership_status')
}

/** Mensaje único para bloquear asignaciones sin membresía vigente. */
export const NO_ACTIVE_MEMBERSHIP_MESSAGE =
  'No es posible asignar un plan de entrenamiento: el usuario no cuenta con una membresía activa.'

export const membershipsService = {
  // ---- Membership Types ----

  getTypes: async (): Promise<MembershipType[]> => {
    const { data, error } = await supabase
      .from('membership_types')
      .select('*')
      .eq('is_active', true)
      .order('price')

    if (error) throw error
    return (data || []) as MembershipType[]
  },

  /** Crea un tipo de membresía (solo admin por RLS). */
  createType: async (input: {
    name: string
    price: number
    duration_days: number
    description: string | null
  }): Promise<MembershipType> => {
    const { data, error } = await supabase
      .from('membership_types')
      .insert({ ...input, is_active: true })
      .select()
      .single()

    if (error) {
      // Índice único parcial (lower(trim(name)) WHERE is_active).
      if (error.code === '23505') throw new Error('Ya existe una membresía activa con ese nombre.')
      throw error
    }
    return data as MembershipType
  },

  updateType: async (id: string, input: Partial<{
    name: string
    price: number
    duration_days: number
    description: string | null
  }>): Promise<MembershipType> => {
    const { data, error } = await supabase
      .from('membership_types')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') throw new Error('Ya existe una membresía activa con ese nombre.')
      throw error
    }
    return data as MembershipType
  },

  /**
   * Elimina un tipo de membresía. Si ya tiene membresías asociadas la FK
   * (23503) impide el borrado: en ese caso se desactiva para conservar el
   * historial de pagos y membresías.
   */
  deleteType: async (id: string): Promise<'deleted' | 'deactivated'> => {
    const { data, error } = await supabase
      .from('membership_types')
      .delete()
      .eq('id', id)
      .select('id')

    if (error) {
      if (error.code === '23503') {
        const { error: deactivateError } = await supabase
          .from('membership_types')
          .update({ is_active: false })
          .eq('id', id)
        if (deactivateError) throw deactivateError
        return 'deactivated'
      }
      throw error
    }

    if (!data || data.length === 0) {
      throw new Error('No se pudo eliminar: el tipo ya no existe o no tienes permiso.')
    }
    return 'deleted'
  },

  // ---- Memberships ----

  getAll: async (filters?: {
    status?: string
    search?: string
    page?: number
    pageSize?: number
    dateFrom?: string
    dateTo?: string
  }): Promise<{ data: MembershipListItem[]; count: number }> => {
    await syncExpired()
    let query = supabase
      .from('memberships')
      .select(`
        *,
        profiles!member_id(full_name, email),
        membership_types(name)
      `, { count: 'exact' })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.dateFrom) {
      query = query.gte('start_date', filters.dateFrom)
    }
    if (filters?.dateTo) {
      query = query.lte('start_date', filters.dateTo)
    }

    const from = ((filters?.page ?? 1) - 1) * (filters?.pageSize ?? 20)
    const to = from + (filters?.pageSize ?? 20) - 1

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    const now = new Date()
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const items: MembershipListItem[] = ((data ?? []) as MembershipRow[]).map((m) => {
      const [y, mo, d] = m.end_date.split('-').map(Number)
      const endLocal = new Date(y, mo - 1, d)
      const daysRemaining = Math.round((endLocal.getTime() - todayLocal.getTime()) / 86400000)
      return {
        id: m.id,
        member_id: m.member_id,
        member_name: one(m.profiles)?.full_name ?? '—',
        member_email: one(m.profiles)?.email ?? null,
        type_name: one(m.membership_types)?.name ?? '—',
        start_date: m.start_date,
        end_date: m.end_date,
        status: m.status,
        days_remaining: daysRemaining,
        payment_status: null,
      }
    })

    return { data: items, count: count ?? 0 }
  },

  getByMember: async (memberId: string): Promise<MembershipWithType[]> => {
    await syncExpired()
    const { data, error } = await supabase
      .from('memberships')
      .select('*, membership_types(name)')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return ((data ?? []) as (Membership & { membership_types: Embedded<{ name: string | null }> })[])
      .map((m) => ({ ...m, membership_types: one(m.membership_types) }))
  },

  getActiveByMember: async (memberId: string): Promise<Membership | null> => {
    await syncExpired()
    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .eq('member_id', memberId)
      .eq('status', 'active')
      .lte('start_date', new Date().toISOString().split('T')[0])
      .gte('end_date', new Date().toISOString().split('T')[0])
      .maybeSingle()

    if (error) throw error
    return data as Membership | null
  },

  /**
   * Ids (de los recibidos) con membresía vigente hoy: status activo y dentro
   * del rango start_date..end_date. Se usa para filtrar y validar asignaciones.
   * Consulta en lotes para no exceder el largo de URL de PostgREST.
   */
  getActiveMemberIds: async (memberIds: string[]): Promise<Set<string>> => {
    const uniqueIds = [...new Set(memberIds)]
    if (uniqueIds.length === 0) return new Set()
    await syncExpired()
    const today = new Date().toISOString().split('T')[0]
    const activeIds = new Set<string>()

    for (let i = 0; i < uniqueIds.length; i += 50) {
      const batch = uniqueIds.slice(i, i + 50)
      const { data, error } = await supabase
        .from('memberships')
        .select('member_id')
        .in('member_id', batch)
        .eq('status', 'active')
        .lte('start_date', today)
        .gte('end_date', today)

      if (error) throw error
      for (const row of (data ?? []) as { member_id: string }[]) activeIds.add(row.member_id)
    }

    return activeIds
  },

  getActiveWithType: async (memberId: string) => {
    await syncExpired()
    const { data, error } = await supabase
      .from('memberships')
      .select(`*, membership_types(*)`)
      .eq('member_id', memberId)
      .eq('status', 'active')
      .lte('start_date', new Date().toISOString().split('T')[0])
      .gte('end_date', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data as ActiveMembership | null
  },

  update: async (id: string, input: Partial<{
    type_id: string
    start_date: string
    end_date: string
    status: 'active' | 'expired' | 'cancelled'
  }>): Promise<void> => {
    const { error } = await supabase
      .from('memberships')
      .update(input)
      .eq('id', id)
      .select()

    if (error) throw error
  },

  create: async (input: {
    member_id: string
    type_id: string
    start_date: string
    end_date?: string
    status?: 'active' | 'expired' | 'cancelled'
    payment_method?: 'cash' | 'card' | 'transfer' | 'pending'
    /**
     * Clave de idempotencia del intento de creación. Debe ser la misma si el
     * usuario reintenta el mismo intento: el RPC devuelve la membresía ya
     * creada en lugar de insertar otra.
     */
    request_id?: string
  }): Promise<Membership> => {
    const { data, error } = await supabase.rpc('create_membership_with_payment', {
      p_member_id: input.member_id,
      p_type_id: input.type_id,
      p_start_date: input.start_date,
      p_end_date: input.end_date || null,
      p_status: input.status || 'active',
      p_payment_method: input.payment_method || null,
      p_request_id: input.request_id || null,
    })

    if (error) throw error
    return data as Membership
  },

  delete: async (id: string): Promise<void> => {
    const { data, error } = await supabase
      .from('memberships')
      .delete()
      .eq('id', id)
      .select('id')

    if (error) throw error
    if (!data || data.length === 0) {
      throw new Error('La membresía ya no existe o no tienes permiso para eliminarla.')
    }
  },

  getExpiring: async (days: number = 7): Promise<MembershipListItem[]> => {
    await syncExpired()
    const now = new Date()
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const future = new Date(todayLocal)
    future.setDate(future.getDate() + days)

    const today = now.toISOString().split('T')[0]
    const futureDate = future.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('memberships')
      .select(`
        *,
        profiles!member_id(full_name, email),
        membership_types(name)
      `)
      .eq('status', 'active')
      .gte('end_date', today)
      .lte('end_date', futureDate)
      .order('end_date')

    if (error) throw error

    return ((data ?? []) as MembershipRow[]).map((m) => {
      const [y, mo, d] = m.end_date.split('-').map(Number)
      const endLocal = new Date(y, mo - 1, d)
      return {
        id: m.id,
        member_id: m.member_id,
        member_name: one(m.profiles)?.full_name ?? '—',
        member_email: one(m.profiles)?.email ?? null,
        type_name: one(m.membership_types)?.name ?? '—',
        start_date: m.start_date,
        end_date: m.end_date,
        status: m.status,
        days_remaining: Math.round((endLocal.getTime() - todayLocal.getTime()) / 86400000),
        payment_status: null,
      }
    })
  },
}
