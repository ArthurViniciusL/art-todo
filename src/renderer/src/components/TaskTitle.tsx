import type { Task } from '../../../shared/domain'
import { useUpdateTask } from '../hooks/queries'
import { useUiStore } from '../stores/ui'
import { InlineNameInput } from './InlineNameInput'

interface TaskTitleProps {
  task: Task
  className?: string
}

/** The task title, struck through when done, or an inline input while it is being renamed. */
export function TaskTitle({ task, className = '' }: TaskTitleProps): React.JSX.Element {
  const isRenaming = useUiStore((state) => state.renamingTaskId === task.id)
  const renameTask = useUiStore((state) => state.renameTask)
  const { mutate: update } = useUpdateTask()

  if (isRenaming) {
    return (
      <InlineNameInput
        label="Título da tarefa"
        initialValue={task.title}
        onSubmit={(title) => {
          if (title.trim() && title.trim() !== task.title) update({ id: task.id, patch: { title } })
          renameTask(null)
        }}
        onCancel={() => renameTask(null)}
      />
    )
  }

  return (
    <span
      className={`min-w-0 text-sm transition-colors duration-200 ${
        task.status === 'done' ? 'text-muted line-through decoration-muted' : 'text-foreground'
      } ${className}`}
    >
      {task.title}
    </span>
  )
}
