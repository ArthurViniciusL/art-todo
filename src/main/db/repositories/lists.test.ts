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
})
