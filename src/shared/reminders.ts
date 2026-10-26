import { fromIsoDate } from './dates'
import type { Task } from './domain'

/** Alert time for tasks that have a date but no time. */
export const DEFAULT_ALERT_TIME = '06:00'

/** When a task's alert fires, in epoch ms (local time); null without a due date. */
export function alertAt(task: Pick<Task, 'dueDate' | 'dueTime'>): number | null {
  if (!task.dueDate) return null
  const [hours, minutes] = (task.dueTime ?? DEFAULT_ALERT_TIME).split(':').map(Number)
  const date = fromIsoDate(task.dueDate)
  date.setHours(hours, minutes)
  return date.getTime()
}

/**
 * `remindedAt` for a task whose date or time was just set: alerts already in the past are
 * marked done at once, so creating or editing a task never fires an alert for the past.
 */
export function initialRemindedAt(
  task: Pick<Task, 'dueDate' | 'dueTime'>,
  now: number
): number | null {
  const at = alertAt(task)
  return at !== null && at <= now ? now : null
}
