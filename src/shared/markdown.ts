import type { Priority, Task, TaskStatus } from './domain'

export interface MarkdownSection {
  /** Rendered as `## heading`; omit for a section without a heading. */
  heading?: string
  tasks: Task[]
}

export interface MarkdownDocument {
  title: string
  sections: MarkdownSection[]
}

const PRIORITY_TAGS: Record<Priority, string | null> = {
  0: null,
  1: '!baixa',
  2: '!média',
  3: '!alta',
  4: '!crítico'
}
const STATUS_TAGS: Record<TaskStatus, string | null> = {
  todo: null,
  doing: '⏳ fazendo',
  done: null
}

/** One GFM task line, e.g. `- [ ] Título — ⏳ fazendo · 📅 2026-10-25 09:30 · !alta`. */
export function taskToMarkdown(task: Task): string {
  const box = task.status === 'done' ? '[x]' : '[ ]'
  const due = task.dueDate ? `📅 ${[task.dueDate, task.dueTime].filter(Boolean).join(' ')}` : null
  const tags = [STATUS_TAGS[task.status], due, PRIORITY_TAGS[task.priority]].filter(Boolean)
  const title = task.title.replace(/\s*\n\s*/g, ' ')
  const line = `- ${box} ${title}${tags.length ? ` — ${tags.join(' · ')}` : ''}`
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
