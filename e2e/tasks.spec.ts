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

// Open tasks: the Inbox's own section, or a list's grid.
const tasks = (): ReturnType<Page['getByRole']> =>
  page.getByRole('grid', { name: /^(Entrada|Tarefas)$/ })
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

test('right-click opens the task menu to edit or delete', async () => {
  await addTask('Revisar contrato')
  await tasks().getByRole('row', { name: 'Revisar contrato' }).click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Editar' }).click()
  const dialog = page.getByRole('dialog', { name: 'Editar tarefa' })
  await expect(dialog.getByRole('textbox', { name: 'Título' })).toHaveValue('Revisar contrato')
  await dialog.getByRole('button', { name: 'Cancelar' }).click()

  await addTask('Arquivar notas')
  await tasks().getByRole('row', { name: 'Revisar contrato' }).click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Excluir' }).click()
  await expect(tasks().getByRole('row')).toHaveCount(1)
  await expect(tasks().getByRole('row', { name: 'Arquivar notas' })).toBeFocused()
})

test('Shift+F10 opens the task menu from the keyboard', async () => {
  await addTask('Enviar fatura')
  await tasks().getByRole('row', { name: 'Enviar fatura' }).focus()
  await page.keyboard.press('Shift+F10')
  await expect(page.getByRole('menuitem', { name: 'Editar' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(tasks().getByRole('row', { name: 'Enviar fatura' })).toBeFocused()
})

test('moves a task to another list and undoes it with Ctrl+Z', async () => {
  await page.evaluate(() => window.api.invoke('lists:create', 'Trabalho'))
  await page.reload()
  await addTask('Preparar slides')
  await tasks().getByRole('row', { name: 'Preparar slides' }).click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Mover para lista' }).click()
  await page.getByRole('menuitem', { name: 'Trabalho' }).click()
  await expect(tasks().getByRole('row')).toHaveCount(0)
  await expect(page.getByText('Movida para Trabalho')).toBeVisible()

  await page
    .getByRole('navigation', { name: 'Listas' })
    .getByRole('button', { name: 'Trabalho', exact: true })
    .click()
  await expect(tasks().getByRole('row', { name: 'Preparar slides' })).toBeVisible()

  await page.keyboard.press('Control+z')
  await expect(tasks().getByRole('row')).toHaveCount(0)
})

test('moves a task to another list from the modal', async () => {
  await page.evaluate(() => window.api.invoke('lists:create', 'Casa'))
  await page.reload()
  await addTask('Trocar lâmpada')
  await tasks().getByRole('row', { name: 'Trocar lâmpada' }).dblclick()
  const dialog = page.getByRole('dialog', { name: 'Editar tarefa' })
  await dialog.getByRole('button', { name: /Lista/ }).click()
  await page.getByRole('option', { name: 'Casa' }).click()
  await dialog.getByRole('button', { name: 'Salvar' }).click()
  await expect(tasks().getByRole('row')).toHaveCount(0)
})
