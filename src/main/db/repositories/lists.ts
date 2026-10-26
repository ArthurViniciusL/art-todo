import { asc, eq, max } from 'drizzle-orm'
import type { List, ListDeleteMode, ListMove, ViewMode } from '../../../shared/domain'
import { defaultListName } from '../../../shared/list-name'
import type { Db } from '../client'
import { positionBetween } from '../../../shared/ordering'
import { lists, tasks } from '../schema'

export function createListsRepository(db: Db) {
  const getInbox = (): List => {
    const inbox = db.select().from(lists).where(eq(lists.isInbox, true)).get()
    if (!inbox) throw new Error('Inbox is missing')
    return inbox
  }

  const getById = (id: number): List => {
    const list = db.select().from(lists).where(eq(lists.id, id)).get()
    if (!list) throw new Error(`List ${id} not found`)
    return list
  }

  const nextPosition = (): number => {
    const row = db
      .select({ value: max(lists.position) })
      .from(lists)
      .get()
    return (row?.value ?? 0) + 1
  }

  return {
    getAll(): List[] {
      return db.select().from(lists).orderBy(asc(lists.position)).all()
    },

    getInbox,

    /** A blank or missing name falls back to the creation date and time. */
    create(name?: string, now = new Date()): List {
      const trimmed = name?.trim()
      return db
        .insert(lists)
        .values({ name: trimmed || defaultListName(now), position: nextPosition() })
        .returning()
        .get()
    },

    rename(id: number, name: string): List {
      const trimmed = name.trim()
      if (!trimmed) throw new Error('List name cannot be empty')
      if (getById(id).isInbox) throw new Error('The Inbox cannot be renamed')
      return db.update(lists).set({ name: trimmed }).where(eq(lists.id, id)).returning().get()
    },

    /** Places a user list between two others. */
    move(id: number, { prevId, nextId }: ListMove): List {
      const list = getById(id)
      if (list.isInbox) throw new Error('The Inbox cannot be moved')
      const neighbor = (neighborId: number | null): List | null => {
        if (neighborId === null) return null
        const other = getById(neighborId)
        if (other.isInbox) throw new Error('The Inbox is not a reorder neighbor')
        return other
      }
      return db.transaction(() => {
        const position = positionBetween(neighbor(prevId), neighbor(nextId), {
          fallback: () => list.position,
          renumber: () =>
            db
              .select({ id: lists.id })
              .from(lists)
              .orderBy(asc(lists.position))
              .all()
              .forEach((row, index) => {
                db.update(lists)
                  .set({ position: index + 1 })
                  .where(eq(lists.id, row.id))
                  .run()
              }),
          reload: getById
        })
        return db.update(lists).set({ position }).where(eq(lists.id, id)).returning().get()
      })
    },

    setViewMode(id: number, viewMode: ViewMode): List {
      getById(id)
      return db.update(lists).set({ viewMode }).where(eq(lists.id, id)).returning().get()
    },

    remove(id: number, mode: ListDeleteMode): void {
      if (getById(id).isInbox) throw new Error('The Inbox cannot be deleted')
      db.transaction((tx) => {
        if (mode === 'move-to-inbox') {
          tx.update(tasks).set({ listId: getInbox().id }).where(eq(tasks.listId, id)).run()
        }
        tx.delete(lists).where(eq(lists.id, id)).run()
      })
    }
  }
}

export type ListsRepository = ReturnType<typeof createListsRepository>
