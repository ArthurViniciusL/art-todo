import { beforeEach, describe, expect, it } from 'vitest'
import { openTestDatabase } from '../test-db'
import { createListsRepository } from './lists'
import { createTasksRepository, type TasksRepository } from './tasks'

let tasks: TasksRepository
let inboxId: number
let otherListId: number

beforeEach(() => {
  const db = openTestDatabase()
  const lists = createListsRepository(db)
  tasks = createTasksRepository(db)
  inboxId = lists.getInbox().id
  otherListId = lists.create('Outra').id
})

describe('tasks repository', () => {
  it('creates a task with defaults', () => {
    const task = tasks.create({ listId: inboxId, title: '  Comprar pão ' }, 1000)
    expect(task).toMatchObject({
      title: 'Comprar pão',
      notes: '',
      status: 'todo',
      priority: 0,
      dueDate: null,
      dueTime: null,
      completedAt: null,
      createdAt: 1000,
      updatedAt: 1000
    })
  })

  it('rejects an empty title', () => {
    expect(() => tasks.create({ listId: inboxId, title: '  ' })).toThrow()
  })

  it('orders tasks by position within a list', () => {
    tasks.create({ listId: inboxId, title: 'a' })
    tasks.create({ listId: inboxId, title: 'b' })
    expect(tasks.getByList(inboxId).map((task) => task.title)).toEqual(['a', 'b'])
  })

  it('sets and clears completedAt with the done status', () => {
    const task = tasks.create({ listId: inboxId, title: 'a' })
    expect(tasks.update(task.id, { status: 'doing' }, 2000).completedAt).toBeNull()
    expect(tasks.update(task.id, { status: 'done' }, 3000).completedAt).toBe(3000)
    expect(tasks.update(task.id, { status: 'todo' }, 4000).completedAt).toBeNull()
  })

  it('drops the time when the date is cleared', () => {
    const task = tasks.create({
      listId: inboxId,
      title: 'a',
      dueDate: '2026-10-25',
      dueTime: '09:30'
    })
    expect(task.dueTime).toBe('09:30')
    expect(tasks.update(task.id, { dueDate: null })).toMatchObject({ dueDate: null, dueTime: null })
  })

  it('ignores a time without a date on create', () => {
    expect(tasks.create({ listId: inboxId, title: 'a', dueTime: '09:30' }).dueTime).toBeNull()
  })

  it('appends a moved task to the end of the target list', () => {
    tasks.create({ listId: otherListId, title: 'existing' })
    const task = tasks.create({ listId: inboxId, title: 'moved' })
    tasks.update(task.id, { listId: otherListId })
    expect(tasks.getByList(otherListId).map((t) => t.title)).toEqual(['existing', 'moved'])
  })

  it('restores a removed task with the same id and position (undo)', () => {
    const task = tasks.create({ listId: inboxId, title: 'a' })
    const removed = tasks.remove(task.id)
    expect(tasks.getByList(inboxId)).toEqual([])
    expect(tasks.restore(removed)).toEqual(task)
  })
})
