export type TaskStatus = 'todo' | 'doing' | 'done'
export const TASK_STATUSES: readonly TaskStatus[] = ['todo', 'doing', 'done']

/** 0 = none, 1 = low, 2 = medium, 3 = high, 4 = critical. */
export type Priority = 0 | 1 | 2 | 3 | 4
export const PRIORITIES: readonly Priority[] = [0, 1, 2, 3, 4]

export type ViewMode = 'list' | 'cards' | 'columns'
export const VIEW_MODES: readonly ViewMode[] = ['list', 'cards', 'columns']

/** Views that collect tasks from every list by due date. */
export type SmartView = 'today' | 'upcoming'
export const SMART_VIEW_IDS: readonly SmartView[] = ['today', 'upcoming']

export interface List {
  id: number
  name: string
  position: number
  viewMode: ViewMode
  isInbox: boolean
  createdAt: number
}

export interface Task {
  id: number
  listId: number
  title: string
  notes: string
  status: TaskStatus
  priority: Priority
  /** Local date, `YYYY-MM-DD`. */
  dueDate: string | null
  /** Local time, `HH:MM`. Only set together with dueDate. */
  dueTime: string | null
  position: number
  completedAt: number | null
  createdAt: number
  updatedAt: number
}

export interface NewTask {
  listId: number
  title: string
  notes?: string
  status?: TaskStatus
  priority?: Priority
  dueDate?: string | null
  dueTime?: string | null
}

export type TaskPatch = Partial<
  Pick<Task, 'listId' | 'title' | 'notes' | 'status' | 'priority' | 'dueDate' | 'dueTime'>
>

/**
 * Drag-and-drop target. `prevId` / `nextId` are the tasks that end up directly above and
 * below the moved task in its list (null at either end). Without either, the position stays.
 */
export interface TaskMove {
  prevId?: number | null
  nextId?: number | null
  /** Exact position, used to put a task back (undo). Wins over prevId / nextId. */
  position?: number
  status?: TaskStatus
  /** Target list. Neighbors refer to that list; without them or a position, the task goes last. */
  listId?: number
}

/** What happens to the tasks of a deleted list. */
export type ListDeleteMode = 'delete-tasks' | 'move-to-inbox'
