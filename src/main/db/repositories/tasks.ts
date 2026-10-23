import { asc, eq, max } from 'drizzle-orm'
import type { NewTask, Task, TaskPatch } from '../../../shared/domain'
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
