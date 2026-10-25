import type { KeyboardEvent } from 'react'
import { GridList, GridListItem } from 'react-aria-components'
import { toIsoDate } from '../../../shared/dates'
import type { Task } from '../../../shared/domain'
import { useUpdateTask } from '../hooks/queries'
import { useTaskActions } from '../hooks/useTaskActions'
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
}

function focusSibling(row: HTMLElement, step: 1 | -1): void {
  const rows = Array.from(
    row.closest('[role=grid]')?.querySelectorAll<HTMLElement>('[role=row]') ?? []
  )
  rows[rows.indexOf(row) + step]?.focus()
}

/**
 * Keyboard-navigable task list. Arrow keys come from React Aria; the task shortcuts below
 * only fire when the row itself has focus, so buttons and inputs inside keep their keys.
 */
export function TaskGrid({
  label,
  tasks,
  layout = 'list',
  rowOptions
}: TaskGridProps): React.JSX.Element {
  const { setStatus, cycleStatus, removeTask } = useTaskActions()
  const openTask = useUiStore((state) => state.openTask)
  const renameTask = useUiStore((state) => state.renameTask)
  const { mutate: update } = useUpdateTask()

  const onKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>): void => {
    const row = event.target as HTMLElement
    if (row.getAttribute('role') !== 'row') return
    const task = tasks.find((item) => String(item.id) === row.dataset.key)
    if (!task) return
    const plain = !event.ctrlKey && !event.metaKey && !event.altKey

    if (event.key === ' ' && plain) setStatus(task, task.status === 'done' ? 'todo' : 'done')
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
    else return

    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <div onKeyDownCapture={onKeyDownCapture}>
      <GridList
        aria-label={label}
        items={tasks}
        // React Aria caches rendered items; re-render them when these change.
        dependencies={[layout, rowOptions]}
        layout={layout === 'cards' ? 'grid' : 'stack'}
        className={`outline-none ${LAYOUT_CLASSES[layout]}`}
      >
        {(task) => (
          <GridListItem
            id={task.id}
            textValue={task.title}
            onDoubleClick={() => openTask(task.id)}
            className={`outline-none focus-visible:ring-2 focus-visible:ring-focus ${
              layout === 'list'
                ? 'rounded-md transition-colors hover:bg-default/60'
                : 'rounded-lg transition-shadow hover:shadow-sm'
            }`}
          >
            {layout === 'list' ? (
              <TaskRow task={task} {...rowOptions?.(task)} />
            ) : (
              <TaskCard task={task} {...rowOptions?.(task)} />
            )}
          </GridListItem>
        )}
      </GridList>
    </div>
  )
}
