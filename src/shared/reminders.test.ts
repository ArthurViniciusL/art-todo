import { describe, expect, it } from 'vitest'
import { alertAt, initialRemindedAt } from './reminders'

describe('alertAt', () => {
  it('uses the due time, or 06:00 for date-only tasks', () => {
    expect(alertAt({ dueDate: '2026-10-27', dueTime: '14:30' })).toBe(
      new Date(2026, 9, 27, 14, 30).getTime()
    )
    expect(alertAt({ dueDate: '2026-10-27', dueTime: null })).toBe(
      new Date(2026, 9, 27, 6, 0).getTime()
    )
    expect(alertAt({ dueDate: null, dueTime: null })).toBeNull()
  })
})

describe('initialRemindedAt', () => {
  const now = new Date(2026, 9, 27, 10, 0).getTime()

  it('skips alerts already in the past', () => {
    expect(initialRemindedAt({ dueDate: '2026-10-27', dueTime: null }, now)).toBe(now)
    expect(initialRemindedAt({ dueDate: '2026-10-27', dueTime: '09:59' }, now)).toBe(now)
  })

  it('keeps future alerts pending', () => {
    expect(initialRemindedAt({ dueDate: '2026-10-27', dueTime: '10:01' }, now)).toBeNull()
    expect(initialRemindedAt({ dueDate: '2026-10-28', dueTime: null }, now)).toBeNull()
    expect(initialRemindedAt({ dueDate: null, dueTime: null }, now)).toBeNull()
  })
})
