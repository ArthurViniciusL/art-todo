import { Button } from '@heroui/react'
import type { Task } from '../../../shared/domain'
import { useUpdateTask } from '../hooks/queries'
import { useTaskActions } from '../hooks/useTaskActions'
import { useUiStore } from '../stores/ui'
import { DueLabel } from './DueLabel'
import { InlineNameInput } from './InlineNameInput'
import { PriorityMark } from './PriorityMark'
import { StatusSelector } from './StatusSelector'

export interface TaskRowOptions {
  /** Name of the task's list, shown in views that mix lists. */
  listName?: string
  /** Show only the time, for groups that already name the day. */
  timeOnly?: boolean
}

interface TaskRowProps extends TaskRowOptions {
  task: Task
}

export function TaskRow({ task, listName, timeOnly }: TaskRowProps): React.JSX.Element {
  const isRenaming = useUiStore((state) => state.renamingTaskId === task.id)
  const isRecentlyDone = useUiStore((state) => state.recentlyDone.has(task.id))
  const renameTask = useUiStore((state) => state.renameTask)
  const { mutate: update } = useUpdateTask()
  const { setStatus, undoDone } = useTaskActions()
  const isDone = task.status === 'done'

  return (
    <div className="flex min-h-10 items-center gap-2 px-1">
      <StatusSelector
        status={task.status}
        taskTitle={task.title}
        onChange={(status) => setStatus(task, status)}
      />
      {isRenaming ? (
        <InlineNameInput
          label="Título da tarefa"
          initialValue={task.title}
          onSubmit={(title) => {
            if (title.trim() && title.trim() !== task.title)
              update({ id: task.id, patch: { title } })
            renameTask(null)
          }}
          onCancel={() => renameTask(null)}
        />
      ) : (
        <span
          className={`min-w-0 flex-1 truncate text-sm transition-colors duration-200 ${
            isDone ? 'text-muted line-through decoration-muted' : 'text-foreground'
          }`}
        >
          {task.title}
        </span>
      )}
      {isRecentlyDone && (
        <Button size="sm" variant="ghost" onPress={() => undoDone(task)}>
          Desfazer
        </Button>
      )}
      {listName && (
        <span className="max-w-32 shrink-0 truncate text-xs text-muted">{listName}</span>
      )}
      <DueLabel task={task} timeOnly={timeOnly} />
      <PriorityMark priority={task.priority} />
    </div>
  )
}
