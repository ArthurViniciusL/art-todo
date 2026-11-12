import { describe, expect, it } from 'vitest'
import { parseMarkdownTasks } from '../../shared/markdown'
import { AI_IMPORT_TEMPLATE } from './import-template'

describe('AI_IMPORT_TEMPLATE', () => {
  it('has an example the parser reads', () => {
    const example = AI_IMPORT_TEMPLATE.slice(AI_IMPORT_TEMPLATE.indexOf('# Mercado'))
    expect(parseMarkdownTasks(example).tasks).toMatchObject([
      { title: 'Comprar pão', status: 'todo' },
      { title: 'Relatório', status: 'doing', dueDate: '2026-10-25', priority: 3 },
      { title: 'Pagar luz', status: 'done', dueTime: '09:30', notes: 'Conta de outubro.' }
    ])
  })
})
