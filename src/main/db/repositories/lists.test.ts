import { beforeEach, describe, expect, it } from 'vitest'
import { INBOX_NAME } from '../client'
import { openTestDatabase } from '../test-db'
import { createListsRepository, type ListsRepository } from './lists'
import { createTasksRepository, type TasksRepository } from './tasks'

let lists: ListsRepository
let tasks: TasksRepository

beforeEach(() => {
  const db = openTestDatabase()
  lists = createListsRepository(db)
  tasks = createTasksRepository(db)
})

describe('lists repository', () => {
  it('seeds a single Inbox', () => {
    const all = lists.getAll()
    expect(all).toHaveLength(1)
    expect(all[0]).toMatchObject({ name: INBOX_NAME, isInbox: true, viewMode: 'list' })
  })

  it('names a list without a name after its creation time', () => {
    const list = lists.create('   ', new Date(2026, 9, 23, 14, 5, 9))
    expect(list.name).toBe('23/10/26 - 14:05:09')
  })

  it('appends new lists after existing ones', () => {
    const a = lists.create('A')
    const b = lists.create('B')
    expect(b.position).toBeGreaterThan(a.position)
    expect(lists.getAll().map((list) => list.name)).toEqual([INBOX_NAME, 'A', 'B'])
  })

  it('protects the Inbox from rename and delete', () => {
    const inbox = lists.getInbox()
    expect(() => lists.rename(inbox.id, 'Outra')).toThrow()
    expect(() => lists.remove(inbox.id, 'delete-tasks')).toThrow()
  })

  it('stores the view mode per list', () => {
    const list = lists.create('A')
    expect(lists.setViewMode(list.id, 'columns').viewMode).toBe('columns')
    expect(lists.getInbox().viewMode).toBe('list')
  })

  it('deletes a list together with its tasks', () => {
    const list = lists.create('A')
    tasks.create({ listId: list.id, title: 'x' })
    lists.remove(list.id, 'delete-tasks')
    expect(lists.getAll()).toHaveLength(1)
    expect(tasks.getByList(list.id)).toEqual([])
  })

  it('moves tasks to the Inbox when asked', () => {
    const list = lists.create('A')
    const task = tasks.create({ listId: list.id, title: 'x' })
    lists.remove(list.id, 'move-to-inbox')
    expect(tasks.getById(task.id).listId).toBe(lists.getInbox().id)
  })

  describe('move', () => {
    const names = (): string[] =>
      lists
        .getAll()
        .filter((list) => !list.isInbox)
        .map((list) => list.name)

    it('places a list between two others, at the top and at the bottom', () => {
      const a = lists.create('A')
      const b = lists.create('B')
      const c = lists.create('C')
      lists.move(c.id, { prevId: a.id, nextId: b.id })
      expect(names()).toEqual(['A', 'C', 'B'])
      lists.move(b.id, { prevId: null, nextId: a.id })
      expect(names()).toEqual(['B', 'A', 'C'])
      lists.move(b.id, { prevId: c.id, nextId: null })
      expect(names()).toEqual(['A', 'C', 'B'])
    })

    it('renumbers when positions get too close', () => {
      lists.create('A')
      const b = lists.create('B')
      const c = lists.create('C')
      for (let i = 0; i < 60; i++) {
        const [first, second] = lists.getAll().filter((list) => !list.isInbox)
        const mover = [b, c].find((list) => list.id !== second.id && list.id !== first.id)!
        lists.move(mover.id, { prevId: first.id, nextId: second.id })
      }
      const positions = lists.getAll().map((list) => list.position)
      expect(new Set(positions).size).toBe(positions.length)
      expect(names()[0]).toBe('A')
    })

    it('never moves the Inbox or uses it as a neighbor', () => {
      const a = lists.create('A')
      const inbox = lists.getInbox()
      expect(() => lists.move(inbox.id, { prevId: a.id, nextId: null })).toThrow()
      expect(() => lists.move(a.id, { prevId: inbox.id, nextId: null })).toThrow()
    })
  })
})
