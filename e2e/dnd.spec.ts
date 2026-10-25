import { expect, test, type ElectronApplication, type Locator, type Page } from '@playwright/test'
import type { NewTask } from '../src/shared/domain'
import { launchApp } from './fixtures'

let app: ElectronApplication
let page: Page

test.beforeEach(async () => {
  app = await launchApp()
  page = await app.firstWindow()
})

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

/** Drags with real mouse moves so React Aria sees a native drag session. */
async function drag(
  source: Locator,
  target: Locator,
  position: 'top' | 'bottom' | 'center'
): Promise<void> {
  const from = (await source.boundingBox())!
  const to = (await target.boundingBox())!
  const y =
    position === 'top'
      ? to.y + 4
      : position === 'bottom'
        ? to.y + to.height - 4
        : to.y + to.height / 2
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(from.x + from.width / 2 + 5, from.y + from.height / 2 + 5, { steps: 5 })
  await page.mouse.move(to.x + to.width / 2, y, { steps: 15 })
  await page.mouse.up()
}

const rows = (grid: string): Locator =>
  page.getByRole('grid', { name: grid, exact: true }).getByRole('row')

test('reorders tasks in a list by dragging', async () => {
  await seedInbox([{ title: 'Primeira' }, { title: 'Segunda' }, { title: 'Terceira' }])
  await drag(rows('Tarefas').nth(2), rows('Tarefas').nth(0), 'top')
  await expect(rows('Tarefas')).toHaveText([/Terceira/, /Primeira/, /Segunda/])
  await page.reload()
  await expect(rows('Tarefas')).toHaveText([/Terceira/, /Primeira/, /Segunda/])
})

test('dragging a card to another column changes its status', async () => {
  await seedInbox([
    { title: 'Mover', status: 'todo' },
    { title: 'Já fazendo', status: 'doing' }
  ])
  await page.getByRole('radio', { name: 'Colunas' }).click()
  await drag(
    rows('A fazer').first(),
    page.getByRole('grid', { name: 'Feito', exact: true }),
    'center'
  )
  await expect(rows('Feito')).toHaveText([/Mover/])
  await expect(rows('A fazer')).toHaveCount(0)
})
