import { supabase } from '@/lib/supabase'
import { one, type Embedded } from '@/lib/embed'

function escapeSearch(s: string): string {
  return s.replace(/[%_\\]/g, '\\$&')
}

export interface Payment {
  id: string
  membership_id: string
  amount: number
  payment_date: string
  method: 'cash' | 'card' | 'transfer'
  status: 'paid' | 'pending' | 'cancelled'
  notes: string | null
  created_at: string
  concept?: string
}

export interface PaymentListItem {
  id: string
  member_id: string
  member_name: string
  member_email: string | null
  concept: string
  amount: number
  expected_amount: number | null
  date: string
  method: 'cash' | 'card' | 'transfer'
  status: 'paid' | 'pending' | 'cancelled'
}

export interface PaymentFilters {
  search?: string
  status?: string
  method?: string
  page?: number
  pageSize?: number
  dateFrom?: string
  dateTo?: string
}

export interface RevenueSummary {
  total_collected: number
  total_pending: number
  total_cancelled: number
  today_collected: number
}

/* Relaciones embebidas por PostgREST: `one()` normaliza objeto o arreglo. */
interface PaymentRow {
  id: string
  amount: number
  payment_date: string
  method: PaymentListItem['method']
  status: PaymentListItem['status']
  memberships: Embedded<{
    member_id: string
    profiles: Embedded<{ full_name: string | null; email: string | null }>
    membership_types: Embedded<{ name: string | null; price: number | string | null }>
  }>
}

type PaymentWithType = Payment & {
  memberships?: Embedded<{ membership_types: Embedded<{ name: string | null }> }>
}

export const paymentsService = {
  getAll: async (filters?: PaymentFilters): Promise<{ data: PaymentListItem[]; count: number }> => {
    let membershipFilter: string[] | null = null

    if (filters?.search) {
      const escaped = escapeSearch(filters.search)
      const { data: matchingMembers } = await supabase
        .from('profiles')
        .select('id')
        .or(`full_name.ilike.%${escaped}%,email.ilike.%${escaped}%`)
      const memberIds = (matchingMembers || []).map(m => m.id)
      if (memberIds.length === 0) return { data: [], count: 0 }
      const { data: matchingMemberships } = await supabase
        .from('memberships')
        .select('id')
        .in('member_id', memberIds)
      membershipFilter = (matchingMemberships || []).map(m => m.id)
      if (membershipFilter.length === 0) return { data: [], count: 0 }
    }

    let query = supabase
      .from('payments')
      .select(`
        *,
        memberships(
          member_id,
          profiles!member_id(full_name, email),
          membership_types(name, price)
        )
      `, { count: 'exact' })

    if (membershipFilter) {
      query = query.in('membership_id', membershipFilter)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.method) {
      query = query.eq('method', filters.method)
    }

    if (filters?.dateFrom) {
      query = query.gte('payment_date', filters.dateFrom)
    }

    if (filters?.dateTo) {
      query = query.lte('payment_date', filters.dateTo)
    }

    const pageSize = filters?.pageSize ?? 20
    const from = ((filters?.page ?? 1) - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await query
      .order('payment_date', { ascending: false })
      .range(from, to)

    if (error) throw error

    return {
      data: ((data ?? []) as PaymentRow[]).map((p) => {
        const membership = one(p.memberships)
        const typePrice = one(membership?.membership_types)?.price
        return {
          id: p.id,
          member_id: membership?.member_id ?? '',
          member_name: one(membership?.profiles)?.full_name ?? '—',
          member_email: one(membership?.profiles)?.email ?? null,
          concept: `${one(membership?.membership_types)?.name ?? 'Membresía'}`,
          amount: p.amount,
          expected_amount: typePrice != null ? Number(typePrice) : null,
          date: p.payment_date,
          method: p.method,
          status: p.status,
        }
      }),
      count: count ?? 0,
    }
  },

  getRevenueInRange: async (dateFrom: string, dateTo: string): Promise<{ collected: number; pending: number }> => {
    const [paid, pending] = await Promise.all([
      supabase
        .from('payments')
        .select('amount')
        .eq('status', 'paid')
        .gte('payment_date', dateFrom)
        .lte('payment_date', dateTo),
      supabase
        .from('payments')
        .select('amount')
        .eq('status', 'pending')
        .gte('payment_date', dateFrom)
        .lte('payment_date', dateTo),
    ])
    const sum = (arr: { amount: number | string }[] | null) =>
      (arr || []).reduce((acc, p) => acc + Number(p.amount), 0)
    return {
      collected: sum(paid.data),
      pending: sum(pending.data),
    }
  },

  getRevenueSummary: async (dateFrom?: string, dateTo?: string): Promise<RevenueSummary> => {
    const today = new Date().toISOString().split('T')[0]

    const buildQuery = (status: string) => {
      let q = supabase
        .from('payments')
        .select('amount')
        .eq('status', status)
      if (dateFrom) q = q.gte('payment_date', dateFrom)
      if (dateTo) q = q.lte('payment_date', dateTo)
      return q
    }

    const promises = await Promise.allSettled([
      buildQuery('paid'),
      buildQuery('pending'),
      buildQuery('cancelled'),

      supabase
        .from('payments')
        .select('amount')
        .eq('status', 'paid')
        .eq('payment_date', today),
    ])

    const collected = promises[0].status === 'fulfilled' ? promises[0].value : { data: null, error: promises[0].reason }
    const pending = promises[1].status === 'fulfilled' ? promises[1].value : { data: null, error: promises[1].reason }
    const cancelled = promises[2].status === 'fulfilled' ? promises[2].value : { data: null, error: promises[2].reason }
    const todayCollected = promises[3].status === 'fulfilled' ? promises[3].value : { data: null, error: promises[3].reason }

    if (collected.error) console.error('Revenue collected query failed:', collected.error)
    if (pending.error) console.error('Revenue pending query failed:', pending.error)
    if (cancelled.error) console.error('Revenue cancelled query failed:', cancelled.error)
    if (todayCollected.error) console.error('Revenue todayCollected query failed:', todayCollected.error)

    const sum = (arr: { amount: number | string }[] | null) =>
      (arr || []).reduce((acc, p) => acc + Number(p.amount), 0)

    return {
      total_collected: sum(collected.data),
      total_pending: sum(pending.data),
      total_cancelled: sum(cancelled.data),
      today_collected: sum(todayCollected.data),
    }
  },

  create: async (input: {
    membership_id: string
    amount: number
    payment_date: string
    method: 'cash' | 'card' | 'transfer'
    status: 'paid' | 'pending' | 'cancelled'
    notes?: string
  }): Promise<Payment> => {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        membership_id: input.membership_id,
        amount: input.amount,
        payment_date: input.payment_date,
        method: input.method,
        status: input.status,
        notes: input.notes || null,
      })
      .select()
      .single()

    if (error) throw error
    return data as Payment
  },

  update: async (id: string, input: {
    status?: 'paid' | 'pending' | 'cancelled'
    notes?: string
  }): Promise<Payment> => {
    const { data, error } = await supabase
      .from('payments')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Payment
  },

  updateAmountByMembership: async (membershipId: string, amount: number): Promise<void> => {
    const { error } = await supabase
      .from('payments')
      .update({ amount })
      .eq('membership_id', membershipId);

    if (error) throw error
  },

  getPendingCount: async (): Promise<number> => {
    const { count, error } = await supabase
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (error) throw error
    return count ?? 0
  },

  getByMember: async (memberId: string): Promise<Payment[]> => {
    const { data: memberships } = await supabase
      .from('memberships')
      .select('id')
      .eq('member_id', memberId)

    if (!memberships?.length) return []

    const ids = memberships.map(m => m.id)

    const { data, error } = await supabase
      .from('payments')
      .select(`*,
        memberships!inner(membership_types!inner(name))
      `)
      .in('membership_id', ids)
      .order('payment_date', { ascending: false })

    if (error) throw error
    return ((data ?? []) as PaymentWithType[]).map((p): Payment => {
      const { memberships, ...rest } = p
      return {
        ...rest,
        concept: one(one(memberships)?.membership_types)?.name ?? undefined,
      }
    })
  },

  getMonthlyRevenue: async (year?: number): Promise<{ month: number; amount: number }[]> => {
    const y = year || new Date().getFullYear()
    const startDate = `${y}-01-01`
    const endDate = `${y}-12-31`

    const { data, error } = await supabase
      .from('payments')
      .select('amount, payment_date')
      .eq('status', 'paid')
      .gte('payment_date', startDate)
      .lte('payment_date', endDate)

    if (error) throw error

    const months = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, amount: 0 }))
    for (const p of data || []) {
      const m = new Date(p.payment_date).getMonth()
      months[m].amount += Number(p.amount)
    }

    return months
  },
}
