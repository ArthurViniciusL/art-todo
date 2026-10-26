import type { Task } from '../../../shared/domain'
import { useTaskActions } from '../hooks/useTaskActions'
import { DragHandle } from './DragHandle'
import { DueLabel } from './DueLabel'
import { PriorityMark } from './PriorityMark'
import { StatusSelector } from './StatusSelector'
import { TaskTitle } from './TaskTitle'
import { UndoDoneButton } from './UndoDoneButton'

export interface TaskRowOptions {
  /** Name of the task's list, shown in views that mix lists. */
  listName?: string
  /** Show only the time, for groups that already name the day. */
  timeOnly?: boolean
}

export interface TaskItemProps extends TaskRowOptions {
  task: Task
  /** Show the drag handle (grids with drag and drop). */
  isDraggable?: boolean
}

export function TaskRow({
  task,
  listName,
  timeOnly,
  isDraggable
}: TaskItemProps): React.JSX.Element {
  const { setStatus } = useTaskActions()

  return (
    <div className="flex min-h-10 items-center gap-1.5 px-1">
      {isDraggable && <DragHandle taskTitle={task.title} />}
      <StatusSelector
        status={task.status}
        taskTitle={task.title}
        onChange={(status) => setStatus(task, status)}
      />
      <TaskTitle task={task} className="flex-1 truncate" />
      <UndoDoneButton task={task} />
      {listName && (
        <span className="max-w-32 shrink-0 truncate text-xs text-muted">{listName}</span>
      )}
      <DueLabel task={task} timeOnly={timeOnly} />
      <PriorityMark priority={task.priority} />
    </div>
  )
}
