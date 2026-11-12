import {
  TASK_STATUSES,
  type ListlessNewTask,
  type Priority,
  type Task,
  type TaskStatus
} from './domain'
import { isIsoDate, isTime } from './dates'

export interface MarkdownSection {
  /** Rendered as `## heading`; omit for a section without a heading. */
  heading?: string
  tasks: Task[]
}

export interface MarkdownDocument {
  title: string
  sections: MarkdownSection[]
}

/** English field values used in the file format. The UI shows them in PT-BR. */
const PRIORITY_NAMES: Record<Priority, string> = {
  0: 'none',
  1: 'low',
  2: 'medium',
  3: 'high',
  4: 'critical'
}

const FIELD_SEPARATOR = ' | '
/** Reads ` | ` with any amount of space around the bar, but not a bare `|`. */
const FIELD_SPLIT = /\s+\|\s+/

/** One GFM task line, e.g. `- [ ] Relatório | status: doing | due: 2026-10-25 09:30 | priority: high`. */
export function taskToMarkdown(task: Task): string {
  const box = task.status === 'done' ? '[x]' : '[ ]'
  const fields: string[] = []
  fields.push(`status: ${task.status}`)
  if (task.dueDate) fields.push(`due: ${[task.dueDate, task.dueTime].filter(Boolean).join(' ')}`)
  if (task.priority) fields.push(`priority: ${PRIORITY_NAMES[task.priority]}`)
  const title = task.title.replace(/\s*\n\s*/g, ' ')
  const line = `- ${box} ${[title, ...fields].join(FIELD_SEPARATOR)}`
  const notes = task.notes.trim()
  if (!notes) return line
  const indented = notes
    .split('\n')
    .map((note) => (note.trim() ? `  ${note.trimEnd()}` : ''))
    .join('\n')
  return `${line}\n${indented}`
}

/** A whole document: `# title`, then each non-empty section. Ends with a newline. */
export function toMarkdown({ title, sections }: MarkdownDocument): string {
  const blocks = [`# ${title}`]
  for (const section of sections) {
    if (section.tasks.length === 0) continue
    const lines = section.tasks.map(taskToMarkdown).join('\n')
    blocks.push(section.heading ? `## ${section.heading}\n\n${lines}` : lines)
  }
  return `${blocks.join('\n\n')}\n`
}

/** File name for an export. `/` and `:` (and other unsafe characters) become `-`. */
export function markdownFileName(title: string): string {
  const safe = title
    // eslint-disable-next-line no-control-regex
    .replace(/[/\\:*?"<>|\u0000-\u001f]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '')
  return `${safe || 'tarefas'}.md`
}

export type ImportedTask = ListlessNewTask & { notes: string; status: TaskStatus }

export interface MarkdownImport {
  tasks: ImportedTask[]
  /** Non-blank lines that are neither a task, a note nor a heading. */
  ignoredLines: number
}

const TASK_LINE = /^[-*+]\s+(?:\[([ xX])\](?:\s+|$))?(.*)$/
const fold = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase()

/** Applies one `key: value` field to `task`; false when the segment is not a valid field. */
function applyField(segment: string, task: ImportedTask): boolean {
  const match = /^(\w+)\s*:\s*(.+)$/.exec(segment.trim())
  if (!match) return false
  const key = fold(match[1])
  const value = match[2].trim()
  if (key === 'status') {
    const status = TASK_STATUSES.find((s) => s === fold(value))
    if (!status) return false
    task.status = status
    return true
  }
  if (key === 'priority') {
    const entry = Object.entries(PRIORITY_NAMES).find(([, name]) => name === fold(value))
    if (!entry) return false
    task.priority = Number(entry[0]) as Priority
    return true
  }
  if (key === 'due') {
    const [date, time, ...rest] = value.split(/\s+/)
    if (rest.length || !isIsoDate(date) || (time !== undefined && !isTime(time))) return false
    task.dueDate = date
    task.dueTime = time ?? null
    return true
  }
  return false
}

/** Parses one task line body (after the checkbox) into title and fields. */
function parseTaskBody(body: string, checked: boolean): ImportedTask {
  const task: ImportedTask = { title: '', notes: '', status: checked ? 'done' : 'todo' }
  const segments = body.split(FIELD_SPLIT)
  // Fields are read from the end; the first segment that is not a field ends them,
  // so a title may itself contain ` | `.
  let titleEnd = segments.length
  while (titleEnd > 1 && applyField(segments[titleEnd - 1], task)) titleEnd--
  task.title = segments.slice(0, titleEnd).join(FIELD_SEPARATOR).trim()
  return task
}

/**
 * Reads tasks from Markdown in the export format. Headings are ignored, indented lines
 * after a task become its notes, and every other non-blank line is counted as ignored.
 */
export function parseMarkdownTasks(text: string): MarkdownImport {
  const tasks: ImportedTask[] = []
  let ignoredLines = 0
  let current: { task: ImportedTask; notes: string[] } | null = null

  const finish = (): void => {
    if (!current) return
    current.task.notes = current.notes.join('\n').trim()
    if (current.task.title) tasks.push(current.task)
    else ignoredLines++
    current = null
  }

  for (const raw of text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')) {
    const line = raw.replace(/\t/g, '  ').trimEnd()
    if (!line.trim()) {
      current?.notes.push('')
      continue
    }
    if (current && /^ {2}/.test(line)) {
      current.notes.push(line.slice(2))
      continue
    }
    finish()
    if (/^#{1,6}\s/.test(line)) continue
    const match = TASK_LINE.exec(line)
    if (!match) {
      ignoredLines++
      continue
    }
    current = {
      task: parseTaskBody(match[2], match[1] !== undefined && match[1] !== ' '),
      notes: []
    }
  }
  finish()
  return { tasks, ignoredLines }
}
