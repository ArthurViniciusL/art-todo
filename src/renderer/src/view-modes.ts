import { Columns3, LayoutGrid, List, type LucideIcon } from 'lucide-react'
import type { ViewMode } from '../../shared/domain'

export const VIEW_MODE_META: Record<
  ViewMode,
  { label: string; icon: LucideIcon; shortcut: string }
> = {
  list: { label: 'Lista', icon: List, shortcut: 'Ctrl+Shift+1' },
  cards: { label: 'Cards', icon: LayoutGrid, shortcut: 'Ctrl+Shift+2' },
  columns: { label: 'Colunas', icon: Columns3, shortcut: 'Ctrl+Shift+3' }
}

const SHORTCUT_CODES: Record<string, ViewMode> = {
  Digit1: 'list',
  Digit2: 'cards',
  Digit3: 'columns'
}

/** Matches Ctrl+Shift+1/2/3 by physical key, since Shift changes `event.key` to symbols. */
export function viewModeFromShortcut(event: KeyboardEvent): ViewMode | undefined {
  if (!(event.ctrlKey || event.metaKey) || !event.shiftKey || event.altKey) return undefined
  return SHORTCUT_CODES[event.code]
}
