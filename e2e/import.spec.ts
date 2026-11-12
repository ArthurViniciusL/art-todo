import { expect, test, type ElectronApplication, type Page } from '@playwright/test'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { AI_IMPORT_TEMPLATE } from '../src/renderer/src/import-template'
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

/** Stands in for the native open dialog: it returns `filePath`. */
async function stubOpenDialog(filePath: string): Promise<void> {
  await app.evaluate(({ dialog }, filePath) => {
    dialog.showOpenDialog = (async () => ({
      canceled: false,
      filePaths: [filePath]
    })) as typeof dialog.showOpenDialog
  }, filePath)
}

async function createList(name: string): Promise<void> {
  await page.evaluate((name) => window.api.invoke('lists:create', name), name)
  await page.reload()
  await page
    .getByRole('navigation', { name: 'Listas' })
    .getByRole('button', { name, exact: true })
    .click()
}

async function openImport(name: string): Promise<void> {
  await page.getByRole('button', { name: `Opções da lista ${name}` }).click()
  await page.getByRole('menuitem', { name: 'Importar tarefas' }).click()
}

test('imports a Markdown file into the list from its menu', async () => {
  const file = join(newProfileDir(), 'mercado.md')
  writeFileSync(
    file,
    [
      '# Mercado',
      '',
      '- [ ] Pão | priority: high',
      '- [ ] Leite | status: doing | due: 2026-10-25',
      '  integral',
      '- [x] Café',
      'texto solto'
    ].join('\n')
  )
  await createList('Mercado')
  await stubOpenDialog(file)
  await openImport('Mercado')

  const dialog = page.getByRole('dialog', { name: 'Importar tarefas' })
  await dialog.getByRole('button', { name: 'Selecionar arquivo' }).click()
  await expect(dialog.getByRole('status')).toContainText('3 tarefas')
  await expect(dialog.getByRole('status')).toContainText('1 linha ignorada')
  await dialog.getByRole('button', { name: 'Importar' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText('3 tarefas importadas')).toBeVisible()

  const tasks = await page.evaluate(async () => {
    const lists = await window.api.invoke('lists:getAll')
    const list = lists.find((l) => l.name === 'Mercado')!
    return window.api.invoke('tasks:getByList', list.id)
  })
  expect(
    tasks.map(({ title, status, priority, dueDate, notes }) => ({
      title,
      status,
      priority,
      dueDate,
      notes
    }))
  ).toEqual([
    { title: 'Pão', status: 'todo', priority: 3, dueDate: null, notes: '' },
    { title: 'Leite', status: 'doing', priority: 0, dueDate: '2026-10-25', notes: 'integral' },
    { title: 'Café', status: 'done', priority: 0, dueDate: null, notes: '' }
  ])
})

test('copies the AI template from its own dialog', async () => {
  await createList('Ideias')
  await openImport('Ideias')
  await page.getByRole('link', { name: 'Copiar template para IA' }).click()

  const template = page.getByRole('dialog', { name: 'Template para IA' })
  await template.getByRole('button', { name: 'Copiar' }).click()
  await expect(page.getByText('Template copiado')).toBeVisible()
  expect(await app.evaluate(({ clipboard }) => clipboard.readText())).toBe(AI_IMPORT_TEMPLATE)

  await template.getByRole('button', { name: 'Voltar' }).click()
  await expect(page.getByRole('dialog', { name: 'Importar tarefas' })).toBeVisible()
})
