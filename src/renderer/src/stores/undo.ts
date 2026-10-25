import { create } from 'zustand'

interface UndoEntry {
  label: string
  undo: () => void
}

interface UndoState {
  entries: UndoEntry[]
  push: (label: string, undo: () => void) => () => void
  /** Undoes the latest action. Returns its label, or null when there is nothing to undo. */
  undoLast: () => string | null
}

const MAX_ENTRIES = 50

/**
 * Session-only undo history for Ctrl+Z. `push` returns a run-once undo function, so a toast's
 * "Desfazer" button and Ctrl+Z can share an entry without undoing twice.
 */
export const useUndoStore = create<UndoState>()((set, get) => ({
  entries: [],
  push: (label, undo) => {
    let isDone = false
    const entry: UndoEntry = {
      label,
      undo: () => {
        if (isDone) return
        isDone = true
        set((state) => ({ entries: state.entries.filter((item) => item !== entry) }))
        undo()
      }
    }
    set((state) => ({ entries: [...state.entries, entry].slice(-MAX_ENTRIES) }))
    return entry.undo
  },
  undoLast: () => {
    const entry = get().entries.at(-1)
    if (!entry) return null
    entry.undo()
    return entry.label
  }
}))
