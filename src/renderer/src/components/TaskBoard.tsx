import { Button } from '@heroui/react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { TASK_STATUSES, type Task, type TaskStatus } from '../../../shared/domain'
import { STATUS_META } from '../task-status'
import { TaskGrid } from './TaskGrid'
import type { TaskRowOptions } from './TaskRow'

interface TaskBoardProps {
  tasks: Task[]
  /** Order inside the open columns. Done is always newest first. */
  compare: (a: Task, b: Task) => number
  rowOptions?: (task: Task) => TaskRowOptions
  /** Allow manual reordering inside the open columns (lists, not smart views). */
  isReorderable?: boolean
}

const newestDoneFirst = (a: Task, b: Task): number => (b.completedAt ?? 0) - (a.completedAt ?? 0)

/** Three columns: A fazer, Fazendo, Feito. The Feito column can be collapsed. */
export function TaskBoard({
  tasks,
  compare,
  rowOptions,
  isReorderable = false
}: TaskBoardProps): React.JSX.Element {
  const [isDoneCollapsed, setIsDoneCollapsed] = useState(false)

  const column = (status: TaskStatus): Task[] =>
    tasks
      .filter((task) => task.status === status)
      .sort(status === 'done' ? newestDoneFirst : compare)

  return (
    <div className="grid min-h-0 flex-1 grid-cols-3 gap-4">
      {TASK_STATUSES.map((status) => {
        const { label, icon: Icon, className } = STATUS_META[status]
        const items = column(status)
        const isCollapsed = status === 'done' && isDoneCollapsed
        return (
          <section
            key={status}
            aria-labelledby={`column-${status}`}
            className="flex min-h-0 flex-col rounded-xl bg-sidebar p-2"
          >
            <header className="flex h-8 items-center gap-2 px-1.5">
              <Icon className={`size-4 ${className}`} aria-hidden />
              <h2 id={`column-${status}`} className="text-sm font-semibold">
                {label}
              </h2>
              <span className="text-xs text-muted">{items.length}</span>
              {status === 'done' && (
                <Button
                  size="sm"
                  variant="ghost"
                  isIconOnly
                  className="ml-auto size-6 min-w-6"
                  aria-label={isCollapsed ? 'Mostrar concluídas' : 'Ocultar concluídas'}
                  aria-expanded={!isCollapsed}
                  onPress={() => setIsDoneCollapsed(!isCollapsed)}
                >
                  {isCollapsed ? (
                    <ChevronRight className="size-4" aria-hidden />
                  ) : (
                    <ChevronDown className="size-4" aria-hidden />
                  )}
                </Button>
              )}
            </header>
            {!isCollapsed && (
              <div className="min-h-0 flex-1 overflow-y-auto p-0.5">
                <TaskGrid
                  label={label}
                  tasks={items}
                  layout="stack"
                  rowOptions={rowOptions}
                  dropStatus={status}
                  isReorderable={isReorderable && status !== 'done'}
                  findTask={(id) => tasks.find((task) => task.id === id)}
                />
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
