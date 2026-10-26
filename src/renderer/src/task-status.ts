import { Circle, CircleDot, createLucideIcon, type LucideIcon } from 'lucide-react'
import type { TaskStatus } from '../../shared/domain'

/**
 * Lucide's CircleCheck strokes the circle too, which drew a dark ring around the fill. This one
 * is a solid success disc with only the check mark stroked.
 */
const DoneIcon = createLucideIcon({
  name: 'art-todo-done',
  size: 24,
  node: [
    [
      'circle',
      { cx: '12', cy: '12', r: '11', fill: 'var(--status-done-fill)', stroke: 'none', key: 'disc' }
    ],
    [
      'path',
      {
        d: 'm16.5 9-6 6L7.5 12',
        stroke: 'var(--status-done-foreground)',
        strokeWidth: '2.5',
        key: 'check'
      }
    ]
  ]
})

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
    icon: DoneIcon,
    className: '',
    chipClassName: 'bg-status-done/12 text-status-done'
  }
}

const CYCLE: Record<TaskStatus, TaskStatus> = { todo: 'doing', doing: 'done', done: 'todo' }

export function nextStatus(status: TaskStatus): TaskStatus {
  return CYCLE[status]
}
