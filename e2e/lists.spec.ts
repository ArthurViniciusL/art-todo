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

async function seedLists(names: string[]): Promise<void> {
  await page.evaluate(async (names) => {
    for (const name of names) await window.api.invoke('lists:create', name)
  }, names)
  await page.reload()
}

const listOrder = (): Promise<string[]> =>
  listsNav()
    .getByRole('button', { name: /^(?!Opções)/ })
    .allTextContents()

test('sorts lists alphabetically and back to manual order', async () => {
  await seedLists(['Viagem', 'casa', 'Ácido', 'Banco'])
  expect(await listOrder()).toEqual(['Viagem', 'casa', 'Ácido', 'Banco'])

  await page.getByRole('button', { name: 'Ordenar listas' }).click()
  await page.getByRole('menuitemradio', { name: 'Alfabética' }).click()
  await expect.poll(listOrder).toEqual(['Ácido', 'Banco', 'casa', 'Viagem'])

  // Ctrl+4 opens the first list as shown (once the menu has closed).
  await expect(page.locator('[role=dialog]')).toHaveCount(0)
  await page.keyboard.press('Control+4')
  await expect(page.getByRole('heading', { level: 1, name: 'Ácido' })).toBeVisible()

  await page.reload()
  await expect.poll(listOrder).toEqual(['Ácido', 'Banco', 'casa', 'Viagem'])
  await page.getByRole('button', { name: 'Ordenar listas' }).click()
  await page.getByRole('menuitemradio', { name: 'Manual' }).click()
  await expect.poll(listOrder).toEqual(['Viagem', 'casa', 'Ácido', 'Banco'])
})

test('reorders lists with Alt+arrows and from the list menu', async () => {
  await seedLists(['Um', 'Dois', 'Três'])
  await listsNav().getByRole('button', { name: 'Três', exact: true }).focus()
  await page.keyboard.press('Alt+ArrowUp')
  await expect.poll(listOrder).toEqual(['Um', 'Três', 'Dois'])
  await expect(listsNav().getByRole('button', { name: 'Três', exact: true })).toBeFocused()

  await listsNav().getByRole('button', { name: 'Opções da lista Um' }).click()
  await page.getByRole('menuitem', { name: 'Mover para baixo' }).click()
  await expect.poll(listOrder).toEqual(['Três', 'Um', 'Dois'])

  await page.reload()
  await expect.poll(listOrder).toEqual(['Três', 'Um', 'Dois'])
})

test('reorders lists by dragging', async () => {
  await seedLists(['Um', 'Dois', 'Três'])
  const from = (await listsNav().getByRole('button', { name: 'Três', exact: true }).boundingBox())!
  const to = (await listsNav().getByRole('button', { name: 'Um', exact: true }).boundingBox())!
  await page.mouse.move(from.x + 20, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(from.x + 25, from.y + from.height / 2 - 5, { steps: 5 })
  await page.mouse.move(to.x + 20, to.y + 4, { steps: 15 })
  // Release only once React Aria shows the drop target, or the drop can be lost.
  await expect(listsNav().locator('[data-drop-indicator]')).toBeVisible()
  await page.mouse.up()
  await expect.poll(listOrder).toEqual(['Três', 'Um', 'Dois'])
})
