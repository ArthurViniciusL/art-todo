import { Circle, CircleCheck, CircleDot, type LucideIcon } from 'lucide-react'
import type { TaskStatus } from '../../shared/domain'

export const STATUS_META: Record<
  TaskStatus,
  { label: string; icon: LucideIcon; className: string }
> = {
  todo: { label: 'A fazer', icon: Circle, className: 'text-muted' },
  doing: { label: 'Fazendo', icon: CircleDot, className: 'text-accent-text' },
  done: { label: 'Feito', icon: CircleCheck, className: 'fill-accent text-accent-foreground' }
}

const CYCLE: Record<TaskStatus, TaskStatus> = { todo: 'doing', doing: 'done', done: 'todo' }

export function nextStatus(status: TaskStatus): TaskStatus {
  return CYCLE[status]
}
