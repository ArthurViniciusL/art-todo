import { useTaskActions } from '../hooks/useTaskActions'
import { DueLabel } from './DueLabel'
import { PriorityMark } from './PriorityMark'
import { StatusSelector } from './StatusSelector'
import type { TaskItemProps } from './TaskRow'
import { TaskTitle } from './TaskTitle'
import { UndoDoneButton } from './UndoDoneButton'

export function TaskCard({ task, listName, timeOnly }: TaskItemProps): React.JSX.Element {
  const { setStatus } = useTaskActions()
  const hasFooter = Boolean(task.dueDate || listName)

  return (
    <div className="flex h-full flex-col gap-2 rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <StatusSelector
          status={task.status}
          taskTitle={task.title}
          onChange={(status) => setStatus(task, status)}
          showLabel
        />
        <PriorityMark priority={task.priority} />
      </div>
      <TaskTitle task={task} className="line-clamp-3 break-words font-medium" />
      {task.notes && <p className="line-clamp-2 text-xs text-muted">{task.notes}</p>}
      {hasFooter && (
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
          <DueLabel task={task} timeOnly={timeOnly} />
          {listName && <span className="truncate text-xs text-muted">{listName}</span>}
        </div>
      )}
      <UndoDoneButton task={task} />
    </div>
  )
}
