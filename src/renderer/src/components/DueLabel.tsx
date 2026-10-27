import { CalendarDays } from 'lucide-react'
import type { Task } from '../../../shared/domain'
import { useToday } from '../hooks/useToday'
import { shortDateLabel } from '../lib/format-date'

interface DueLabelProps {
  task: Task
  /** Hide the date part, for groups that already name the day. */
  timeOnly?: boolean
}

export function DueLabel({ task, timeOnly = false }: DueLabelProps): React.JSX.Element | null {
  const { today } = useToday()
  if (!task.dueDate) return null
  const isOverdue = task.status !== 'done' && task.dueDate < today
  const parts = [timeOnly ? null : shortDateLabel(task.dueDate, today), task.dueTime].filter(
    Boolean
  )
  if (parts.length === 0) return null

  // `relative` keeps the sr-only text inside the row, so scroll areas clip it.
  return (
    <span
      className={`relative flex shrink-0 items-center gap-1 text-xs ${isOverdue ? 'text-priority-high' : 'text-muted'}`}
    >
      {!timeOnly && <CalendarDays className="size-3.5" aria-hidden />}
      <span>{parts.join(' · ')}</span>
      {isOverdue && <span className="sr-only">(atrasada)</span>}
    </span>
  )
}
