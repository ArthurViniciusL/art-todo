import type { LucideIcon } from 'lucide-react'
import { Hash, Inbox } from 'lucide-react'
import type { List, ListSort } from '../../../shared/domain'
import { useListSort, useLists } from './queries'
import { useUiStore, type Selection } from '../stores/ui'
import { SMART_VIEWS } from '../views'

export interface NavTarget {
  id: string
  label: string
  icon: LucideIcon
  selection: Selection
}

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true })
const byName = (a: List, b: List): number => collator.compare(a.name, b.name)

/** The Inbox and the user lists in sidebar order (manual position or by name). */
export function useOrderedLists(): { inbox?: List; userLists: List[]; sort: ListSort } {
  const { data: lists = [] } = useLists()
  const { data: sort = 'manual' } = useListSort()
  const userLists = lists.filter((list) => !list.isInbox)
  return {
    inbox: lists.find((list) => list.isInbox),
    userLists: sort === 'alpha' ? userLists.sort(byName) : userLists,
    sort
  }
}

/** Sidebar destinations in order: Entrada, Hoje, Próximos, then user lists (for Ctrl+1..9). */
export function useNavTargets(): NavTarget[] {
  const { inbox, userLists } = useOrderedLists()
  return [
    ...(inbox ? [{ id: 'inbox', label: inbox.name, icon: Inbox, selection: null }] : []),
    ...SMART_VIEWS.map((view) => ({
      id: view.id,
      label: view.label,
      icon: view.icon,
      selection: { kind: 'view', view: view.id } as const
    })),
    ...userLists.map((list) => ({
      id: `list-${list.id}`,
      label: list.name,
      icon: Hash,
      selection: { kind: 'list', listId: list.id } as const
    }))
  ]
}

/** Focuses the quick add field, switching to the Inbox when the view has none (Próximos). */
export function useStartNewTask(): () => void {
  const select = useUiStore((state) => state.select)
  const focusQuickAdd = useUiStore((state) => state.focusQuickAdd)
  return () => {
    const { selection } = useUiStore.getState()
    if (selection?.kind === 'view' && selection.view === 'upcoming') {
      select(null)
      // Let the Inbox view mount its field before asking it to take focus.
      setTimeout(focusQuickAdd, 0)
    } else {
      focusQuickAdd()
    }
  }
}
