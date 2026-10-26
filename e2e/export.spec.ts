import { expect, test, type ElectronApplication, type Page } from '@playwright/test'
import { readFileSync } from 'fs'
import { join } from 'path'
import { toIsoDate } from '../src/shared/dates'
import type { NewTask } from '../src/shared/domain'
import { launchApp, newProfileDir } from './fixtures'

let app: ElectronApplication
let page: Page

test.beforeEach(async () => {
  app = await launchApp()
  page = await app.firstWindow()
  await expect(page.getByRole('heading', { level: 1, name: 'Entrada' })).toBeVisible()
})

test.afterEach(async () => {
  await app.close()
})

async function seedList(name: string, tasks: Omit<NewTask, 'listId'>[]): Promise<void> {
  await page.evaluate(
    async ({ name, tasks }) => {
      const list = await window.api.invoke('lists:create', name)
      for (const task of tasks)
        await window.api.invoke('tasks:create', { ...task, listId: list.id })
    },
    { name, tasks }
  )
  await page.reload()
  await page
    .getByRole('navigation', { name: 'Listas' })
    .getByRole('button', { name, exact: true })
    .click()
}

const preview = (): ReturnType<Page['getByLabel']> => page.getByLabel('Prévia do Markdown')

test('previews the list as GFM and copies it to the clipboard', async () => {
  await seedList('Mercado', [
    { title: 'Pão', priority: 3 },
    { title: 'Leite', status: 'doing', dueDate: '2026-10-25', notes: 'integral' },
    { title: 'Café', status: 'done' }
  ])
  await page.keyboard.press('Control+e')
  await expect(preview()).toHaveText(
    [
      '# Mercado',
      '',
      '- [ ] Pão — !alta',
      '- [ ] Leite — ⏳ fazendo · 📅 2026-10-25',
      '  integral',
      '',
      '## Concluídas',
      '',
      '- [x] Café',
      ''
    ].join('\n')
  )

  await page.getByText('Incluir concluídas').click()
  await expect(preview()).not.toContainText('Café')

  await page.getByRole('button', { name: 'Copiar' }).click()
  await expect(page.getByRole('dialog', { name: 'Exportar Markdown' })).toBeHidden()
  const copied = await app.evaluate(({ clipboard }) => clipboard.readText())
  expect(copied).toBe(
    '# Mercado\n\n- [ ] Pão — !alta\n- [ ] Leite — ⏳ fazendo · 📅 2026-10-25\n  integral\n'
  )
})

test('groups by status when exporting from Colunas', async () => {
  await seedList('Projeto', [
    { title: 'Ideia' },
    { title: 'Em curso', status: 'doing' },
    { title: 'Pronto', status: 'done' }
  ])
  await page.getByRole('radio', { name: 'Colunas' }).click()
  await page.getByRole('button', { name: /Exportar Markdown/ }).click()
  await expect(page.getByRole('switch', { name: 'Agrupar por status' })).toBeChecked()
  await expect(preview()).toHaveText(
    '# Projeto\n\n## A fazer\n\n- [ ] Ideia\n\n## Fazendo\n\n- [ ] Em curso — ⏳ fazendo\n\n## Feito\n\n- [x] Pronto\n'
  )
})

test('saves a .md file with a sanitized name for a list without a name', async () => {
  const folder = newProfileDir()
  // Stand in for the native save dialog: accept the suggested name inside a temp folder.
  await app.evaluate(({ dialog }, folder) => {
    dialog.showSaveDialog = (async (...args: unknown[]) => {
      const options = args.at(-1) as { defaultPath: string }
      const name = options.defaultPath.split('/').pop()!
      return { canceled: false, filePath: `${folder}/${name}` }
    }) as typeof dialog.showSaveDialog
  }, folder)

  await page.getByRole('button', { name: 'Nova lista' }).click()
  await page.getByRole('textbox', { name: 'Nome da nova lista' }).press('Enter')
  const title = (await page.getByRole('heading', { level: 1 }).textContent())!
  const input = page.getByRole('textbox', { name: 'Nova tarefa' })
  await input.fill('Primeira')
  await input.press('Enter')
  await expect(page.getByRole('row', { name: /Primeira/ })).toBeVisible()

  await page.keyboard.press('Control+e')
  await page.getByRole('button', { name: 'Salvar .md' }).click()
  await expect(page.getByText('Arquivo salvo')).toBeVisible()

  const fileName = `${title.replace(/[/:]/g, '-')}.md`
  expect(readFileSync(join(folder, fileName), 'utf8')).toBe(`# ${title}\n\n- [ ] Primeira\n`)
})

test('exports the Hoje view with its groups', async () => {
  const today = toIsoDate(new Date())
  await page.evaluate(async (today) => {
    await window.api.invoke('tasks:create', { listId: 1, title: 'Hoje mesmo', dueDate: today })
    await window.api.invoke('tasks:create', { listId: 1, title: 'Atrasada', dueDate: '2020-01-01' })
  }, today)
  await page.reload()
  await page
    .getByRole('navigation', { name: 'Visões' })
    .getByRole('button', { name: 'Hoje', exact: true })
    .click()
  await page.keyboard.press('Control+e')
  await expect(preview()).toHaveText(
    `# Hoje\n\n## Atrasadas\n\n- [ ] Atrasada — 📅 2020-01-01\n\n## Hoje\n\n- [ ] Hoje mesmo — 📅 ${today}\n`
  )
})
