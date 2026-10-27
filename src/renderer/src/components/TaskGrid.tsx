import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from 'react'
import {
  DropIndicator,
  GridList,
  GridListItem,
  isTextDropItem,
  useDragAndDrop,
  type DropTarget,
  type Key
} from 'react-aria-components'
import { toIsoDate } from '../../../shared/dates'
import type { Task, TaskMove, TaskStatus } from '../../../shared/domain'
import { useUpdateTask } from '../hooks/queries'
import { useTaskActions } from '../hooks/useTaskActions'
import { neighborIds } from '../lib/reorder'
import { focusSibling, siblingRow } from '../lib/task-focus'
import { useUiStore } from '../stores/ui'
import { TaskCard } from './TaskCard'
import { TaskRow, type TaskRowOptions } from './TaskRow'

/** `list`: rows; `cards`: a wrapping grid of cards; `stack`: one column of cards (board). */
export type TaskGridLayout = 'list' | 'cards' | 'stack'

const LAYOUT_CLASSES: Record<TaskGridLayout, string> = {
  list: 'flex flex-col',
  cards: 'grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3',
  stack: 'flex flex-col gap-2'
}

interface TaskGridProps {
  label: string
  tasks: Task[]
  layout?: TaskGridLayout
  /** Per-task row options (list name, time-only labels). */
  rowOptions?: (task: Task) => TaskRowOptions
  /** Drag to reorder inside the grid (manual order in lists). */
  isReorderable?: boolean
  /** Accept tasks dragged from other grids and give them this status (board columns). */
  dropStatus?: TaskStatus
  /** Tasks that can be dropped here from other grids. Defaults to `tasks`. */
  findTask?: (id: number) => Task | undefined
}

const TASK_DRAG_TYPE = 'application/x-art-todo-task'

/** The tasks directly above and below a drop target, ignoring the dragged task itself. */
function neighbors(order: Task[], movedId: number, target: DropTarget): TaskMove {
  if (target.type === 'root') return neighborIds(order, movedId, null, 'after')
  return neighborIds(
    order,
    movedId,
    Number(target.key),
    target.dropPosition === 'before' ? 'before' : 'after'
  )
}

/**
 * Keyboard-navigable task list. Arrow keys come from React Aria; the task shortcuts below
 * only fire when the row itself has focus, so buttons and inputs inside keep their keys.
 */
export function TaskGrid({
  label,
  tasks,
  layout = 'list',
  rowOptions,
  isReorderable = false,
  dropStatus,
  findTask
}: TaskGridProps): React.JSX.Element {
  const { setStatus, cycleStatus, moveTask, removeTask } = useTaskActions()
  const lookup = (id: number): Task | undefined =>
    findTask?.(id) ?? tasks.find((task) => task.id === id)
  const canDrag = isReorderable || dropStatus !== undefined

  const dropTask = (id: number, target: DropTarget): void => {
    const task = lookup(id)
    if (!task) return
    const status = dropStatus !== undefined && dropStatus !== task.status ? dropStatus : undefined
    const place = isReorderable ? neighbors(tasks, id, target) : {}
    if (status === undefined && !isReorderable) return
    moveTask(task, { ...place, ...(status && { status }) })
  }

  const draggedIds = async (items: Parameters<typeof isTextDropItem>[0][]): Promise<number[]> =>
    Promise.all(
      items.filter(isTextDropItem).map(async (item) => Number(await item.getText(TASK_DRAG_TYPE)))
    )

  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys: Set<Key>) =>
      [...keys].map((key) => ({
        [TASK_DRAG_TYPE]: String(key),
        'text/plain': lookup(Number(key))?.title ?? ''
      })),
    acceptedDragTypes: [TASK_DRAG_TYPE],
    getDropOperation: () => 'move',
    onReorder: isReorderable
      ? (event) => {
          for (const key of event.keys) dropTask(Number(key), event.target)
        }
      : undefined,
    onInsert:
      dropStatus !== undefined
        ? async (event) => {
            for (const id of await draggedIds(event.items)) dropTask(id, event.target)
          }
        : undefined,
    onRootDrop:
      dropStatus !== undefined
        ? async (event) => {
            for (const id of await draggedIds(event.items)) dropTask(id, { type: 'root' })
          }
        : undefined,
    renderDropIndicator: (target) => (
      <DropIndicator
        target={target}
        className="rounded-full outline-none data-[drop-target]:h-0.5 data-[drop-target]:bg-accent-text"
      />
    )
  })
  const openTask = useUiStore((state) => state.openTask)
  const renameTask = useUiStore((state) => state.renameTask)
  const setContextMenu = useUiStore((state) => state.setTaskContextMenu)
  const movedTaskFocus = useUiStore((state) => state.movedTaskFocus)
  const focusMovedTask = useUiStore((state) => state.focusMovedTask)

  const containerRef = useRef<HTMLDivElement>(null)

  // A task moved to another list from this view: focus its row once it renders in that list.
  // React Aria adds the row a render after `tasks` changes, so wait a few frames for it.
  useEffect(() => {
    if (!movedTaskFocus) return
    const { taskId, listId } = movedTaskFocus
    if (!tasks.some((task) => task.id === taskId && task.listId === listId)) return
    let frame = 0
    let tries = 10
    const tryFocus = (): void => {
      const row = containerRef.current?.querySelector<HTMLElement>(
        `[role=row][data-key="${taskId}"]`
      )
      if (row) {
        row.focus()
        focusMovedTask(null)
      } else if (--tries > 0) frame = requestAnimationFrame(tryFocus)
    }
    tryFocus()
    return () => cancelAnimationFrame(frame)
  }, [tasks, movedTaskFocus, focusMovedTask])
  const { mutate: update } = useUpdateTask()

  const taskOfRow = (row: HTMLElement | null): Task | undefined =>
    tasks.find((item) => String(item.id) === row?.dataset.key)

  const onContextMenu = (event: MouseEvent<HTMLDivElement>): void => {
    // Text fields in a row (inline rename) keep the native Cut / Copy / Paste menu.
    if ((event.target as HTMLElement).closest('input, textarea')) return
    const task = taskOfRow((event.target as HTMLElement).closest<HTMLElement>('[role=row]'))
    if (!task) return
    event.preventDefault()
    setContextMenu({ taskId: task.id, x: event.clientX, y: event.clientY })
  }

  const onKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>): void => {
    const row = event.target as HTMLElement
    if (row.getAttribute('role') !== 'row') return
    const task = taskOfRow(row)
    if (!task) return
    const plain = !event.ctrlKey && !event.metaKey && !event.altKey

    if (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)) {
      const rect = row.getBoundingClientRect()
      setContextMenu({ taskId: task.id, x: rect.left + 16, y: rect.bottom })
    } else if (event.key === ' ' && plain) setStatus(task, task.status === 'done' ? 'todo' : 'done')
    else if (event.key.toLowerCase() === 's' && plain) cycleStatus(task)
    else if (event.key.toLowerCase() === 't' && plain)
      update({ id: task.id, patch: { dueDate: toIsoDate(new Date()) } })
    else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) openTask(task.id)
    else if (event.key === 'Enter' && plain) renameTask(task.id)
    else if (event.key === 'Delete' && plain) {
      focusSibling(row, 1)
      removeTask(task)
    } else if (event.key === 'j' && plain) focusSibling(row, 1)
    else if (event.key === 'k' && plain) focusSibling(row, -1)
    else if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && plain) {
      // React Aria moves inside the grid; only a step into another grid (Inbox) is ours.
      const next = siblingRow(row, event.key === 'ArrowDown' ? 1 : -1)
      if (!next || next.closest('[role=grid]') === row.closest('[role=grid]')) return
      next.focus()
    } else return

    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <div ref={containerRef} onKeyDownCapture={onKeyDownCapture} onContextMenu={onContextMenu}>
      <GridList
        aria-label={label}
        items={tasks}
        // React Aria caches rendered items; re-render them when these change.
        dependencies={[layout, rowOptions]}
        layout={layout === 'cards' ? 'grid' : 'stack'}
        dragAndDropHooks={canDrag ? dragAndDropHooks : undefined}
        className={`outline-none ${LAYOUT_CLASSES[layout]} ${
          dropStatus !== undefined ? 'min-h-24 rounded-lg data-[drop-target]:bg-default/60' : ''
        }`}
      >
        {(task) => (
          <GridListItem
            id={task.id}
            textValue={task.title}
            onDoubleClick={() => openTask(task.id)}
            className={`group outline-none focus-visible:ring-2 focus-visible:ring-focus data-[dragging]:opacity-40 ${
              layout === 'list'
                ? 'rounded-md transition-colors hover:bg-default/60'
                : 'rounded-lg transition-shadow hover:shadow-sm'
            }`}
          >
            {({ allowsDragging }) =>
              layout === 'list' ? (
                <TaskRow task={task} isDraggable={allowsDragging} {...rowOptions?.(task)} />
              ) : (
                <TaskCard task={task} isDraggable={allowsDragging} {...rowOptions?.(task)} />
              )
            }
          </GridListItem>
        )}
      </GridList>
    </div>
  )
}
