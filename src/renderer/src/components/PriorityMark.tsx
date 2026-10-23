import type { Priority } from '../../../shared/domain'

const LABELS: Record<Priority, string> = { 0: '', 1: 'baixa', 2: 'média', 3: 'alta' }

export function PriorityMark({ priority }: { priority: Priority }): React.JSX.Element | null {
  if (priority === 0) return null
  return (
    <span
      title={`Prioridade ${LABELS[priority]}`}
      aria-label={`Prioridade ${LABELS[priority]}`}
      className={`text-xs font-bold ${priority === 3 ? 'text-priority-high' : 'text-muted'}`}
    >
      {'!'.repeat(priority)}
    </span>
  )
}
