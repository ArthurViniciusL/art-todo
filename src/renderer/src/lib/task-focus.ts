/** The grid row that shows a task. A view shows each task at most once. */
export function taskRow(taskId: number): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[role=row][data-key="${taskId}"]`)
}

/**
 * The next (1) or previous (-1) visible row. A container marked `data-task-scope` (the Inbox
 * sections) joins its grids into one sequence; otherwise the row's own grid is the sequence.
 */
export function siblingRow(row: HTMLElement, step: 1 | -1): HTMLElement | undefined {
  const container = row.closest('[data-task-scope]') ?? row.closest('[role=grid]')
  const rows = Array.from(container?.querySelectorAll<HTMLElement>('[role=row]') ?? []).filter(
    (item) => item.checkVisibility()
  )
  return rows[rows.indexOf(row) + step]
}

/** Moves focus to the next (1) or previous (-1) row of the same grid or task scope. */
export function focusSibling(row: HTMLElement, step: 1 | -1): void {
  siblingRow(row, step)?.focus()
}
