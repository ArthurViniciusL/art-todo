import { expect, test, type ElectronApplication, type Page } from '@playwright/test'
import type { NewTask } from '../src/shared/domain'
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
  // Keys pressed before React mounts are lost.
  await expect(page.getByRole('heading', { level: 1, name: 'Entrada' })).toBeVisible()
}

const heading = (): ReturnType<Page['getByRole']> => page.getByRole('heading', { level: 1 })

test('Ctrl+1..9 switches between sidebar destinations', async () => {
  await seed([], 'Casa')
  await page.keyboard.press('Control+2')
  await expect(heading()).toHaveText('Hoje')
  await page.keyboard.press('Control+3')
  await expect(heading()).toHaveText('Próximos')
  await page.keyboard.press('Control+4')
  await expect(heading()).toHaveText('Casa')
  await page.keyboard.press('Control+1')
  await expect(heading()).toHaveText('Entrada')
})

test('N focuses the new task field, also from Próximos', async () => {
  await page.keyboard.press('n')
  await expect(page.getByRole('textbox', { name: 'Nova tarefa' })).toBeFocused()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Próximos', exact: true }).click()
  await page.locator('body').click()
  await page.keyboard.press('n')
  await expect(heading()).toHaveText('Entrada')
  await expect(page.getByRole('textbox', { name: 'Nova tarefa' })).toBeFocused()
})

test('Ctrl+Z undoes a deletion and a status change', async () => {
  await seed([{ title: 'Importante' }])
  const row = page.getByRole('row', { name: /Importante/ })
  await row.focus()
  await page.keyboard.press('s')
  await expect(row.getByRole('button', { name: /Status: Fazendo/ })).toBeVisible()
  await page.keyboard.press('Delete')
  await expect(page.getByRole('row', { name: /Importante/ })).toHaveCount(0)

  await page.locator('body').click()
  await page.keyboard.press('Control+z')
  await expect(row).toBeVisible()
  await page.keyboard.press('Control+z')
  await expect(row.getByRole('button', { name: /Status: A fazer/ })).toBeVisible()
})

test('the palette runs commands', async () => {
  await page.keyboard.press('Control+k')
  const palette = page.getByRole('dialog', { name: 'Paleta de comandos' })
  await expect(palette).toBeVisible()
  await page.keyboard.type('escuro')
  await page.keyboard.press('Enter')
  await expect(palette).toBeHidden()
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)

  await page.keyboard.press('Control+k')
  await page.keyboard.type('algo')
  await page.keyboard.press('Escape')
  await expect(palette).toBeHidden()

  await page.keyboard.press('Control+k')
  await page.keyboard.type('hoje')
  await page.keyboard.press('Enter')
  await expect(heading()).toHaveText('Hoje')
})

test('the palette finds tasks by title or notes and opens them', async () => {
  await seed([{ title: 'Ligar para o encanador', notes: 'vazamento na cozinha' }], 'Casa')
  await page.keyboard.press('Control+k')
  await page.keyboard.type('cozinha')
  const result = page.getByRole('menuitem', { name: /Ligar para o encanador/ })
  await expect(result).toBeVisible()
  await result.click()
  await expect(heading()).toHaveText('Casa')
  await expect(page.getByRole('dialog', { name: 'Editar tarefa' })).toBeVisible()
})
