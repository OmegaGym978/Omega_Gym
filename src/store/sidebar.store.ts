import { create } from 'zustand'

interface SidebarStore {
  isOpen: boolean
  open: () => void
  toggle: () => void
  close: () => void
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  close: () => set({ isOpen: false }),
}))
