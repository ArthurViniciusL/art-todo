import type { KeyboardEvent } from 'react'
import { GridList, GridListItem } from 'react-aria-components'
import { toIsoDate } from '../../../shared/dates'
import type { Task } from '../../../shared/domain'
import { useUpdateTask } from '../hooks/queries'
import { useTaskActions } from '../hooks/useTaskActions'
import { useUiStore } from '../stores/ui'
import { TaskRow, type TaskRowOptions } from './TaskRow'

interface TaskGridProps {
  label: string
  tasks: Task[]
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
export function TaskGrid({ label, tasks, rowOptions }: TaskGridProps): React.JSX.Element {
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
      <GridList aria-label={label} items={tasks} className="flex flex-col outline-none">
        {(task) => (
          <GridListItem
            id={task.id}
            textValue={task.title}
            onDoubleClick={() => openTask(task.id)}
            className="rounded-md outline-none transition-colors hover:bg-default/60 focus-visible:ring-2 focus-visible:ring-focus"
          >
            <TaskRow task={task} {...rowOptions?.(task)} />
          </GridListItem>
        )}
      </GridList>
    </div>
  )
}
