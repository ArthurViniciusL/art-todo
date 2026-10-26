import { describe, expect, it } from 'vitest'
import type { Task } from './domain'
import { markdownFileName, taskToMarkdown, toMarkdown } from './markdown'

let nextId = 1
function task(overrides: Partial<Task>): Task {
  return {
    id: nextId++,
    listId: 1,
    title: 'Tarefa',
    notes: '',
    status: 'todo',
    priority: 0,
    dueDate: null,
    dueTime: null,
    position: 1,
    completedAt: null,
    remindedAt: null,
    createdAt: 0,
    updatedAt: 0,
    ...overrides
  }
}

describe('taskToMarkdown', () => {
  it('writes a plain open task', () => {
    expect(taskToMarkdown(task({ title: 'Comprar pão' }))).toBe('- [ ] Comprar pão')
  })

  it('checks done tasks', () => {
    expect(taskToMarkdown(task({ title: 'Feito', status: 'done' }))).toBe('- [x] Feito')
  })

  it('adds status, date and priority as a suffix', () => {
    expect(
      taskToMarkdown(
        task({ title: 'Relatório', status: 'doing', dueDate: '2026-10-25', priority: 3 })
      )
    ).toBe('- [ ] Relatório — ⏳ fazendo · 📅 2026-10-25 · !alta')
  })

  it('includes the time with the date', () => {
    expect(
      taskToMarkdown(
        task({ title: 'Reunião', dueDate: '2026-10-25', dueTime: '09:30', priority: 1 })
      )
    ).toBe('- [ ] Reunião — 📅 2026-10-25 09:30 · !baixa')
  })

  it('tags critical priority', () => {
    expect(taskToMarkdown(task({ title: 'Servidor', priority: 4 }))).toBe(
      '- [ ] Servidor — !crítico'
    )
  })

  it('indents notes under the task, keeping blank lines', () => {
    expect(taskToMarkdown(task({ title: 'Viagem', notes: 'Passagens\n\nHotel  ' }))).toBe(
      '- [ ] Viagem\n  Passagens\n\n  Hotel'
    )
  })
})

describe('toMarkdown', () => {
  it('writes the title and sections, skipping empty ones', () => {
    const doc = toMarkdown({
      title: '23/10/26 - 14:05:09',
      sections: [
        { heading: 'A fazer', tasks: [task({ title: 'a' })] },
        { heading: 'Fazendo', tasks: [] },
        { heading: 'Feito', tasks: [task({ title: 'b', status: 'done' })] }
      ]
    })
    expect(doc).toBe('# 23/10/26 - 14:05:09\n\n## A fazer\n\n- [ ] a\n\n## Feito\n\n- [x] b\n')
  })

  it('writes sections without headings as plain lists', () => {
    expect(toMarkdown({ title: 'Entrada', sections: [{ tasks: [task({ title: 'a' })] }] })).toBe(
      '# Entrada\n\n- [ ] a\n'
    )
  })
})

describe('markdownFileName', () => {
  it('replaces slashes and colons', () => {
    expect(markdownFileName('23/10/26 - 14:05:09')).toBe('23-10-26 - 14-05-09.md')
  })

  it('falls back for blank names', () => {
    expect(markdownFileName('  ')).toBe('tarefas.md')
  })
})
