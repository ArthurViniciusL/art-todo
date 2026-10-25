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

const tasks = (): ReturnType<Page['getByRole']> => page.getByRole('grid', { name: 'Tarefas' })
const done = (): ReturnType<Page['getByRole']> => page.getByRole('grid', { name: 'Concluídas' })

async function addTask(title: string): Promise<void> {
  const input = page.getByRole('textbox', { name: 'Nova tarefa' })
  await input.fill(title)
  await input.press('Enter')
  await expect(tasks().getByRole('row', { name: title })).toBeVisible()
}

test('creates tasks in the Inbox', async () => {
  await addTask('Comprar pão')
  await addTask('Ligar para a Ana')
  await expect(tasks().getByRole('row')).toHaveCount(2)
  await expect(page.getByRole('textbox', { name: 'Nova tarefa' })).toHaveValue('')
})

test('marks a task done, keeps it in place, then moves it to Concluídas', async () => {
  await addTask('Regar plantas')
  const row = tasks().getByRole('row', { name: 'Regar plantas' })
  await row.focus()
  await page.keyboard.press('Space')
  await expect(row.getByRole('button', { name: 'Desfazer' })).toBeVisible()
  await expect(done().getByRole('row', { name: 'Regar plantas' })).toBeVisible({ timeout: 6000 })
  await expect(tasks().getByRole('row')).toHaveCount(0)
})

test('undoes a completion from the row', async () => {
  await addTask('Pagar conta')
  const row = tasks().getByRole('row', { name: 'Pagar conta' })
  await row.focus()
  await page.keyboard.press('Space')
  await row.getByRole('button', { name: 'Desfazer' }).click()
  await expect(row.getByRole('button', { name: /Status: A fazer/ })).toBeVisible()
  await page.waitForTimeout(3500)
  await expect(tasks().getByRole('row', { name: 'Pagar conta' })).toBeVisible()
})

test('changes status from the status menu and with S', async () => {
  await addTask('Escrever relatório')
  const row = tasks().getByRole('row', { name: 'Escrever relatório' })
  await row.getByRole('button', { name: /Status: A fazer/ }).click()
  await page.getByRole('menuitemradio', { name: 'Fazendo' }).click()
  await expect(row.getByRole('button', { name: /Status: Fazendo/ })).toBeVisible()

  await row.focus()
  await page.keyboard.press('s')
  await expect(row.getByRole('button', { name: /Status: Feito/ })).toBeVisible()
})

test('renames a task inline with Enter', async () => {
  await addTask('Rascunho')
  await tasks().getByRole('row', { name: 'Rascunho' }).focus()
  await page.keyboard.press('Enter')
  const input = page.getByRole('textbox', { name: 'Título da tarefa' })
  await input.fill('Versão final')
  await input.press('Enter')
  await expect(tasks().getByRole('row', { name: 'Versão final' })).toBeVisible()
})

test('edits notes and status in the modal', async () => {
  await addTask('Planejar viagem')
  await tasks().getByRole('row', { name: 'Planejar viagem' }).dblclick()
  const dialog = page.getByRole('dialog', { name: 'Editar tarefa' })
  await dialog.getByRole('textbox', { name: 'Notas' }).fill('Ver passagens')
  await dialog.getByRole('radio', { name: 'Fazendo' }).click()
  await dialog.getByRole('button', { name: 'Salvar' }).click()
  await expect(dialog).toBeHidden()
  const row = tasks().getByRole('row', { name: 'Planejar viagem' })
  await expect(row.getByRole('button', { name: /Status: Fazendo/ })).toBeVisible()

  await row.focus()
  await page.keyboard.press('Control+Enter')
  await expect(dialog.getByRole('textbox', { name: 'Notas' })).toHaveValue('Ver passagens')
})

test('deletes a task with Delete and restores it from the toast', async () => {
  await addTask('Tarefa temporária')
  await tasks().getByRole('row', { name: 'Tarefa temporária' }).focus()
  await page.keyboard.press('Delete')
  await expect(tasks().getByRole('row')).toHaveCount(0)
  await page.getByRole('button', { name: 'Desfazer' }).click()
  await expect(tasks().getByRole('row', { name: 'Tarefa temporária' })).toBeVisible()
})
