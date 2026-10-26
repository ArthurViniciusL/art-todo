import { expect, test, type ElectronApplication, type Page } from '@playwright/test'
import { toIsoDate } from '../src/shared/dates'
import type { NewTask } from '../src/shared/domain'
import { launchApp, newProfileDir } from './fixtures'

let app: ElectronApplication
let page: Page

test.afterEach(async () => {
  await app.close()
})

async function seedInbox(tasks: Omit<NewTask, 'listId'>[]): Promise<void> {
  await page.evaluate(async (tasks) => {
    const inbox = (await window.api.invoke('lists:getAll')).find((list) => list.isInbox)!
    for (const task of tasks) await window.api.invoke('tasks:create', { ...task, listId: inbox.id })
  }, tasks)
  await page.reload()
}

const mode = (name: string): ReturnType<Page['getByRole']> =>
  page.getByRole('radiogroup', { name: 'Modo de visualização' }).getByRole('radio', { name })

test('cards show the status as a label', async () => {
  app = await launchApp()
  page = await app.firstWindow()
  await seedInbox([{ title: 'Escrever post', status: 'doing', notes: 'Rascunho no caderno' }])
  await mode('Cards').click()
  const card = page
    .getByRole('grid', { name: 'Tarefas' })
    .getByRole('row', { name: /Escrever post/ })
  await expect(card.getByRole('button', { name: /Status: Fazendo/ })).toHaveText('Fazendo')
  await expect(card.getByText('Rascunho no caderno')).toBeVisible()
})

test('columns split tasks by status and status changes move them', async () => {
  app = await launchApp()
  page = await app.firstWindow()
  await seedInbox([
    { title: 'Ideia', status: 'todo' },
    { title: 'Em andamento', status: 'doing' },
    { title: 'Pronto', status: 'done' }
  ])
  await mode('Colunas').click()
  const column = (name: string): ReturnType<Page['getByRole']> =>
    page.getByRole('grid', { name, exact: true })
  await expect(column('A fazer').getByRole('row')).toHaveText([/Ideia/])
  await expect(column('Fazendo').getByRole('row')).toHaveText([/Em andamento/])
  await expect(column('Feito').getByRole('row')).toHaveText([/Pronto/])

  await column('A fazer').getByRole('row', { name: /Ideia/ }).focus()
  await page.keyboard.press('s')
  await expect(column('Fazendo').getByRole('row')).toHaveCount(2)

  await page.getByRole('button', { name: 'Ocultar concluídas' }).click()
  await expect(column('Feito')).toHaveCount(0)
})

test('creates a task from the A fazer column', async () => {
  app = await launchApp()
  page = await app.firstWindow()
  await mode('Colunas').click()
  const todo = page.getByRole('region', { name: 'A fazer' })
  const input = todo.getByRole('textbox', { name: 'Nova tarefa' })
  await expect(page.getByRole('textbox', { name: 'Nova tarefa' })).toHaveCount(1)
  await input.fill('Comprar café')
  await input.press('Enter')
  await expect(
    page
      .getByRole('grid', { name: 'A fazer', exact: true })
      .getByRole('row', { name: /Comprar café/ })
  ).toBeVisible()
})

test('the mode is saved per list and survives a restart', async () => {
  const profile = newProfileDir()
  app = await launchApp(profile)
  page = await app.firstWindow()
  await page.evaluate(() => window.api.invoke('lists:create', 'Ideias'))
  await page.reload()
  await mode('Cards').click()

  const lists = page.getByRole('navigation', { name: 'Listas' })
  await lists.getByRole('button', { name: 'Ideias', exact: true }).click()
  await expect(mode('Lista')).toBeChecked()
  await page.keyboard.press('Control+Shift+3')
  await expect(mode('Colunas')).toBeChecked()
  await app.close()

  app = await launchApp(profile)
  page = await app.firstWindow()
  await expect(mode('Cards')).toBeChecked()
  await page
    .getByRole('navigation', { name: 'Listas' })
    .getByRole('button', { name: 'Ideias', exact: true })
    .click()
  await expect(mode('Colunas')).toBeChecked()
})

test('smart views have their own saved mode', async () => {
  const profile = newProfileDir()
  app = await launchApp(profile)
  page = await app.firstWindow()
  await seedInbox([{ title: 'Pagar luz', dueDate: toIsoDate(new Date()) }])
  const nav = page.getByRole('navigation', { name: 'Visões' })
  await nav.getByRole('button', { name: 'Hoje', exact: true }).click()
  await page.keyboard.press('Control+Shift+3')
  await expect(
    page.getByRole('grid', { name: 'A fazer' }).getByRole('row', { name: /Pagar luz/ })
  ).toBeVisible()
  await app.close()

  app = await launchApp(profile)
  page = await app.firstWindow()
  await expect(mode('Lista')).toBeChecked()
  await page
    .getByRole('navigation', { name: 'Visões' })
    .getByRole('button', { name: 'Hoje', exact: true })
    .click()
  await expect(mode('Colunas')).toBeChecked()
})
