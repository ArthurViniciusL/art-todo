/** The grid row that shows a task. A view shows each task at most once. */
export function taskRow(taskId: number): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[role=row][data-key="${taskId}"]`)
}

/** Moves focus to the next (1) or previous (-1) row of the same grid. */
export function focusSibling(row: HTMLElement, step: 1 | -1): void {
  const rows = Array.from(
    row.closest('[role=grid]')?.querySelectorAll<HTMLElement>('[role=row]') ?? []
  )
  rows[rows.indexOf(row) + step]?.focus()
}
