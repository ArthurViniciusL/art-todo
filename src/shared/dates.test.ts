import { describe, expect, it } from 'vitest'
import type { Task } from './domain'
import {
  addDays,
  compareByTimeAndPriority,
  daysBetween,
  groupToday,
  groupUpcoming,
  toIsoDate
} from './dates'

let nextId = 1
function task(overrides: Partial<Task>): Task {
  return {
    id: nextId++,
    listId: 1,
    title: 'task',
    notes: '',
    status: 'todo',
    priority: 0,
    dueDate: null,
    dueTime: null,
    position: nextId,
    completedAt: null,
    createdAt: 0,
    updatedAt: 0,
    ...overrides
  }
}

const titles = (tasks: Task[]): string[] => tasks.map((t) => t.title)

describe('date helpers', () => {
  it('formats local dates', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('adds days across month and year ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('counts days between dates', () => {
    expect(daysBetween('2026-10-25', '2026-10-27')).toBe(2)
    expect(daysBetween('2026-10-25', '2026-10-20')).toBe(-5)
  })
})

describe('compareByTimeAndPriority', () => {
  it('puts timed tasks first by time, then priority, then position', () => {
    const tasks = [
      task({ title: 'no time low', priority: 1 }),
      task({ title: '14:00', dueTime: '14:00' }),
      task({ title: 'no time high', priority: 3 }),
      task({ title: '09:00', dueTime: '09:00', priority: 0 })
    ]
    expect(titles(tasks.sort(compareByTimeAndPriority))).toEqual([
      '09:00',
      '14:00',
      'no time high',
      'no time low'
    ])
  })
})

describe('groupToday', () => {
  it('splits overdue and today, dropping empty groups', () => {
    const groups = groupToday(
      [
        task({ title: 'today', dueDate: '2026-10-25' }),
        task({ title: 'old', dueDate: '2026-10-20' }),
        task({ title: 'older', dueDate: '2026-10-01' }),
        task({ title: 'future', dueDate: '2026-10-26' })
      ],
      '2026-10-25'
    )
    expect(groups.map((g) => [g.id, titles(g.tasks)])).toEqual([
      ['overdue', ['older', 'old']],
      ['today', ['today']]
    ])
  })

  it('returns nothing when no task is due', () => {
    expect(groupToday([task({})], '2026-10-25')).toEqual([])
  })
})

describe('groupUpcoming', () => {
  it('groups the next 7 days by day and the rest under later', () => {
    const groups = groupUpcoming(
      [
        task({ title: 'today', dueDate: '2026-10-25' }),
        task({ title: 'tomorrow', dueDate: '2026-10-26' }),
        task({ title: 'day 7', dueDate: '2026-11-01' }),
        task({ title: 'day 8', dueDate: '2026-11-02' }),
        task({ title: 'no date' })
      ],
      '2026-10-25'
    )
    expect(groups.map((g) => [g.id, titles(g.tasks)])).toEqual([
      ['2026-10-26', ['tomorrow']],
      ['2026-11-01', ['day 7']],
      ['later', ['day 8']]
    ])
  })
})
