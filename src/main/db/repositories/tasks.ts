import { and, asc, desc, eq, gte, isNotNull, lte, max, ne, or, sql } from 'drizzle-orm'
import type { NewTask, Task, TaskMove, TaskPatch } from '../../../shared/domain'
import type { Db } from '../client'
import { tasks } from '../schema'

export function createTasksRepository(db: Db) {
  const getById = (id: number): Task => {
    const task = db.select().from(tasks).where(eq(tasks.id, id)).get()
    if (!task) throw new Error(`Task ${id} not found`)
    return task
  }

  const nextPosition = (listId: number): number => {
    const row = db
      .select({ value: max(tasks.position) })
      .from(tasks)
      .where(eq(tasks.listId, listId))
      .get()
    return (row?.value ?? 0) + 1
  }

  /** Rewrites a list's positions as 1, 2, 3… keeping the current order. */
  const renumber = (listId: number): void => {
    const ordered = db
      .select({ id: tasks.id })
      .from(tasks)
      .where(eq(tasks.listId, listId))
      .orderBy(asc(tasks.position))
      .all()
    ordered.forEach(({ id }, index) => {
      db.update(tasks)
        .set({ position: index + 1 })
        .where(eq(tasks.id, id))
        .run()
    })
  }

  /** Position between two neighbors in a list; renumbers when floats get too close. */
  const positionBetween = (
    listId: number,
    prevId: number | null,
    nextId: number | null
  ): number => {
    const neighbor = (id: number | null): Task | null => {
      if (id === null) return null
      const task = getById(id)
      if (task.listId !== listId) throw new Error(`Task ${id} is not in list ${listId}`)
      return task
    }
    let prev = neighbor(prevId)
    let next = neighbor(nextId)
    if (prev && next && next.position - prev.position < 1e-6) {
      renumber(listId)
      prev = getById(prev.id)
      next = getById(next.id)
    }
    if (prev && next) return (prev.position + next.position) / 2
    if (prev) return prev.position + 1
    if (next) return next.position - 1
    return nextPosition(listId)
  }

  return {
    getById,

    getByList(listId: number): Task[] {
      return db
        .select()
        .from(tasks)
        .where(eq(tasks.listId, listId))
        .orderBy(asc(tasks.position))
        .all()
    },

    /**
     * Tasks with a due date up to `until` (inclusive) for the smart views. Done tasks are
     * included only when completed at or after `completedSince`, so a just-finished task can
     * stay visible for a moment.
     */
    getDue(until: string, completedSince: number): Task[] {
      return db
        .select()
        .from(tasks)
        .where(
          and(
            isNotNull(tasks.dueDate),
            lte(tasks.dueDate, until),
            or(ne(tasks.status, 'done'), gte(tasks.completedAt, completedSince))
          )
        )
        .orderBy(asc(tasks.dueDate), asc(tasks.position))
        .all()
    },

    create(input: NewTask, now = Date.now()): Task {
      const title = input.title.trim()
      if (!title) throw new Error('Task title cannot be empty')
      const status = input.status ?? 'todo'
      return db
        .insert(tasks)
        .values({
          ...input,
          title,
          status,
          dueTime: input.dueDate ? (input.dueTime ?? null) : null,
          position: nextPosition(input.listId),
          completedAt: status === 'done' ? now : null,
          createdAt: now,
          updatedAt: now
        })
        .returning()
        .get()
    },

    update(id: number, patch: TaskPatch, now = Date.now()): Task {
      const current = getById(id)
      const next = { ...patch, updatedAt: now }
      if (patch.title !== undefined) {
        next.title = patch.title.trim()
        if (!next.title) throw new Error('Task title cannot be empty')
      }
      if (patch.status !== undefined && patch.status !== current.status) {
        Object.assign(next, { completedAt: patch.status === 'done' ? now : null })
      }
      if (patch.dueDate === null) next.dueTime = null
      if (patch.listId !== undefined && patch.listId !== current.listId) {
        Object.assign(next, { position: nextPosition(patch.listId) })
      }
      return db.update(tasks).set(next).where(eq(tasks.id, id)).returning().get()
    },

    /** Reorders and/or changes the status of a task (drag and drop). */
    move(id: number, target: TaskMove, now = Date.now()): Task {
      const current = getById(id)
      return db.transaction(() => {
        const repositions = target.prevId !== undefined || target.nextId !== undefined
        const position =
          target.position ??
          (repositions
            ? positionBetween(current.listId, target.prevId ?? null, target.nextId ?? null)
            : current.position)
        const statusChanges = target.status !== undefined && target.status !== current.status
        return db
          .update(tasks)
          .set({
            position,
            ...(statusChanges && {
              status: target.status,
              completedAt: target.status === 'done' ? now : null
            }),
            updatedAt: now
          })
          .where(eq(tasks.id, id))
          .returning()
          .get()
      })
    },

    /** Case-insensitive match on title or notes, most recently updated first. */
    search(query: string, limit = 30): Task[] {
      const trimmed = query.trim()
      if (!trimmed) return []
      const pattern = `%${trimmed.replace(/[\\%_]/g, (char) => `\\${char}`)}%`
      return db
        .select()
        .from(tasks)
        .where(
          or(
            sql`${tasks.title} LIKE ${pattern} ESCAPE '\\'`,
            sql`${tasks.notes} LIKE ${pattern} ESCAPE '\\'`
          )
        )
        .orderBy(desc(tasks.updatedAt))
        .limit(limit)
        .all()
    },

    remove(id: number): Task {
      const task = getById(id)
      db.delete(tasks).where(eq(tasks.id, id)).run()
      return task
    },

    /** Puts back a task returned by remove(), keeping its id and position (undo). */
    restore(task: Task): Task {
      return db.insert(tasks).values(task).returning().get()
    }
  }
}

export type TasksRepository = ReturnType<typeof createTasksRepository>
