import type { List, Task, ViewMode } from '../../../shared/domain'
import type { MarkdownSection } from '../../../shared/markdown'
import { splitDone } from '../../../shared/ordering'

export interface ExportSource {
  title: string
  mode: ViewMode
  /** Open tasks in the view's order, already grouped (one untitled group for lists). */
  groups: MarkdownSection[]
  /** Done tasks the view knows about, newest first. */
  done: Task[]
}

/** A list's tasks as an export source, shaped like its view. */
export function listExportSource(list: List, tasks: Task[]): ExportSource {
  const { active, done } = splitDone(tasks, new Set())
  return { title: list.name, mode: list.viewMode, groups: [{ tasks: active }], done }
}
