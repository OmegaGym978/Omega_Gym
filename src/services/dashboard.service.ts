import { supabase } from '@/lib/supabase'
import { deduplicateProfiles } from './members.service'
import { one, type Embedded } from '@/lib/embed'

export interface DashboardKPIs {
  total_members: number
  active_memberships: number
  expiring_soon: number
  inactive_members: number
  monthly_revenue: number
}

export interface RecentActivityItem {
  id: string
  type: 'check_in' | 'new_member' | 'payment' | 'expired_membership' | 'membership_assigned'
  userName: string
  action: string
  timestamp: string
}

export interface PendingPaymentItem {
  id: string
  member_name: string
  amount: number
  due_date: string
}

export interface ExpiringMembershipItem {
  id: string
  member_name: string
  member_email: string | null
  type_name: string
  end_date: string
  days_remaining: number
}

/* Relaciones embebidas por PostgREST: `one()` normaliza objeto o arreglo. */
interface ProfileEmbed {
  full_name: string | null
  email?: string | null
}

interface MembershipTypeEmbed {
  name: string | null
  price?: number | string | null
}

interface ExpiredMembershipRow {
  id: string
  end_date: string
  profiles: Embedded<ProfileEmbed>
  membership_types: Embedded<MembershipTypeEmbed>
}

interface MembershipAssignmentRow {
  id: string
  created_at: string
  profiles: Embedded<ProfileEmbed>
  membership_types: Embedded<MembershipTypeEmbed>
}

interface ExpiringMembershipRow {
  id: string
  end_date: string | null
  profiles: Embedded<ProfileEmbed>
  membership_types: Embedded<MembershipTypeEmbed>
}

interface CheckInActivityRow {
  id: string
  check_in_time: string
  profiles: Embedded<ProfileEmbed>
}

interface NewMemberRow {
  id: string
  full_name: string
  created_at: string
}

interface PaymentActivityRow {
  id: string
  amount: number | string
  created_at: string
  memberships: Embedded<{
    profiles: Embedded<ProfileEmbed>
    membership_types: Embedded<MembershipTypeEmbed>
  }>
}

interface MembershipTypeDistributionRow {
  type_id: string
  membership_types: Embedded<MembershipTypeEmbed>
}

interface PendingPaymentRow {
  id: string
  amount: number | string
  payment_date: string
  memberships: Embedded<{ profiles: Embedded<ProfileEmbed> }>
}

export const dashboardService = {
  getKPIs: async (): Promise<DashboardKPIs> => {
    await supabase.rpc('sync_membership_status')
    const today = new Date().toISOString().split('T')[0]
    const future = new Date()
    future.setDate(future.getDate() + 7)
    const futureDate = future.toISOString().split('T')[0]

    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const monthStart = `${currentMonth}-01`

    const promises = await Promise.allSettled([
      supabase
        .from('profiles')
        .select('id, full_name, email, alias')
        .eq('role', 'member'),

      supabase
        .from('memberships')
        .select('member_id')
        .eq('status', 'active')
        .lte('start_date', today)
        .gte('end_date', today),

      supabase
        .from('memberships')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .gte('end_date', today)
        .lte('end_date', futureDate),

      supabase
        .from('payments')
        .select('amount')
        .eq('status', 'paid')
        .gte('payment_date', monthStart),
    ])

    const totalMembersResult = promises[0].status === 'fulfilled' ? promises[0].value : { data: null, error: promises[0].reason }
    const activeMembershipsResult = promises[1].status === 'fulfilled' ? promises[1].value : { data: null, error: promises[1].reason }
    const expiringMemberships = promises[2].status === 'fulfilled' ? promises[2].value : { count: null, error: promises[2].reason }
    const monthlyRevenue = promises[3].status === 'fulfilled' ? promises[3].value : { data: null, error: promises[3].reason }

    if (totalMembersResult.error) console.error('KPIs totalMembers query failed:', totalMembersResult.error)
    if (activeMembershipsResult.error) console.error('KPIs activeMemberships query failed:', activeMembershipsResult.error)
    if (expiringMemberships.error) console.error('KPIs expiringMemberships query failed:', expiringMemberships.error)
    if (monthlyRevenue.error) console.error('KPIs monthlyRevenue query failed:', monthlyRevenue.error)

    const dedupedProfiles = deduplicateProfiles(totalMembersResult.data || [])
    const activeMemberIds = new Set(
      ((activeMembershipsResult.data ?? []) as { member_id: string }[]).map((m) => m.member_id)
    )
    const activeMemberships = activeMemberIds.size
    const inactiveMembers = dedupedProfiles.filter(p => !activeMemberIds.has(p.id)).length

    const revenue = ((monthlyRevenue.data ?? []) as { amount: number | string }[]).reduce(
      (sum, p) => sum + Number(p.amount),
      0
    )

    return {
      total_members: dedupedProfiles.length,
      active_memberships: activeMemberships,
      expiring_soon: expiringMemberships.count ?? 0,
      inactive_members: inactiveMembers,
      monthly_revenue: revenue,
    }
  },


  getRecentActivity: async (limit: number = 10): Promise<RecentActivityItem[]> => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]
    const todayStr = new Date().toISOString().split('T')[0]

    const [checkIns, newMembers, expiredMemberships, recentPayments, recentAssignments] = await Promise.all([
      supabase
        .from('check_ins')
        .select('id, check_in_time, profiles!member_id(full_name)')
        .order('check_in_time', { ascending: false })
        .limit(limit),

      supabase
        .from('profiles')
        .select('id, full_name, created_at')
        .eq('role', 'member')
        .order('created_at', { ascending: false })
        .limit(5),

      supabase
        .from('memberships')
        .select(`
          id, end_date,
          profiles!member_id(full_name),
          membership_types(name)
        `)
        .gte('end_date', thirtyDaysAgoStr)
        .lt('end_date', todayStr)
        .order('end_date', { ascending: false })
        .limit(5),

      supabase
        .from('payments')
        .select(`
          id, amount, created_at,
          memberships(
            member_id,
            profiles!member_id(full_name),
            membership_types(name)
          )
        `)
        .eq('status', 'paid')
        .order('created_at', { ascending: false })
        .limit(5),

      supabase
        .from('memberships')
        .select(`
          id, created_at,
          profiles!member_id(full_name),
          membership_types(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    const activities: RecentActivityItem[] = []

    for (const ci of (checkIns.data ?? []) as CheckInActivityRow[]) {
      activities.push({
        id: `check_in-${ci.id}`,
        type: 'check_in',
        userName: one(ci.profiles)?.full_name ?? 'Alguien',
        action: 'registró entrada',
        timestamp: ci.check_in_time,
      })
    }

    for (const nm of (newMembers.data ?? []) as NewMemberRow[]) {
      activities.push({
        id: `new_member-${nm.id}`,
        type: 'new_member',
        userName: nm.full_name,
        action: 'se unió al gimnasio',
        timestamp: nm.created_at,
      })
    }

    for (const em of (expiredMemberships.data ?? []) as ExpiredMembershipRow[]) {
      const typeName = one(em.membership_types)?.name ?? ''
      if (typeName === 'Visita') continue
      activities.push({
        id: `expired_membership-${em.id}`,
        type: 'expired_membership',
        userName: one(em.profiles)?.full_name ?? 'Alguien',
        action: `membresía ${typeName} vencida`,
        timestamp: em.end_date,
      })
    }

    for (const rp of (recentPayments.data ?? []) as PaymentActivityRow[]) {
      const membership = one(rp.memberships)
      activities.push({
        id: `payment-${rp.id}`,
        type: 'payment',
        userName: one(membership?.profiles)?.full_name ?? 'Alguien',
        action: `pagó ${one(membership?.membership_types)?.name ?? 'membresía'} ($${Number(rp.amount).toLocaleString()})`,
        timestamp: rp.created_at,
      })
    }

    for (const ra of (recentAssignments.data ?? []) as MembershipAssignmentRow[]) {
      activities.push({
        id: `membership_assigned-${ra.id}`,
        type: 'membership_assigned',
        userName: one(ra.profiles)?.full_name ?? 'Alguien',
        action: `nueva membresía ${one(ra.membership_types)?.name ?? ''}`,
        timestamp: ra.created_at,
      })
    }

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return activities.slice(0, limit)
  },

  getExpiringMemberships: async (days: number = 7): Promise<ExpiringMembershipItem[]> => {
    await supabase.rpc('sync_membership_status')
    const today = new Date().toISOString().split('T')[0]
    const future = new Date()
    future.setDate(future.getDate() + days)
    const futureDate = future.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('memberships')
      .select(`
        id, end_date,
        profiles!member_id(full_name, email),
        membership_types(name)
      `)
      .eq('status', 'active')
      .gte('end_date', today)
      .lte('end_date', futureDate)
      .order('end_date')

    if (error) throw error
    const now = new Date()
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return ((data ?? []) as ExpiringMembershipRow[])
      .map((m): ExpiringMembershipItem | null => {
        if (!m.end_date) return null
        const [y, mo, d] = m.end_date.split('-').map(Number)
        const endLocal = new Date(y, mo - 1, d)
        return {
          id: m.id,
          member_name: one(m.profiles)?.full_name ?? '—',
          member_email: one(m.profiles)?.email ?? null,
          type_name: one(m.membership_types)?.name ?? '—',
          end_date: m.end_date,
          days_remaining: Math.round((endLocal.getTime() - todayLocal.getTime()) / 86400000),
        }
      })
      .filter((m): m is ExpiringMembershipItem => m !== null && m.days_remaining > 0)
  },

  getMembershipTypeDistribution: async (): Promise<{ name: string; count: number; price: number }[]> => {
    await supabase.rpc('sync_membership_status')
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('memberships')
      .select(`
        type_id,
        membership_types!inner(name, price)
      `)
      .eq('status', 'active')
      .lte('start_date', today)
      .gte('end_date', today)

    if (error) {
      console.error('getMembershipTypeDistribution error:', error)
      return []
    }

    const map = new Map<string, { name: string; count: number; price: number }>()
    for (const m of (data ?? []) as MembershipTypeDistributionRow[]) {
      const id = m.type_id
      const type = one(m.membership_types)
      const entry = map.get(id) || { name: type?.name ?? '—', count: 0, price: Number(type?.price) || 0 }
      entry.count++
      map.set(id, entry)
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  },

  getPendingPayments: async (): Promise<PendingPaymentItem[]> => {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        id, amount, payment_date,
        memberships(
          member_id,
          profiles!member_id(full_name)
        )
      `)
      .eq('status', 'pending')
      .order('payment_date')

    if (error) throw error

    return ((data ?? []) as PendingPaymentRow[]).map((p) => ({
      id: p.id,
      member_name: one(one(p.memberships)?.profiles)?.full_name ?? '—',
      amount: Number(p.amount),
      due_date: p.payment_date,
    }))
  },
}
