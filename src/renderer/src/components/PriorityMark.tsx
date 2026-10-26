import type { Priority } from '../../../shared/domain'
import { PRIORITY_META, priorityMark } from '../priority'

export function PriorityMark({ priority }: { priority: Priority }): React.JSX.Element | null {
  if (priority === 0) return null
  const { label, className } = PRIORITY_META[priority]
  const name = `Prioridade ${label.toLowerCase()}`
  return (
    <span title={name} aria-label={name} className={`shrink-0 text-xs font-bold ${className}`}>
      {priorityMark(priority)}
    </span>
  )
}
