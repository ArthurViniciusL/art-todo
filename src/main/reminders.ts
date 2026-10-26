import { toIsoDate } from '../shared/dates'
import type { ReminderTarget } from '../shared/ipc'
import { alertAt } from '../shared/reminders'
import type { TasksRepository } from './db/repositories/tasks'

export interface Reminder {
  title: string
  body: string
  target: ReminderTarget
}

type ReminderSource = Pick<TasksRepository, 'getReminderCandidates' | 'markReminded'>

const CHECK_INTERVAL_MS = 30_000

/**
 * Alerts due at `now`, marked as fired. One alert per task; when several are due at once (at
 * startup after a while closed, or at 06:00 for date-only tasks), a single summary instead.
 */
export function collectReminders(tasks: ReminderSource, now: number): Reminder[] {
  const today = toIsoDate(new Date(now))
  const due = tasks.getReminderCandidates(today).filter((task) => alertAt(task)! <= now)
  if (due.length === 0) return []
  tasks.markReminded(
    due.map((task) => task.id),
    now
  )
  if (due.length > 1) {
    return [{ title: 'Art Todo', body: `${due.length} tarefas pedem atenção`, target: null }]
  }
  const [task] = due
  const when =
    task.dueDate === today ? (task.dueTime ? `Hoje às ${task.dueTime}` : 'Hoje') : 'Atrasada'
  return [{ title: task.title, body: when, target: { taskId: task.id, listId: task.listId } }]
}

/** Checks for due alerts now and then every 30 s while the app runs. */
export function startReminders(tasks: ReminderSource, notify: (reminder: Reminder) => void): void {
  const check = (): void => collectReminders(tasks, Date.now()).forEach(notify)
  check()
  setInterval(check, CHECK_INTERVAL_MS)
}
