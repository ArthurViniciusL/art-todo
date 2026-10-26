import type { Priority } from '../../shared/domain'

/** Label and mark style for each priority. Alta and Crítico use the high-priority token. */
export const PRIORITY_META: Record<Priority, { label: string; className: string }> = {
  0: { label: 'Nenhuma', className: '' },
  1: { label: 'Baixa', className: 'text-muted' },
  2: { label: 'Média', className: 'text-muted' },
  3: { label: 'Alta', className: 'text-priority-high' },
  4: {
    label: 'Crítico',
    className: 'rounded-sm bg-priority-high px-1 text-priority-high-foreground'
  }
}

/** `!` repeated once per level. */
export const priorityMark = (priority: Priority): string => '!'.repeat(priority)
