interface Positioned {
  id: number
  position: number
}

/**
 * Float position between two neighbors (null at either end), shared by the task and list
 * repositories and the renderer's optimistic list moves. When the
 * gap is too small for another midpoint, `renumber` spreads the rows out and `reload` re-reads
 * the neighbors before computing.
 */
export function positionBetween<T extends Positioned>(
  prev: T | null,
  next: T | null,
  {
    fallback,
    renumber,
    reload
  }: { fallback: () => number; renumber: () => void; reload: (id: number) => T }
): number {
  if (prev && next && next.position - prev.position < 1e-6) {
    renumber()
    prev = reload(prev.id)
    next = reload(next.id)
  }
  if (prev && next) return (prev.position + next.position) / 2
  if (prev) return prev.position + 1
  if (next) return next.position - 1
  return fallback()
}
