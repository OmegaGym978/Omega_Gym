import { create } from 'zustand'

export type AccentKey = 'coral' | 'ember' | 'violet' | 'teal' | 'lime' | 'amber'

export interface AccentPreset {
  key: AccentKey
  label: string
  color: string
}

/** El acento por defecto es el rojo/coral original del proyecto. */
export const ACCENT_PRESETS: AccentPreset[] = [
  { key: 'coral', label: 'Coral', color: '#e85d5d' },
  { key: 'ember', label: 'Ember', color: '#f4511e' },
  { key: 'violet', label: 'Violeta', color: '#a78bfa' },
  { key: 'teal', label: 'Turquesa', color: '#2dd4bf' },
  { key: 'lime', label: 'Lima', color: '#a3e635' },
  { key: 'amber', label: 'Ámbar', color: '#f59e0b' },
]

const STORAGE_KEY = 'omega-gym-accent'

function isAccentKey(value: string | null): value is AccentKey {
  return !!value && ACCENT_PRESETS.some(preset => preset.key === value)
}

function getInitialAccent(): AccentKey {
  if (typeof localStorage === 'undefined') return 'coral'
  const stored = localStorage.getItem(STORAGE_KEY)
  return isAccentKey(stored) ? stored : 'coral'
}

const initialAccent = getInitialAccent()
document.documentElement.dataset.accent = initialAccent

interface AccentState {
  accent: AccentKey
  setAccent: (accent: AccentKey) => void
}

export const useAccentStore = create<AccentState>((set) => ({
  accent: initialAccent,
  setAccent: (accent) => {
    localStorage.setItem(STORAGE_KEY, accent)
    document.documentElement.dataset.accent = accent
    set({ accent })
  },
}))
