import { supabase } from '@/lib/supabase'

export interface CheckIn {
  id: string
  member_id: string
  membership_id: string | null
  check_in_time: string
  check_out_time: string | null
  method: 'fingerprint' | 'manual' | 'card'
  device_id: string | null
  notes: string | null
  created_at: string
}

export interface CheckInWithMember extends CheckIn {
  member_name: string
  member_email: string | null
}

export const checkInsService = {
  getByMember: async (memberId: string): Promise<CheckIn[]> => {
    const { data, error } = await supabase
      .from('check_ins')
      .select('*')
      .eq('member_id', memberId)
      .order('check_in_time', { ascending: false })
      .limit(50)

    if (error) throw error
    return (data || []) as CheckIn[]
  },

  /** Total histórico de visitas (sin el límite de 50 de `getByMember`). */
  countByMember: async (memberId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('check_ins')
      .select('id', { count: 'exact', head: true })
      .eq('member_id', memberId)

    if (error) throw error
    return count ?? 0
  },

  /** Fechas de visita desde `sinceISO` (para el gráfico de actividad). */
  getSinceByMember: async (memberId: string, sinceISO: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from('check_ins')
      .select('check_in_time')
      .eq('member_id', memberId)
      .gte('check_in_time', sinceISO)
      .order('check_in_time', { ascending: true })
      .limit(1000)

    if (error) throw error
    return (data || []).map((r: any) => r.check_in_time as string)
  },

  create: async (input: {
    member_id: string
    membership_id?: string
    method?: 'fingerprint' | 'manual' | 'card'
    device_id?: string
    notes?: string
  }) => {
    const { data, error } = await supabase
      .from('check_ins')
      .insert({
        member_id: input.member_id,
        membership_id: input.membership_id || null,
        method: input.method || 'fingerprint',
        device_id: input.device_id || null,
        notes: input.notes || null,
      })
      .select()
      .single()

    if (error) throw error
    return data as CheckIn
  },

  getToday: async (): Promise<CheckInWithMember[]> => {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('check_ins')
      .select(`
        *,
        profiles!member_id(full_name, email)
      `)
      .gte('check_in_time', today)
      .lt('check_in_time', `${today}T23:59:59.999Z`)
      .order('check_in_time', { ascending: false })

    if (error) throw error

    return (data || []).map((c: any) => ({
      ...c,
      member_name: c.profiles?.full_name ?? '—',
      member_email: c.profiles?.email ?? null,
    }))
  },
}
