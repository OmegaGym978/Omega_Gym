import { create } from 'zustand'

export type AccentKey = 'coral' | 'ember' | 'lime' | 'violet' | 'pink' | 'amber'

export interface AccentPreset {
  key: AccentKey
  label: string
  color: string
  /** Contraste del texto/palomita sobre el color. */
  contrast: string
}

/** El acento por defecto es el rojo/coral original del proyecto. */
export const ACCENT_PRESETS: AccentPreset[] = [
  { key: 'coral', label: 'Rojo coral', color: '#FF4F4F', contrast: '#FFFFFF' },
  { key: 'ember', label: 'Naranja atardecer', color: '#FF9F0A', contrast: '#09090B' },
  { key: 'lime', label: 'Verde neón', color: '#32D74B', contrast: '#09090B' },
  { key: 'violet', label: 'Morado brillante', color: '#BF5AF2', contrast: '#FFFFFF' },
  { key: 'pink', label: 'Rosa neón', color: '#FF375F', contrast: '#FFFFFF' },
  { key: 'amber', label: 'Amarillo vibrante', color: '#FFD60A', contrast: '#09090B' },
]

const STORAGE_KEY = 'omega-gym-accent'

function isAccentKey(value: string | null): value is AccentKey {
  return !!value && ACCENT_PRESETS.some(preset => preset.key === value)
}

function getInitialAccent(): AccentKey {
  if (typeof localStorage === 'undefined') return 'coral'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (isAccentKey(stored)) return stored
  // Preset retirado (azul/cian): se limpia para no volver a evaluarlo en cada carga.
  if (stored) localStorage.removeItem(STORAGE_KEY)
  return 'coral'
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
