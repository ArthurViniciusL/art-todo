import { create } from 'zustand'

export type SmartView = 'inbox' | 'today' | 'upcoming'

interface UiState {
  view: SmartView
  setView: (view: SmartView) => void
}

export const useUiStore = create<UiState>()((set) => ({
  view: 'inbox',
  setView: (view) => set({ view })
}))
