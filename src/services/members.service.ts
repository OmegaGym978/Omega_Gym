import { supabase } from '@/lib/supabase'
import { one, type Embedded } from '@/lib/embed'

function escapeSearch(s: string): string {
  return s.replace(/[%_\\]/g, '\\$&')
}

export interface Member {
  id: string
  email: string | null
  full_name: string
  alias: string | null
  phone: string | null
  avatar_url: string | null
  role: 'admin' | 'trainer' | 'member'
  is_active: boolean
  auth_user_id: string | null
  registration_status: 'pending' | 'claimed' | 'registered'
  created_at: string
  updated_at: string
}

export interface MemberListItem {
  id: string
  full_name: string
  alias: string | null
  email: string | null
  phone: string | null
  role: 'admin' | 'trainer' | 'member'
  is_active: boolean
  registration_status: 'pending' | 'claimed' | 'registered'
  membership_type: string | null
  membership_end: string | null
  plan_names: string[]
  created_at: string
}

export interface MemberFilters {
  search?: string
  role?: string
  status?: 'active' | 'inactive'
  registration?: 'pending' | 'claimed' | 'registered'
  page?: number
  pageSize?: number
  /** Solo socios sin membresía activa vigente (exclusión evaluada en SQL). */
  withoutActiveMembership?: boolean
  /** Id que se fuerza a la primera posición antes de paginar (estado temporal de la vista). */
  pinnedId?: string
}

type ProfileRole = 'admin' | 'trainer' | 'member'
type RegistrationStatus = 'pending' | 'claimed' | 'registered'

/** Membresía embebida en el select de `profiles`. */
interface MembershipEmbed {
  status: string
  end_date: string
  membership_types: Embedded<{ name: string }>
}

/**
 * Fila de `profiles` con las relaciones embebidas que devuelve Supabase.
 * Se declara a mano porque el cliente aún no usa tipos generados.
 */
interface ProfileRow {
  id: string
  full_name: string
  alias: string | null
  email: string | null
  phone: string | null
  role: ProfileRole
  is_active: boolean
  registration_status: RegistrationStatus | null
  created_at: string
  memberships?: MembershipEmbed[] | null
  training_plans?: { name: string | null }[] | null
  plan_assignments?: { plan: Embedded<{ name: string | null }> }[] | null
}

function toMemberListItem(raw: ProfileRow): MemberListItem {
  const valid = (raw.memberships ?? []).filter((m) => one(m.membership_types)?.name !== 'Visita')
  const membership = valid.find((m) => m.status === 'active') ?? null
  const legacyPlans = (raw.training_plans ?? []).map((p) => p.name).filter((n): n is string => Boolean(n))
  const assignedPlans = (raw.plan_assignments ?? [])
    .map((a) => one(a.plan)?.name)
    .filter((n): n is string => Boolean(n))
  return {
    id: raw.id,
    full_name: raw.full_name,
    alias: raw.alias,
    email: raw.email,
    phone: raw.phone,
    role: raw.role,
    is_active: raw.is_active,
    registration_status: raw.registration_status ?? 'registered',
    membership_type: one(membership?.membership_types)?.name ?? null,
    membership_end: membership?.end_date ?? null,
    plan_names: Array.from(new Set([...legacyPlans, ...assignedPlans])),
    created_at: raw.created_at,
  }
}

interface ProfileIdentity {
  id: string
  full_name: string
  email?: string | null
  alias?: string | null
}

export function deduplicateProfiles<T extends ProfileIdentity>(rows: T[]): T[] {
  const seen = new Map<string, T>()
  for (const row of rows) {
    if (!row.email) {
      seen.set(row.id, row)
      continue
    }
    const key = `${row.full_name}|${row.email}`.toLowerCase()
    const existing = seen.get(key)
    if (!existing) {
      seen.set(key, row)
    } else if (row.alias && !existing.alias) {
      seen.set(key, row)
    }
  }
  return Array.from(seen.values())
}

/**
 * Columnas y relaciones que consume la UI. Evita `select('*')` y trae
 * membresías y planes asignados en la misma llamada (sin consultas N+1).
 */
const PROFILE_SELECT = `
  id, full_name, alias, email, phone, role, is_active, registration_status, created_at,
  memberships(status, end_date, membership_types(name)),
  training_plans!assigned_to(name),
  plan_assignments(plan:training_plans(name))
`

function chunked<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

/** ¿La fila fijada cumple los filtros activos? (no mostrarla fuera de filtro). */
function matchesListFilters(row: ProfileRow, filters?: MemberFilters): boolean {
  if (!filters) return true
  if (filters.role && row.role !== filters.role) return false
  if (filters.status === 'active' && !row.is_active) return false
  if (filters.status === 'inactive' && row.is_active) return false
  if (filters.registration && (row.registration_status ?? 'registered') !== filters.registration) return false
  if (filters.search) {
    const q = filters.search.toLowerCase()
    const haystack = `${row.full_name} ${row.email ?? ''} ${row.phone ?? ''}`.toLowerCase()
    if (!haystack.includes(q)) return false
  }
  return true
}

export const membersService = {
  /**
   * Marca vencidas/activas las membresías según la fecha. Se llama una vez por
   * visita a la pantalla (no en cada búsqueda: son dos UPDATE y un round-trip).
   */
  syncStatuses: async (): Promise<void> => {
    await supabase.rpc('sync_membership_status')
  },

  getAll: async (filters?: MemberFilters): Promise<{ data: MemberListItem[]; count: number }> => {
    const page = Math.max(1, filters?.page ?? 1)
    const pageSize = Math.max(1, filters?.pageSize ?? 20)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Exclusión server-side de socios con membresía activa (no "Visita"),
    // la misma condición que valida el RPC create_membership_with_payment.
    let excludedIds: string[] = []
    if (filters?.withoutActiveMembership) {
      const { data: activeRows } = await supabase
        .from('memberships')
        .select('member_id, membership_types!inner(name)')
        .eq('status', 'active')
        .neq('membership_types.name', 'Visita')
      excludedIds = Array.from(
        new Set(((activeRows ?? []) as { member_id: string }[]).map((r) => r.member_id))
      )
    }

    let query = supabase
      .from('profiles')
      .select(PROFILE_SELECT, { count: 'exact' })
      // Los perfiles `claimed` son residuos del flujo de vinculación: su gemelo
      // `registered` es el que tiene la cuenta y la membresía. Si no se ocultan,
      // se cuelan como "sin membresía" aunque su gemelo tenga una activa.
      .neq('registration_status', 'claimed')

    if (filters?.search) {
      const escaped = escapeSearch(filters.search)
      query = query.ilike('full_name', `%${escaped}%`)
    }

    if (filters?.role) {
      query = query.eq('role', filters.role)
    }

    if (filters?.status === 'active') {
      query = query.eq('is_active', true)
    } else if (filters?.status === 'inactive') {
      query = query.eq('is_active', false)
    }

    if (filters?.registration) {
      query = query.eq('registration_status', filters.registration)
    }

    // `not in` en trozos para no exceder el largo de la URL de PostgREST.
    for (const chunk of chunked(excludedIds, 100)) {
      query = query.not('id', 'in', `(${chunk.join(',')})`)
    }

    const { data, error, count } = await query
      .order('full_name', { ascending: true })
      .range(from, to)

    if (error) throw error

    let rows = (data ?? []) as unknown as ProfileRow[]

    // El registro recién creado/editado se antepone aunque no caiga en esta
    // página (se pide aparte y se respeta el tamaño de página).
    const pinnedId = filters?.pinnedId
    if (pinnedId && !rows.some((r) => r.id === pinnedId)) {
      const { data: pinnedRow } = await supabase
        .from('profiles')
        .select(PROFILE_SELECT)
        .eq('id', pinnedId)
        .maybeSingle()
      if (pinnedRow && matchesListFilters(pinnedRow as ProfileRow, filters)) {
        rows = [pinnedRow as ProfileRow, ...rows].slice(0, pageSize)
      }
    }

    const deduped = deduplicateProfiles<ProfileRow>(rows)

    return {
      data: deduped.map(toMemberListItem),
      count: count ?? 0,
    }
  },

  getById: async (id: string): Promise<MemberListItem> => {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('id', id)
      .single()

    if (error) throw error
    return toMemberListItem(data as ProfileRow)
  },

  create: async (input: {
    full_name: string
    role?: 'admin' | 'trainer' | 'member'
  }) => {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        full_name: input.full_name,
        role: input.role || 'member',
        registration_status: 'pending',
        auth_user_id: null,
      })
      .select()
      .single()

    if (error) throw error
    return data as Member
  },

  linkPendingProfile: async (pendingId: string, registeredId: string) => {
    const { data: registered, error: errR } = await supabase
      .from('profiles')
      .select('auth_user_id, email, phone, full_name')
      .eq('id', registeredId)
      .single()
    if (errR || !registered) throw new Error('No se encontró un usuario registrado con esos datos.')
    if (!registered.auth_user_id) throw new Error('El perfil del usuario no tiene una cuenta de autenticación vinculada.')

    const { data: pending } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', pendingId)
      .single()

    const { error: err1 } = await supabase.from('profiles').update({
      auth_user_id: registered.auth_user_id,
      full_name: registered.full_name,
      email: registered.email,
      phone: registered.phone,
      alias: pending?.full_name ?? null,
      registration_status: 'registered',
    }).eq('id', pendingId)
    if (err1) throw err1

    const { error: err2 } = await supabase.from('profiles').update({
      auth_user_id: null,
      registration_status: 'claimed',
    }).eq('id', registeredId)
    if (err2) throw err2

    await Promise.all([
      supabase.from('memberships').update({ member_id: pendingId }).eq('member_id', registeredId),
      supabase.from('training_plans').update({ assigned_to: pendingId }).eq('assigned_to', registeredId),
      supabase.from('check_ins').update({ member_id: pendingId }).eq('member_id', registeredId),
    ])

    const { error: errLink } = await supabase.from('auth_links').insert({
      profile_id: pendingId,
      auth_user_id: registered.auth_user_id,
      registered_profile_id: registeredId,
      status: 'linked',
    })
    if (errLink) throw errLink
  },

  unlink: async (id: string) => {
    const { error } = await supabase.rpc('unlink_profile_auth', {
      p_profile_id: id,
    })
    if (error) throw new Error(error.message)
  },

  getUnlinkedCandidates: async (search?: string): Promise<{
    id: string
    full_name: string
    alias: string | null
    email: string | null
    phone: string | null
    created_at: string
  }[]> => {
    const { data: links } = await supabase
      .from('auth_links')
      .select('profile_id')
      .eq('status', 'linked')
    const linkedIds = (links || []).map(l => l.profile_id)

    let query = supabase
      .from('profiles')
      .select('id, full_name, alias, email, phone, created_at')
      .not('auth_user_id', 'is', null)
      .eq('registration_status', 'registered')

    if (linkedIds.length > 0) {
      query = query.filter('id', 'not.in', `(${linkedIds.join(',')})`)
    }

    if (search) {
      const escaped = escapeSearch(search)
      query = query.or(
        `full_name.ilike.%${escaped}%,email.ilike.%${escaped}%,phone.ilike.%${escaped}%`
      )
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return (data || []) as {
      id: string
      full_name: string
      alias: string | null
      email: string | null
      phone: string | null
      created_at: string
    }[]
  },

  update: async (id: string, input: Partial<{
    full_name: string
    email: string | null
    phone: string | null
    avatar_url: string
    alias: string
    role: 'admin' | 'trainer' | 'member'
  }>) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Member
  },

  toggleActive: async (id: string, active: boolean) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: active })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Member
  },

  remove: async (id: string) => {
    const { data: profile, error: fetchErr } = await supabase
      .from('profiles')
      .select('auth_user_id, alias')
      .eq('id', id)
      .single()

    if (fetchErr || !profile) throw new Error('No se encontró el perfil.')

    await supabase
      .from('auth_links')
      .update({ status: 'unlinked', unlinked_at: new Date().toISOString() })
      .eq('profile_id', id)
      .eq('status', 'linked')

    const { error: updErr } = await supabase
      .from('profiles')
      .update({
        auth_user_id: null,
        full_name: profile.alias || undefined,
        alias: null,
        email: null,
        phone: null,
        registration_status: 'pending',
        is_active: true,
      })
      .eq('id', id)

    if (updErr) throw updErr

    await supabase.rpc('cleanup_orphan_auth_users')
  },

  hardDelete: async (id: string) => {
    const { error } = await supabase.rpc('hard_delete_member', {
      p_profile_id: id,
    })
    if (error) throw new Error(error.message)
  },

  getPendingMembers: async (): Promise<MemberListItem[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('registration_status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(toMemberListItem)
  },
    getStats: async () => {
    const { data: allProfiles, error: err1 } = await supabase
      .from('profiles')
      .select('id, full_name, email, alias, registration_status')
      .eq('role', 'member')
      // Mismos perfiles que lista la vista (sin residuos `claimed`).
      .neq('registration_status', 'claimed')

    if (err1) throw err1

    const deduped = deduplicateProfiles(allProfiles || [])
    const total = deduped.length

    const pending = deduped.filter(p => p.registration_status === 'pending').length

    const { data: activeData, error: err2 } = await supabase
      .from('memberships')
      .select('member_id')
      .eq('status', 'active')

    if (err2) throw err2

    const activeIds = new Set(((activeData ?? []) as { member_id: string }[]).map((m) => m.member_id))
    const active = deduped.filter(p => activeIds.has(p.id)).length
    const inactive = deduped.filter(p => !activeIds.has(p.id) && p.registration_status !== 'pending').length

    return { total, active, pending, inactive }
  },
}
