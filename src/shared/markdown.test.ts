import { describe, expect, it } from 'vitest'
import type { Task } from './domain'
import { markdownFileName, parseMarkdownTasks, taskToMarkdown, toMarkdown } from './markdown'

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
    expect(taskToMarkdown(task({ title: 'Comprar pão' }))).toBe('- [ ] Comprar pão | status: todo')
  })

  it('checks done tasks', () => {
    expect(taskToMarkdown(task({ title: 'Feito', status: 'done' }))).toBe(
      '- [x] Feito | status: done'
    )
  })

  it('adds status, date and priority as a suffix', () => {
    expect(
      taskToMarkdown(
        task({ title: 'Relatório', status: 'doing', dueDate: '2026-10-25', priority: 3 })
      )
    ).toBe('- [ ] Relatório | status: doing | due: 2026-10-25 | priority: high')
  })

  it('includes the time with the date', () => {
    expect(
      taskToMarkdown(
        task({ title: 'Reunião', dueDate: '2026-10-25', dueTime: '09:30', priority: 1 })
      )
    ).toBe('- [ ] Reunião | status: todo | due: 2026-10-25 09:30 | priority: low')
  })

  it('tags critical priority', () => {
    expect(taskToMarkdown(task({ title: 'Servidor', priority: 4 }))).toBe(
      '- [ ] Servidor | status: todo | priority: critical'
    )
  })

  it('indents notes under the task, keeping blank lines', () => {
    expect(taskToMarkdown(task({ title: 'Viagem', notes: 'Passagens\n\nHotel  ' }))).toBe(
      '- [ ] Viagem | status: todo\n  Passagens\n\n  Hotel'
    )
  })
})

describe('toMarkdown', () => {
  it('writes the title and sections, skipping empty ones', () => {
    const doc = toMarkdown({
      title: '23/10/26 - 14:05:09',
      sections: [
        { heading: 'todo', tasks: [task({ title: 'a' })] },
        { heading: 'doing', tasks: [] },
        { heading: 'done', tasks: [task({ title: 'b', status: 'done' })] }
      ]
    })
    expect(doc).toBe(
      '# 23/10/26 - 14:05:09\n\n## todo\n\n- [ ] a | status: todo\n\n## done\n\n- [x] b | status: done\n'
    )
  })

  it('writes sections without headings as plain lists', () => {
    expect(toMarkdown({ title: 'Entrada', sections: [{ tasks: [task({ title: 'a' })] }] })).toBe(
      '# Entrada\n\n- [ ] a | status: todo\n'
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

describe('parseMarkdownTasks', () => {
  it('reads checkboxes, plain bullets and fields', () => {
    const { tasks, ignoredLines } = parseMarkdownTasks(
      [
        '# Mercado',
        '## Seção',
        '- [ ] Comprar pão',
        '- [x] Pagar luz | due: 2026-10-20 09:30',
        '* Relatório | Status: DOING | priority: Medium',
        'texto solto'
      ].join('\n')
    )
    expect(ignoredLines).toBe(1)
    expect(tasks).toEqual([
      { title: 'Comprar pão', notes: '', status: 'todo' },
      { title: 'Pagar luz', notes: '', status: 'done', dueDate: '2026-10-20', dueTime: '09:30' },
      { title: 'Relatório', notes: '', status: 'doing', priority: 2 }
    ])
  })

  it('lets status win over the checkbox', () => {
    expect(parseMarkdownTasks('- [x] a | status: todo').tasks[0].status).toBe('todo')
  })

  it('keeps invalid or unknown fields in the title', () => {
    const { tasks } = parseMarkdownTasks('- [ ] A | B | due: 2026-02-30 | priority: high')
    expect(tasks[0]).toMatchObject({ title: 'A | B | due: 2026-02-30', priority: 3 })
  })

  it('turns indented lines and nested items into notes', () => {
    const { tasks } = parseMarkdownTasks(
      '- [ ] Viagem | status: todo\n  Passagens\n\n  - hotel\n- [ ] Outra'
    )
    expect(tasks.map((t) => t.notes)).toEqual(['Passagens\n\n- hotel', ''])
  })

  it('round-trips the export', () => {
    const original = [
      task({ title: 'a', status: 'doing', dueDate: '2026-10-25', dueTime: '09:30', priority: 4 }),
      task({ title: 'b', status: 'done', notes: 'x\n\ny' }),
      task({ title: 'c | d' })
    ]
    const { tasks } = parseMarkdownTasks(
      toMarkdown({ title: 'L', sections: [{ heading: 'A fazer', tasks: original }] })
    )
    expect(tasks).toMatchObject(
      original.map(({ title, notes, status, priority, dueDate, dueTime }) => ({
        title,
        notes,
        status,
        ...(priority ? { priority } : {}),
        ...(dueDate ? { dueDate, dueTime } : {})
      }))
    )
  })

  it('skips a BOM, empty checkboxes and keeps a bare pipe in the title', () => {
    const { tasks, ignoredLines } = parseMarkdownTasks(
      '\uFEFF- [ ] a\n- [ ]\n- [ ] x|priority: high'
    )
    expect(tasks.map((t) => t.title)).toEqual(['a', 'x|priority: high'])
    expect(ignoredLines).toBe(1)
  })
})
