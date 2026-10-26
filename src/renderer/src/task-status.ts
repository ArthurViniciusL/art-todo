import { Circle, CircleCheck, CircleDot, type LucideIcon } from 'lucide-react'
import type { TaskStatus } from '../../shared/domain'

/**
 * Status colors follow HeroUI: A fazer = danger, Fazendo = warning, Feito = success.
 * The tokens are shaded per theme for contrast (src/shared/palette.ts).
 */
export const STATUS_META: Record<
  TaskStatus,
  { label: string; icon: LucideIcon; className: string; chipClassName: string }
> = {
  todo: {
    label: 'A fazer',
    icon: Circle,
    className: 'text-status-todo',
    chipClassName: 'bg-status-todo/12 text-status-todo'
  },
  doing: {
    label: 'Fazendo',
    icon: CircleDot,
    className: 'text-status-doing',
    chipClassName: 'bg-status-doing/15 text-status-doing'
  },
  done: {
    label: 'Feito',
    icon: CircleCheck,
    className: 'fill-status-done-fill text-status-done-foreground',
    chipClassName: 'bg-status-done/12 text-status-done'
  }
}

const CYCLE: Record<TaskStatus, TaskStatus> = { todo: 'doing', doing: 'done', done: 'todo' }

export function nextStatus(status: TaskStatus): TaskStatus {
  return CYCLE[status]
}
