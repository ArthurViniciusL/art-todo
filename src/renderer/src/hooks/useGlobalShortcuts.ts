import { toast } from '@heroui/react'
import { useEffect } from 'react'
import { useUiStore } from '../stores/ui'
import { isCompactLayout } from './useCompactLayout'
import { useUndoStore } from '../stores/undo'
import { useNavTargets, useStartNewTask } from './useNavigation'

const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

// Toasts are alertdialogs inside the toast region; they must not block shortcuts.
const isDialogOpen = (): boolean =>
  Array.from(document.querySelectorAll('[role=dialog], [role=alertdialog]')).some(
    (element) => !element.closest('[role=region]')
  )

/**
 * App-wide keys: Ctrl+K palette, Ctrl+E export, Ctrl+B sidebar, Ctrl+Z undo, N new task,
 * Ctrl+1..9 navigation.
 */
export function useGlobalShortcuts(): void {
  const targets = useNavTargets()
  const select = useUiStore((state) => state.select)
  const setPaletteOpen = useUiStore((state) => state.setPaletteOpen)
  const setExportOpen = useUiStore((state) => state.setExportOpen)
  const undoLast = useUndoStore((state) => state.undoLast)
  const startNewTask = useStartNewTask()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented) return
      const ctrl = event.ctrlKey || event.metaKey
      const plain = !ctrl && !event.altKey && !event.shiftKey

      if (ctrl && !event.shiftKey && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen(!useUiStore.getState().isPaletteOpen)
        return
      }
      if (ctrl && !event.shiftKey && event.key.toLowerCase() === 'e') {
        event.preventDefault()
        if (!isDialogOpen()) setExportOpen(true)
        return
      }
      if (ctrl && !event.shiftKey && event.key.toLowerCase() === 'b') {
        event.preventDefault()
        const state = useUiStore.getState()
        if (isCompactLayout()) state.setDrawerOpen(!state.isDrawerOpen)
        else state.setSidebarCollapsed(!state.isSidebarCollapsed)
        return
      }
      if (isTyping(event.target) || isDialogOpen()) return

      if (ctrl && !event.shiftKey && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        const label = undoLast()
        if (label) toast('Desfeito', { description: label, timeout: 2500 })
        return
      }
      const digit = /^Digit([1-9])$/.exec(event.code)
      if (ctrl && !event.shiftKey && !event.altKey && digit) {
        const target = targets[Number(digit[1]) - 1]
        if (target) {
          event.preventDefault()
          select(target.selection)
        }
        return
      }
      if (plain && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        startNewTask()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [targets, select, setPaletteOpen, setExportOpen, undoLast, startNewTask])
}
