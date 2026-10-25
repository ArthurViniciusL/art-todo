import type { Task } from './domain'

/** Local calendar day as `YYYY-MM-DD`. */
export function toIsoDate(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Parses `YYYY-MM-DD` as a local date at midnight. */
export function fromIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(iso: string, days: number): string {
  const date = fromIsoDate(iso)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

/** Number of calendar days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((fromIsoDate(to).getTime() - fromIsoDate(from).getTime()) / 86_400_000)
}

/** Smart view order: timed tasks first by time, then higher priority, then manual position. */
export function compareByTimeAndPriority(a: Task, b: Task): number {
  if (a.dueTime !== b.dueTime) {
    if (a.dueTime === null) return 1
    if (b.dueTime === null) return -1
    return a.dueTime < b.dueTime ? -1 : 1
  }
  if (a.priority !== b.priority) return b.priority - a.priority
  return a.position - b.position
}

export interface TaskGroup {
  id: string
  /** `YYYY-MM-DD` for a single day; null for groups that span several days. */
  date: string | null
  tasks: Task[]
}

/** "Hoje" view: overdue tasks, then tasks due today. Empty groups are dropped. */
export function groupToday(tasks: Task[], today: string): TaskGroup[] {
  const overdue = tasks.filter((task) => task.dueDate !== null && task.dueDate < today)
  const dueToday = tasks.filter((task) => task.dueDate === today)
  return [
    { id: 'overdue', date: null, tasks: overdue.sort(compareOverdue) },
    { id: 'today', date: today, tasks: dueToday.sort(compareByTimeAndPriority) }
  ].filter((group) => group.tasks.length > 0)
}

function compareOverdue(a: Task, b: Task): number {
  if (a.dueDate !== b.dueDate) return (a.dueDate ?? '') < (b.dueDate ?? '') ? -1 : 1
  return compareByTimeAndPriority(a, b)
}

export const UPCOMING_DAYS = 7

/** "Próximos" view: one group per day for the next 7 days, then "Depois". Empty groups are dropped. */
export function groupUpcoming(tasks: Task[], today: string): TaskGroup[] {
  const lastDay = addDays(today, UPCOMING_DAYS)
  const groups: TaskGroup[] = []
  for (let offset = 1; offset <= UPCOMING_DAYS; offset++) {
    const date = addDays(today, offset)
    groups.push({
      id: date,
      date,
      tasks: tasks.filter((task) => task.dueDate === date).sort(compareByTimeAndPriority)
    })
  }
  groups.push({
    id: 'later',
    date: null,
    tasks: tasks
      .filter((task) => task.dueDate !== null && task.dueDate > lastDay)
      .sort((a, b) => compareOverdue(a, b))
  })
  return groups.filter((group) => group.tasks.length > 0)
}
