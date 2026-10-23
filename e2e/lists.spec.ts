import { expect, test, type ElectronApplication, type Page } from '@playwright/test'
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

const listsNav = (): ReturnType<Page['getByRole']> =>
  page.getByRole('navigation', { name: 'Listas' })

async function createList(name: string): Promise<void> {
  await page.getByRole('button', { name: 'Nova lista' }).click()
  const input = page.getByRole('textbox', { name: 'Nome da nova lista' })
  await input.fill(name)
  await input.press('Enter')
}

test('creates a list and selects it', async () => {
  await createList('Mercado')
  await expect(listsNav().getByRole('button', { name: 'Mercado', exact: true })).toHaveAttribute(
    'aria-current',
    'page'
  )
  await expect(page.getByRole('heading', { level: 1, name: 'Mercado' })).toBeVisible()
})

test('names a list created without a name after the current date and time', async () => {
  await createList('')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    /^\d{2}\/\d{2}\/\d{2} - \d{2}:\d{2}:\d{2}$/
  )
})

test('renames a list from its menu', async () => {
  await createList('Trabalho')
  await listsNav().getByRole('button', { name: 'Opções da lista Trabalho' }).click()
  await page.getByRole('menuitem', { name: 'Renomear' }).click()
  const input = page.getByRole('textbox', { name: 'Nome da lista' })
  await input.fill('Projetos')
  await input.press('Enter')
  await expect(listsNav().getByRole('button', { name: 'Projetos', exact: true })).toBeVisible()
})

test('deletes a list and moves its tasks to the Inbox', async () => {
  await createList('Casa')
  const input = page.getByRole('textbox', { name: 'Nova tarefa' })
  await input.fill('Trocar lâmpada')
  await input.press('Enter')
  await expect(page.getByRole('row', { name: 'Trocar lâmpada' })).toBeVisible()

  await listsNav().getByRole('button', { name: 'Opções da lista Casa' }).click()
  await page.getByRole('menuitem', { name: 'Excluir' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Mover para Entrada' }).click()

  await expect(listsNav().getByRole('button', { name: 'Casa', exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 1, name: 'Entrada' })).toBeVisible()
  await expect(page.getByRole('row', { name: 'Trocar lâmpada' })).toBeVisible()
})

test('deletes a list together with its tasks', async () => {
  await createList('Rascunhos')
  const input = page.getByRole('textbox', { name: 'Nova tarefa' })
  await input.fill('Ideia solta')
  await input.press('Enter')
  await listsNav().getByRole('button', { name: 'Opções da lista Rascunhos' }).click()
  await page.getByRole('menuitem', { name: 'Excluir' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Apagar tudo' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Entrada' })).toBeVisible()
  await expect(page.getByRole('row', { name: 'Ideia solta' })).toHaveCount(0)
})
