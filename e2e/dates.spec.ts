import { expect, test, type ElectronApplication, type Page } from '@playwright/test'
import { addDays, toIsoDate } from '../src/shared/dates'
import type { NewTask } from '../src/shared/domain'
import { launchApp } from './fixtures'

let app: ElectronApplication
let page: Page
const today = toIsoDate(new Date())

test.beforeEach(async () => {
  app = await launchApp()
  page = await app.firstWindow()
})

test.afterEach(async () => {
  await app.close()
})

/** Creates tasks through IPC, then reloads so the UI fetches them. */
async function seed(tasks: Omit<NewTask, 'listId'>[], listName?: string): Promise<void> {
  await page.evaluate(
    async ({ tasks, listName }) => {
      const lists = await window.api.invoke('lists:getAll')
      const listId = listName
        ? (await window.api.invoke('lists:create', listName)).id
        : lists.find((list) => list.isInbox)!.id
      for (const task of tasks) await window.api.invoke('tasks:create', { ...task, listId })
    },
    { tasks, listName }
  )
  await page.reload()
}

const nav = (name: string): ReturnType<Page['getByRole']> =>
  page.getByRole('navigation', { name: 'Visões' }).getByRole('button', { name, exact: true })

test('sets date and priority in the modal', async () => {
  await seed([{ title: 'Entregar relatório' }])
  await page.getByRole('row', { name: 'Entregar relatório' }).dblclick()
  const dialog = page.getByRole('dialog', { name: 'Editar tarefa' })
  await dialog.getByRole('button', { name: 'Amanhã' }).click()
  await dialog.getByRole('radio', { name: /Alta/ }).click()
  await dialog.getByRole('button', { name: 'Salvar' }).click()

  const row = page.getByRole('row', { name: 'Entregar relatório' })
  await expect(row.getByText('Amanhã')).toBeVisible()
  await expect(row.getByLabel('Prioridade alta')).toBeVisible()

  await row.dblclick()
  await dialog.getByRole('radio', { name: /Crítico/ }).click()
  await dialog.getByRole('button', { name: 'Salvar' }).click()
  await expect(row.getByLabel('Prioridade crítico')).toBeVisible()
})

test('T schedules the focused task for today and it shows in Hoje', async () => {
  await seed([{ title: 'Ligar para o banco' }], 'Finanças')
  await page
    .getByRole('navigation', { name: 'Listas' })
    .getByRole('button', { name: 'Finanças', exact: true })
    .click()
  await page.getByRole('row', { name: 'Ligar para o banco' }).focus()
  await page.keyboard.press('t')
  await expect(
    page.getByRole('row', { name: 'Ligar para o banco' }).getByText('Hoje')
  ).toBeVisible()

  await nav('Hoje').click()
  const row = page
    .getByRole('grid', { name: 'Hoje' })
    .getByRole('row', { name: 'Ligar para o banco' })
  await expect(row).toBeVisible()
  await expect(row.getByText('Finanças')).toBeVisible()
})

test('Hoje lists overdue tasks first, then today ordered by time and priority', async () => {
  await seed([
    { title: 'Sem hora, alta', dueDate: today, priority: 3 },
    { title: 'Às 15h', dueDate: today, dueTime: '15:00' },
    { title: 'Às 9h', dueDate: today, dueTime: '09:00' },
    { title: 'Esquecida', dueDate: addDays(today, -2) },
    { title: 'Amanhã', dueDate: addDays(today, 1) },
    { title: 'Sem data' }
  ])
  await nav('Hoje').click()
  await expect(page.getByRole('heading', { name: 'Atrasadas' })).toBeVisible()
  await expect(page.getByRole('grid', { name: 'Atrasadas' }).getByRole('row')).toHaveText([
    /Esquecida/
  ])
  await expect(page.getByRole('grid', { name: 'Hoje' }).getByRole('row')).toHaveText([
    /Às 9h/,
    /Às 15h/,
    /Sem hora, alta/
  ])
})

test('Próximos groups the next days and puts the rest under Depois', async () => {
  await seed([
    { title: 'Daqui a 1 dia', dueDate: addDays(today, 1) },
    { title: 'Daqui a 3 dias', dueDate: addDays(today, 3) },
    { title: 'Daqui a 20 dias', dueDate: addDays(today, 20) },
    { title: 'Hoje mesmo', dueDate: today }
  ])
  await nav('Próximos').click()
  await expect(page.getByRole('grid', { name: 'Amanhã' }).getByRole('row')).toHaveText([
    /Daqui a 1 dia/
  ])
  await expect(page.getByRole('grid', { name: 'Depois' }).getByRole('row')).toHaveText([
    /Daqui a 20 dias/
  ])
  await expect(page.getByRole('row', { name: /Daqui a 3 dias/ })).toBeVisible()
  await expect(page.getByRole('row', { name: /Hoje mesmo/ })).toHaveCount(0)
})

test('quick add in Hoje creates a task due today in the Inbox', async () => {
  await nav('Hoje').click()
  const input = page.getByRole('textbox', { name: 'Nova tarefa' })
  await input.fill('Comprar café')
  await input.press('Enter')
  await expect(
    page.getByRole('grid', { name: 'Hoje' }).getByRole('row', { name: /Comprar café/ })
  ).toBeVisible()
  await nav('Entrada').click()
  await expect(page.getByRole('row', { name: /Comprar café/ }).getByText('Hoje')).toBeVisible()
})

test('a task done in Hoje leaves the view after the linger', async () => {
  await seed([{ title: 'Tomar remédio', dueDate: today }])
  await nav('Hoje').click()
  await page.getByRole('row', { name: /Tomar remédio/ }).focus()
  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: 'Desfazer' })).toBeVisible()
  await expect(page.getByRole('row', { name: /Tomar remédio/ })).toHaveCount(0, { timeout: 6000 })
})
