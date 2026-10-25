import { create } from 'zustand'
import type { SmartView } from '../../../shared/domain'

export type { SmartView }

/** What the content area shows. `null` means the Inbox. */
export type Selection = { kind: 'list'; listId: number } | { kind: 'view'; view: SmartView } | null

interface UiState {
  selection: Selection
  /** Task whose edit modal is open. */
  editingTaskId: number | null
  /** Task whose title is being edited inline. */
  renamingTaskId: number | null
  /** Done tasks that stay in place for a moment before moving to "Concluídas". */
  recentlyDone: ReadonlySet<number>
  select: (selection: Selection) => void
  openTask: (id: number | null) => void
  renameTask: (id: number | null) => void
  setRecentlyDone: (id: number, isRecent: boolean) => void
}

export const useUiStore = create<UiState>()((set) => ({
  selection: null,
  editingTaskId: null,
  renamingTaskId: null,
  recentlyDone: new Set(),
  select: (selection) => set({ selection, renamingTaskId: null }),
  openTask: (editingTaskId) => set({ editingTaskId }),
  renameTask: (renamingTaskId) => set({ renamingTaskId }),
  setRecentlyDone: (id, isRecent) =>
    set((state) => {
      const recentlyDone = new Set(state.recentlyDone)
      if (isRecent) recentlyDone.add(id)
      else recentlyDone.delete(id)
      return { recentlyDone }
    })
}))
