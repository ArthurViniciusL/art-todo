import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemePreference } from '../../../shared/theme'

export type SmartView = 'inbox' | 'today' | 'upcoming'

interface UiState {
  view: SmartView
  theme: ThemePreference
  setView: (view: SmartView) => void
  setTheme: (theme: ThemePreference) => void
}

// The theme preference moves to the settings table once the database exists (phase 2).
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      view: 'inbox',
      theme: 'system',
      setView: (view) => set({ view }),
      setTheme: (theme) => set({ theme })
    }),
    { name: 'art-todo-ui', partialize: (state) => ({ theme: state.theme }) }
  )
)
