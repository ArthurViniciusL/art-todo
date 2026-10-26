import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SmartView } from '../../../shared/domain'

export type { SmartView }

/** Right-click menu of a task, at viewport coordinates. */
export interface TaskContextMenuState {
  taskId: number
  x: number
  y: number
}

/** What the content area shows. `null` means the Inbox. */
export type Selection = { kind: 'list'; listId: number } | { kind: 'view'; view: SmartView } | null

interface UiState {
  selection: Selection
  /** Task whose edit modal is open. */
  editingTaskId: number | null
  /** Task whose title is being edited inline. */
  renamingTaskId: number | null
  taskContextMenu: TaskContextMenuState | null
  /** Done tasks that stay in place for a moment before moving to "Concluídas". */
  recentlyDone: ReadonlySet<number>
  /** Wide windows: sidebar shown as a narrow icon rail. Saved between sessions. */
  isSidebarCollapsed: boolean
  /** Narrow windows: sidebar open as an overlay drawer. */
  isDrawerOpen: boolean
  isPaletteOpen: boolean
  isExportOpen: boolean
  isCreatingList: boolean
  /** Bumped to ask the visible quick add field to take focus. */
  quickAddFocusRequest: number
  select: (selection: Selection) => void
  openTask: (id: number | null) => void
  renameTask: (id: number | null) => void
  setTaskContextMenu: (menu: TaskContextMenuState | null) => void
  setRecentlyDone: (id: number, isRecent: boolean) => void
  setSidebarCollapsed: (isCollapsed: boolean) => void
  setDrawerOpen: (isOpen: boolean) => void
  setPaletteOpen: (isOpen: boolean) => void
  setExportOpen: (isOpen: boolean) => void
  setCreatingList: (isCreating: boolean) => void
  focusQuickAdd: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      selection: null,
      editingTaskId: null,
      renamingTaskId: null,
      taskContextMenu: null,
      recentlyDone: new Set(),
      isSidebarCollapsed: false,
      isDrawerOpen: false,
      isPaletteOpen: false,
      isExportOpen: false,
      isCreatingList: false,
      quickAddFocusRequest: 0,
      select: (selection) => set({ selection, renamingTaskId: null }),
      openTask: (editingTaskId) => set({ editingTaskId }),
      renameTask: (renamingTaskId) => set({ renamingTaskId }),
      setTaskContextMenu: (taskContextMenu) => set({ taskContextMenu }),
      setSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }),
      setDrawerOpen: (isDrawerOpen) => set({ isDrawerOpen }),
      setPaletteOpen: (isPaletteOpen) => set({ isPaletteOpen }),
      setExportOpen: (isExportOpen) => set({ isExportOpen }),
      setCreatingList: (isCreatingList) => set({ isCreatingList }),
      focusQuickAdd: () =>
        set((state) => ({ quickAddFocusRequest: state.quickAddFocusRequest + 1 })),
      setRecentlyDone: (id, isRecent) =>
        set((state) => {
          const recentlyDone = new Set(state.recentlyDone)
          if (isRecent) recentlyDone.add(id)
          else recentlyDone.delete(id)
          return { recentlyDone }
        })
    }),
    {
      // Only the sidebar preference is a per-device convenience worth keeping.
      name: 'art-todo-ui',
      partialize: (state) => ({ isSidebarCollapsed: state.isSidebarCollapsed })
    }
  )
)
