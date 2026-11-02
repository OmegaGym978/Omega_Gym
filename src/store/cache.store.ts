import { create } from 'zustand'

interface CacheEntry {
  data: unknown
  timestamp: number
}

interface CacheState {
  entries: Record<string, CacheEntry>
  get: <T>(key: string) => T | null
  set: <T>(key: string, data: T) => void
  invalidate: (key: string) => void
  invalidateAll: () => void
}

const DEFAULT_TTL = 30_000

const TTL: Record<string, number> = {
  dashboard_kpis: 60_000,
  dashboard_pending: 30_000,
  dashboard_expiring: 30_000,
  dashboard_activity: 30_000,
  membership_types: 120_000,
  member_list: 30_000,
}

export const useCacheStore = create<CacheState>((set, get) => ({
  entries: {},

  get: <T>(key: string): T | null => {
    const entry = get().entries[key]
    if (!entry) return null
    const ttl = TTL[key] ?? DEFAULT_TTL
    if (Date.now() - entry.timestamp > ttl) {
      set(state => {
        const entries = { ...state.entries }
        delete entries[key]
        return { entries }
      })
      return null
    }
    return entry.data as T
  },

  set: <T>(key: string, data: T) => {
    set(state => ({
      entries: { ...state.entries, [key]: { data, timestamp: Date.now() } },
    }))
  },

  invalidate: (key: string) => {
    set(state => {
      const entries = { ...state.entries }
      delete entries[key]
      return { entries }
    })
  },

  invalidateAll: () => {
    set({ entries: {} })
  },
}))
