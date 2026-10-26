import {
  LIST_SORTS,
  PRIORITIES,
  SMART_VIEW_IDS,
  TASK_STATUSES,
  VIEW_MODES,
  type ListDeleteMode,
  type ListMove,
  type ListSort,
  type NewTask,
  type Priority,
  type SmartView,
  type Task,
  type TaskMove,
  type TaskPatch,
  type TaskStatus,
  type ViewMode
} from './domain'
import { isHexColor } from './color'
import { isThemePreference, type ThemePreference } from './theme'

/** Guards for values that cross the IPC boundary. Each throws on invalid input. */

export class ValidationError extends Error {}

function fail(what: string, value: unknown): never {
  throw new ValidationError(`Invalid ${what}: ${JSON.stringify(value)}`)
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

export function id(value: unknown): number {
  return Number.isSafeInteger(value) && (value as number) > 0
    ? (value as number)
    : fail('id', value)
}

export function text(value: unknown, what = 'text'): string {
  return typeof value === 'string' ? value : fail(what, value)
}

export function optionalText(value: unknown, what = 'text'): string | undefined {
  return value === undefined ? undefined : text(value, what)
}

export function theme(value: unknown): ThemePreference {
  return isThemePreference(value) ? value : fail('theme', value)
}

export function nullableHexColor(value: unknown): string | null {
  return value === null || isHexColor(value)
    ? ((value as string | null)?.toLowerCase() ?? null)
    : fail('color', value)
}

export function viewMode(value: unknown): ViewMode {
  return VIEW_MODES.includes(value as ViewMode) ? (value as ViewMode) : fail('view mode', value)
}

export function smartView(value: unknown): SmartView {
  return SMART_VIEW_IDS.includes(value as SmartView) ? (value as SmartView) : fail('view', value)
}

export function listSort(value: unknown): ListSort {
  return LIST_SORTS.includes(value as ListSort) ? (value as ListSort) : fail('list sort', value)
}

export function listMove(value: unknown): ListMove {
  if (!isObject(value)) fail('list move', value)
  const neighbor = (v: unknown): number | null => (v === null || v === undefined ? null : id(v))
  return { prevId: neighbor(value.prevId), nextId: neighbor(value.nextId) }
}

export function listDeleteMode(value: unknown): ListDeleteMode {
  return value === 'delete-tasks' || value === 'move-to-inbox' ? value : fail('delete mode', value)
}

function status(value: unknown): TaskStatus {
  return TASK_STATUSES.includes(value as TaskStatus) ? (value as TaskStatus) : fail('status', value)
}

function priority(value: unknown): Priority {
  return PRIORITIES.includes(value as Priority) ? (value as Priority) : fail('priority', value)
}

function nullableDate(value: unknown): string | null {
  return value === null || (typeof value === 'string' && DATE_RE.test(value))
    ? value
    : fail('date', value)
}

function nullableTime(value: unknown): string | null {
  return value === null || (typeof value === 'string' && TIME_RE.test(value))
    ? value
    : fail('time', value)
}

export function isoDate(value: unknown): string {
  return typeof value === 'string' && DATE_RE.test(value) ? value : fail('date', value)
}

export function timestamp(value: unknown): number {
  return Number.isSafeInteger(value) && (value as number) >= 0
    ? (value as number)
    : fail('timestamp', value)
}

export function taskPatch(value: unknown): TaskPatch {
  if (!isObject(value)) fail('task patch', value)
  const patch: TaskPatch = {}
  if (value.listId !== undefined) patch.listId = id(value.listId)
  if (value.title !== undefined) patch.title = text(value.title, 'title')
  if (value.notes !== undefined) patch.notes = text(value.notes, 'notes')
  if (value.status !== undefined) patch.status = status(value.status)
  if (value.priority !== undefined) patch.priority = priority(value.priority)
  if (value.dueDate !== undefined) patch.dueDate = nullableDate(value.dueDate)
  if (value.dueTime !== undefined) patch.dueTime = nullableTime(value.dueTime)
  return patch
}

export function taskMove(value: unknown): TaskMove {
  if (!isObject(value)) fail('move', value)
  const neighbor = (v: unknown): number | null => (v === null ? null : id(v))
  const move: TaskMove = {}
  if (value.prevId !== undefined) move.prevId = neighbor(value.prevId)
  if (value.nextId !== undefined) move.nextId = neighbor(value.nextId)
  if (value.position !== undefined) {
    move.position = Number.isFinite(value.position)
      ? (value.position as number)
      : fail('position', value.position)
  }
  if (value.status !== undefined) move.status = status(value.status)
  if (value.listId !== undefined) move.listId = id(value.listId)
  return move
}

export function newTask(value: unknown): NewTask {
  if (!isObject(value)) fail('new task', value)
  return { ...taskPatch(value), listId: id(value.listId), title: text(value.title, 'title') }
}

export function task(value: unknown): Task {
  if (!isObject(value)) fail('task', value)
  const timestamp = (v: unknown): number =>
    Number.isSafeInteger(v) ? (v as number) : fail('timestamp', v)
  return {
    ...newTask(value),
    id: id(value.id),
    notes: text(value.notes, 'notes'),
    status: status(value.status),
    priority: priority(value.priority),
    dueDate: nullableDate(value.dueDate),
    dueTime: nullableTime(value.dueTime),
    position:
      typeof value.position === 'number' ? value.position : fail('position', value.position),
    completedAt: value.completedAt === null ? null : timestamp(value.completedAt),
    remindedAt: value.remindedAt === null ? null : timestamp(value.remindedAt),
    createdAt: timestamp(value.createdAt),
    updatedAt: timestamp(value.updatedAt)
  }
}
