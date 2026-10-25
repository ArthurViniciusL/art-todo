import { useEffect } from 'react'
import type { List, SmartView, ViewMode } from '../../../shared/domain'
import { viewModeFromShortcut } from '../view-modes'
import { useSetListViewMode, useSetSmartViewMode, useSmartViewMode } from './queries'

type Source = { list: List } | { view: SmartView }

/** The saved view mode of a list or smart view, a setter, and the Ctrl+Shift+1/2/3 shortcuts. */
export function useViewMode(source: Source): [ViewMode, (mode: ViewMode) => void] {
  const view = 'view' in source ? source.view : 'today'
  const { data: smartMode = 'list' } = useSmartViewMode(view)
  const { mutate: setListMode } = useSetListViewMode()
  const { mutate: setSmartMode } = useSetSmartViewMode()

  const mode = 'list' in source ? source.list.viewMode : smartMode
  const listId = 'list' in source ? source.list.id : undefined

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const next = viewModeFromShortcut(event)
      if (!next) return
      event.preventDefault()
      if (listId !== undefined) setListMode({ id: listId, viewMode: next })
      else setSmartMode({ view, viewMode: next })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [listId, view, setListMode, setSmartMode])

  const setMode = (next: ViewMode): void => {
    if (listId !== undefined) setListMode({ id: listId, viewMode: next })
    else setSmartMode({ view, viewMode: next })
  }
  return [mode, setMode]
}
