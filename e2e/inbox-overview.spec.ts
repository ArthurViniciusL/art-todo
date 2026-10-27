import { expect, test, type ElectronApplication, type Page } from '@playwright/test'
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

const section = (name: string): ReturnType<Page['getByRole']> =>
  page.getByRole('grid', { name, exact: true })

/** Creates lists and tasks through IPC, then reloads so the Inbox shows them. */
async function seed(tasksByList: Record<string, string[]>): Promise<void> {
  await page.evaluate(async (seedData) => {
    const lists = await window.api.invoke('lists:getAll')
    for (const [name, titles] of Object.entries(seedData)) {
      const list =
        lists.find((item) => item.name === name) ?? (await window.api.invoke('lists:create', name))
      for (const title of titles)
        await window.api.invoke('tasks:create', { listId: list.id, title })
    }
  }, tasksByList)
  await page.reload()
}

test('shows every list’s open tasks in sections, Inbox first', async () => {
  await seed({ Entrada: ['Ler e-mail'], Trabalho: ['Preparar slides'], Casa: [] })

  await expect(page.getByRole('button', { name: /^(Entrada|Trabalho|Casa) · / })).toHaveText([
    'Entrada · 1',
    'Trabalho · 1'
  ])
  await expect(section('Entrada').getByRole('row')).toHaveText(['Ler e-mail'])
  await expect(section('Trabalho').getByRole('row')).toHaveText(['Preparar slides'])
  // A list without open tasks has no section.
  await expect(section('Casa')).toHaveCount(0)
})

test('collapses a section from the keyboard', async () => {
  await seed({ Trabalho: ['Preparar slides'] })
  const trigger = page.getByRole('button', { name: 'Trabalho · 1' })
  await trigger.focus()
  await page.keyboard.press('Enter')
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByRole('row', { name: 'Preparar slides' })).toBeHidden()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('row', { name: 'Preparar slides' })).toBeVisible()
})

test('J and K move across sections', async () => {
  await seed({ Entrada: ['Ler e-mail'], Trabalho: ['Preparar slides'] })
  await section('Entrada').getByRole('row', { name: 'Ler e-mail' }).focus()
  await page.keyboard.press('j')
  await expect(section('Trabalho').getByRole('row', { name: 'Preparar slides' })).toBeFocused()
  await page.keyboard.press('k')
  await expect(section('Entrada').getByRole('row', { name: 'Ler e-mail' })).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(section('Trabalho').getByRole('row', { name: 'Preparar slides' })).toBeFocused()
  await page.keyboard.press('ArrowUp')
  await expect(section('Entrada').getByRole('row', { name: 'Ler e-mail' })).toBeFocused()
})

test('J skips a collapsed section', async () => {
  await seed({ Entrada: ['Ler e-mail'], Trabalho: ['Preparar slides'], Casa: ['Pagar luz'] })
  await page.getByRole('button', { name: 'Trabalho · 1' }).click()
  // The panel only gets `hidden` once the collapse animation ends.
  await expect(page.locator('[data-slot=disclosure-content][hidden]')).toHaveCount(1)
  await section('Entrada').getByRole('row', { name: 'Ler e-mail' }).focus()
  await page.keyboard.press('j')
  await expect(section('Casa').getByRole('row', { name: 'Pagar luz' })).toBeFocused()
})

test('quick add creates the task in the Inbox', async () => {
  await seed({ Trabalho: ['Preparar slides'] })
  const input = page.getByRole('textbox', { name: 'Nova tarefa' })
  await input.fill('Comprar café')
  await input.press('Enter')
  await expect(section('Entrada').getByRole('row')).toHaveText(['Comprar café'])
})

test('moving a task to another list moves it between sections', async () => {
  await seed({ Entrada: ['Preparar slides'], Trabalho: [] })
  await section('Entrada').getByRole('row', { name: 'Preparar slides' }).click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Mover para lista' }).click()
  await page.getByRole('menuitem', { name: 'Trabalho' }).click()

  await expect(section('Entrada')).toHaveCount(0)
  await expect(section('Trabalho').getByRole('row')).toHaveText(['Preparar slides'])
  // Focus follows the task into its new section.
  await expect(section('Trabalho').getByRole('row', { name: 'Preparar slides' })).toBeFocused()
})

test('Concluídas gathers done tasks from every list with their list name', async () => {
  await seed({ Trabalho: ['Preparar slides'] })
  const row = section('Trabalho').getByRole('row', { name: 'Preparar slides' })
  await row.focus()
  await page.keyboard.press('Space')
  await expect(section('Concluídas').getByRole('row', { name: /Preparar slides/ })).toContainText(
    'Trabalho'
  )
  await expect(section('Trabalho')).toHaveCount(0)
})

test('J stays inside a board column', async () => {
  await seed({ Entrada: ['Ler e-mail'], Trabalho: [] })
  await page.evaluate(async () => {
    const [, work] = await window.api.invoke('lists:getAll')
    await window.api.invoke('tasks:create', { listId: work.id, title: 'Revisar', status: 'doing' })
  })
  await page.reload()
  await page.getByRole('radio', { name: 'Colunas' }).click()
  const row = section('A fazer').getByRole('row', { name: /Ler e-mail/ })
  await row.focus()
  await page.keyboard.press('j')
  await expect(row).toBeFocused()
})
