export type DropSide = 'before' | 'after'

/**
 * The items directly above and below `movedId` once it lands before or after `anchorId` in
 * `order`. A missing anchor (null or not found) means the end.
 */
export function neighborIds(
  order: readonly { id: number }[],
  movedId: number,
  anchorId: number | null,
  side: DropSide
): { prevId: number | null; nextId: number | null } {
  const rest = order.filter((item) => item.id !== movedId)
  const index = rest.findIndex((item) => item.id === anchorId)
  if (index === -1) return { prevId: rest.at(-1)?.id ?? null, nextId: null }
  return side === 'before'
    ? { prevId: rest[index - 1]?.id ?? null, nextId: rest[index].id }
    : { prevId: rest[index].id, nextId: rest[index + 1]?.id ?? null }
}
