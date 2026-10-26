import { expect, test, type ElectronApplication, type Page } from '@playwright/test'
import { addDays, toIsoDate } from '../src/shared/dates'
import type { ReminderTarget } from '../src/shared/ipc'
import { launchApp } from './fixtures'

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

/** Sends what a clicked reminder notification sends, from the main process. */
async function clickReminder(target: ReminderTarget): Promise<void> {
  await app.evaluate(({ BrowserWindow }, target) => {
    BrowserWindow.getAllWindows()[0].webContents.send('reminders:open', target)
  }, target)
}

test('a clicked reminder opens its task in its list', async () => {
  const target = await page.evaluate(async () => {
    const list = await window.api.invoke('lists:create', 'Saúde')
    const task = await window.api.invoke('tasks:create', { listId: list.id, title: 'Dentista' })
    return { taskId: task.id, listId: list.id }
  })
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Entrada' })).toBeVisible()
  await clickReminder(target)
  await expect(page.getByRole('heading', { level: 1, name: 'Saúde' })).toBeVisible()
  const dialog = page.getByRole('dialog', { name: 'Editar tarefa' })
  await expect(dialog.getByRole('textbox', { name: 'Título' })).toHaveValue('Dentista')
})

test('a summary reminder opens Hoje', async () => {
  await clickReminder(null)
  await expect(page.getByRole('heading', { level: 1, name: 'Hoje' })).toBeVisible()
})

test('past alerts are marked fired when a task is created', async () => {
  const dueDate = addDays(toIsoDate(new Date()), -1)
  const task = await page.evaluate(async (dueDate) => {
    const inbox = (await window.api.invoke('lists:getAll')).find((list) => list.isInbox)!
    return window.api.invoke('tasks:create', { listId: inbox.id, title: 'Antiga', dueDate })
  }, dueDate)
  expect(task.remindedAt).not.toBeNull()
})
