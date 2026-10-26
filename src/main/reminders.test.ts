import { beforeEach, describe, expect, it } from 'vitest'
import { createListsRepository } from './db/repositories/lists'
import { createTasksRepository, type TasksRepository } from './db/repositories/tasks'
import { openTestDatabase } from './db/test-db'
import { collectReminders } from './reminders'

let tasks: TasksRepository
let inboxId: number
const at = (day: number, hour: number, minute = 0): number =>
  new Date(2026, 9, day, hour, minute).getTime()

beforeEach(() => {
  const db = openTestDatabase()
  tasks = createTasksRepository(db)
  inboxId = createListsRepository(db).getInbox().id
})

describe('collectReminders', () => {
  it('fires a timed task at its time, once', () => {
    const task = tasks.create(
      { listId: inboxId, title: 'Dentista', dueDate: '2026-10-27', dueTime: '14:30' },
      at(27, 9)
    )
    expect(collectReminders(tasks, at(27, 14, 29))).toEqual([])
    expect(collectReminders(tasks, at(27, 14, 30))).toEqual([
      { title: 'Dentista', body: 'Hoje às 14:30', target: { taskId: task.id, listId: inboxId } }
    ])
    expect(collectReminders(tasks, at(27, 14, 31))).toEqual([])
  })

  it('fires date-only tasks at 06:00', () => {
    tasks.create({ listId: inboxId, title: 'Pagar luz', dueDate: '2026-10-28' }, at(27, 9))
    expect(collectReminders(tasks, at(28, 5, 59))).toEqual([])
    expect(collectReminders(tasks, at(28, 6))).toMatchObject([{ title: 'Pagar luz', body: 'Hoje' }])
  })

  it('sums up several alerts due at once and marks a missed one as overdue', () => {
    tasks.create({ listId: inboxId, title: 'a', dueDate: '2026-10-28' }, at(27, 9))
    tasks.create(
      { listId: inboxId, title: 'b', dueDate: '2026-10-28', dueTime: '08:00' },
      at(27, 9)
    )
    expect(collectReminders(tasks, at(28, 9))).toEqual([
      { title: 'Art Todo', body: '2 tarefas pedem atenção', target: null }
    ])

    tasks.create({ listId: inboxId, title: 'c', dueDate: '2026-10-29' }, at(27, 9))
    expect(collectReminders(tasks, at(30, 9))).toMatchObject([{ title: 'c', body: 'Atrasada' }])
  })

  it('skips done tasks', () => {
    const task = tasks.create({ listId: inboxId, title: 'x', dueDate: '2026-10-28' }, at(27, 9))
    tasks.update(task.id, { status: 'done' }, at(27, 10))
    expect(collectReminders(tasks, at(28, 7))).toEqual([])
  })
})
