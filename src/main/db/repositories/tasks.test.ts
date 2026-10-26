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

  it('returns due tasks up to a date, skipping old done tasks', () => {
    tasks.create({ listId: inboxId, title: 'no date' })
    tasks.create({ listId: inboxId, title: 'overdue', dueDate: '2026-10-01' })
    tasks.create({ listId: otherListId, title: 'today', dueDate: '2026-10-25' })
    tasks.create({ listId: inboxId, title: 'far', dueDate: '2027-01-01' })
    const oldDone = tasks.create({ listId: inboxId, title: 'old done', dueDate: '2026-10-20' })
    tasks.update(oldDone.id, { status: 'done' }, 1000)
    const recentDone = tasks.create({
      listId: inboxId,
      title: 'recent done',
      dueDate: '2026-10-25'
    })
    tasks.update(recentDone.id, { status: 'done' }, 5000)

    expect(tasks.getDue('2026-10-25', 4000).map((t) => t.title)).toEqual([
      'overdue',
      'today',
      'recent done'
    ])
  })

  describe('move', () => {
    const order = (): string[] => tasks.getByList(inboxId).map((t) => t.title)

    it('places a task between two neighbors', () => {
      const a = tasks.create({ listId: inboxId, title: 'a' })
      const b = tasks.create({ listId: inboxId, title: 'b' })
      const c = tasks.create({ listId: inboxId, title: 'c' })
      tasks.move(c.id, { prevId: a.id, nextId: b.id })
      expect(order()).toEqual(['a', 'c', 'b'])
    })

    it('moves to the top and to the bottom', () => {
      const a = tasks.create({ listId: inboxId, title: 'a' })
      const b = tasks.create({ listId: inboxId, title: 'b' })
      tasks.move(b.id, { prevId: null, nextId: a.id })
      expect(order()).toEqual(['b', 'a'])
      tasks.move(b.id, { prevId: a.id, nextId: null })
      expect(order()).toEqual(['a', 'b'])
    })

    it('renumbers when positions get too close', () => {
      tasks.create({ listId: inboxId, title: 'a' })
      const b = tasks.create({ listId: inboxId, title: 'b' })
      const c = tasks.create({ listId: inboxId, title: 'c' })
      const d = tasks.create({ listId: inboxId, title: 'd' })
      // Keep inserting right after "a" until the gap collapses.
      for (let i = 0; i < 60; i++) {
        const [first, second] = tasks.getByList(inboxId)
        const mover = [b, c, d].find((t) => t.id !== second.id)!
        tasks.move(mover.id, { prevId: first.id, nextId: second.id })
      }
      const positions = tasks.getByList(inboxId).map((t) => t.position)
      expect(new Set(positions).size).toBe(4)
      expect(order()[0]).toBe('a')
    })

    it('changes the status without moving when no neighbor is given', () => {
      const a = tasks.create({ listId: inboxId, title: 'a' })
      const moved = tasks.move(a.id, { status: 'done' }, 9000)
      expect(moved).toMatchObject({ status: 'done', completedAt: 9000, position: a.position })
    })

    it('moves to another list, last or at an exact position', () => {
      const a = tasks.create({ listId: inboxId, title: 'a' })
      tasks.create({ listId: otherListId, title: 'x' })
      const moved = tasks.move(a.id, { listId: otherListId })
      expect(tasks.getByList(otherListId).map((t) => t.title)).toEqual(['x', 'a'])
      tasks.move(a.id, { listId: inboxId, position: a.position })
      expect(tasks.getById(a.id)).toMatchObject({ listId: inboxId, position: a.position })
      expect(moved.listId).toBe(otherListId)
      expect(() => tasks.move(a.id, { listId: 9999 })).toThrow()
    })

    it('rejects neighbors from another list', () => {
      const a = tasks.create({ listId: inboxId, title: 'a' })
      const other = tasks.create({ listId: otherListId, title: 'x' })
      expect(() => tasks.move(a.id, { prevId: other.id, nextId: null })).toThrow()
    })
  })

  describe('search', () => {
    it('matches title or notes, ignoring case', () => {
      tasks.create({ listId: inboxId, title: 'Comprar Pão' })
      tasks.create({ listId: otherListId, title: 'Ligar', notes: 'perguntar sobre o pão' })
      tasks.create({ listId: inboxId, title: 'Outra coisa' })
      expect(
        tasks
          .search('pão')
          .map((t) => t.title)
          .sort()
      ).toEqual(['Comprar Pão', 'Ligar'])
      expect(tasks.search('COMPRAR').map((t) => t.title)).toEqual(['Comprar Pão'])
    })

    it('treats % and _ literally and ignores blank queries', () => {
      tasks.create({ listId: inboxId, title: '100% feito' })
      tasks.create({ listId: inboxId, title: '1000 feito' })
      expect(tasks.search('100%').map((t) => t.title)).toEqual(['100% feito'])
      expect(tasks.search('   ')).toEqual([])
    })
  })
})
