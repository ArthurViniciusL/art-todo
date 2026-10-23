import { describe, expect, it } from 'vitest'
import * as v from './validate'

describe('validate', () => {
  it('accepts positive integer ids only', () => {
    expect(v.id(3)).toBe(3)
    expect(() => v.id(0)).toThrow(v.ValidationError)
    expect(() => v.id('3')).toThrow(v.ValidationError)
    expect(() => v.id(1.5)).toThrow(v.ValidationError)
  })

  it('keeps only known fields in a task patch', () => {
    expect(v.taskPatch({ title: 'a', status: 'doing', extra: 1 })).toEqual({
      title: 'a',
      status: 'doing'
    })
  })

  it('rejects bad dates, times, statuses and priorities', () => {
    expect(() => v.taskPatch({ dueDate: '2026-13-01' })).toThrow()
    expect(() => v.taskPatch({ dueTime: '24:00' })).toThrow()
    expect(() => v.taskPatch({ status: 'later' })).toThrow()
    expect(() => v.taskPatch({ priority: 4 })).toThrow()
  })

  it('allows clearing the date and time with null', () => {
    expect(v.taskPatch({ dueDate: null, dueTime: null })).toEqual({ dueDate: null, dueTime: null })
  })

  it('requires listId and title for a new task', () => {
    expect(v.newTask({ listId: 1, title: 'a' })).toEqual({ listId: 1, title: 'a' })
    expect(() => v.newTask({ title: 'a' })).toThrow()
  })
})
