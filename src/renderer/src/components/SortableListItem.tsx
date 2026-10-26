import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { isTextDropItem, mergeProps, useDrag, useDrop } from 'react-aria'
import type { DropSide } from '../lib/reorder'

const LIST_DRAG_TYPE = 'application/x-art-todo-list'

interface SortableListItemProps {
  listId: number
  listName: string
  /** False in alphabetical order: the item neither drags nor accepts drops. */
  isSortable: boolean
  onDrop: (draggedId: number, side: DropSide) => void
  /** Alt+↑ / Alt+↓ on the item. */
  onMoveStep: (step: -1 | 1) => void
  children: ReactNode
}

/** Sidebar list row that can be dragged onto another list row to reorder. */
export function SortableListItem({
  listId,
  listName,
  isSortable,
  onDrop,
  onMoveStep,
  children
}: SortableListItemProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const [side, setSide] = useState<DropSide>('before')
  const sideAt = (y: number): DropSide =>
    y < (ref.current?.offsetHeight ?? 0) / 2 ? 'before' : 'after'

  const { dragProps, isDragging } = useDrag({
    isDisabled: !isSortable,
    // Keyboard users reorder with Alt+arrows; keep Enter and Space for the list button.
    hasDragButton: true,
    getItems: () => [{ [LIST_DRAG_TYPE]: String(listId), 'text/plain': listName }],
    getAllowedDropOperations: () => ['move']
  })
  const { dropProps, isDropTarget } = useDrop({
    ref,
    isDisabled: !isSortable,
    getDropOperation: (types) => (types.has(LIST_DRAG_TYPE) ? 'move' : 'cancel'),
    onDropEnter: (event) => setSide(sideAt(event.y)),
    onDropMove: (event) => setSide(sideAt(event.y)),
    onDrop: async (event) => {
      const [item] = event.items.filter(isTextDropItem)
      if (!item) return
      const draggedId = Number(await item.getText(LIST_DRAG_TYPE))
      if (draggedId !== listId) onDrop(draggedId, sideAt(event.y))
    }
  })

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    // Keys from the list's menu reach here through the React tree (portal); skip them.
    if (!isSortable || !event.altKey || !event.currentTarget.contains(event.target as Node)) return
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
    event.preventDefault()
    onMoveStep(event.key === 'ArrowUp' ? -1 : 1)
  }

  return (
    <div
      ref={ref}
      {...mergeProps(dragProps, dropProps, { onKeyDown })}
      className={`relative rounded-md ${isDragging ? 'opacity-40' : ''}`}
    >
      {children}
      {isDropTarget && (
        <div
          aria-hidden
          data-drop-indicator
          className={`pointer-events-none absolute inset-x-1 h-0.5 rounded-full bg-accent-text ${
            side === 'before' ? '-top-px' : '-bottom-px'
          }`}
        />
      )}
    </div>
  )
}
