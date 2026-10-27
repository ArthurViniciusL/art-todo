import { expect, test, type ElectronApplication, type Page } from '@playwright/test'
import { launchApp, newProfileDir } from './fixtures'

let app: ElectronApplication
let page: Page

test.afterEach(async () => {
  await app.close()
})

async function open(profile = newProfileDir()): Promise<void> {
  app = await launchApp(profile)
  page = await app.firstWindow()
  await expect(page.getByRole('heading', { level: 1, name: 'Entrada' })).toBeVisible()
}

/**
 * Resizes the window and waits for the page to see it. The window manager can drop a resize
 * while getSize() already reports the new size, so ask again until the page width changes.
 */
async function setWindowSize(width: number, height: number): Promise<void> {
  await expect
    .poll(async () => {
      await app.evaluate(
        ({ BrowserWindow }, [width, height]) =>
          BrowserWindow.getAllWindows()[0].setSize(width, height),
        [width, height]
      )
      return page.evaluate(() => window.innerWidth)
    })
    .toBe(width)
}

const sidebar = (): ReturnType<Page['getByRole']> =>
  page.getByRole('complementary', { name: 'Barra lateral' })

test('collapses the sidebar to a rail and remembers it', async () => {
  const profile = newProfileDir()
  await open(profile)
  await page.getByRole('button', { name: 'Recolher barra lateral' }).click()
  await expect(page.getByRole('button', { name: 'Expandir barra lateral' })).toBeVisible()
  expect((await sidebar().boundingBox())!.width).toBeLessThan(80)

  // Rail items keep their names for navigation and screen readers.
  await sidebar().getByRole('button', { name: 'Hoje', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hoje')
  await app.close()

  await open(profile)
  await expect(page.getByRole('button', { name: 'Expandir barra lateral' })).toBeVisible()
  await page.keyboard.press('Control+b')
  await expect(page.getByRole('button', { name: 'Recolher barra lateral' })).toBeVisible()
})

test('creating a list from the rail expands the sidebar', async () => {
  await open()
  await page.keyboard.press('Control+b')
  await sidebar().getByRole('button', { name: 'Nova lista' }).click()
  await expect(page.getByRole('textbox', { name: 'Nome da nova lista' })).toBeFocused()
  await expect(page.getByRole('button', { name: 'Recolher barra lateral' })).toBeVisible()
})

test('shrinks to a phone-sized window with a drawer', async () => {
  await open()
  await setWindowSize(360, 640)
  const [width] = await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].getSize()
  )
  expect(width).toBe(360)
  await expect(sidebar()).toBeHidden()
  await expect(page.getByRole('heading', { level: 1, name: 'Entrada' })).toBeVisible()

  await page.getByRole('button', { name: 'Abrir barra lateral' }).click()
  await sidebar().getByRole('button', { name: 'Próximos', exact: true }).click()
  await expect(sidebar()).toBeHidden()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Próximos')

  await page.keyboard.press('Control+b')
  await expect(sidebar()).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(sidebar()).toBeHidden()

  // Back to a wide window: the regular sidebar returns.
  await setWindowSize(1000, 700)
  await expect(sidebar()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Abrir barra lateral' })).toHaveCount(0)
})

test('the board scrolls sideways on a narrow window', async () => {
  await open()
  await setWindowSize(375, 700)
  await page.keyboard.press('Control+Shift+3')
  await expect(page.getByRole('heading', { name: 'Feito' })).toBeAttached()
  // The resize lands a moment later; poll until the layout has reflowed.
  await expect
    .poll(() =>
      page.evaluate(() => {
        const board = document.querySelector(
          'section[aria-labelledby="column-todo"]'
        )!.parentElement!
        return board.scrollWidth > board.clientWidth
      })
    )
    .toBe(true)
})

test('header controls stay clear of the native window buttons', async () => {
  await open()
  for (const [width, height] of [
    [1100, 700],
    [375, 700]
  ]) {
    await setWindowSize(width, height)
    await expect
      .poll(() =>
        page.evaluate(() => {
          const overlay = (
            navigator as Navigator & {
              windowControlsOverlay: { getTitlebarAreaRect: () => DOMRect }
            }
          ).windowControlsOverlay.getTitlebarAreaRect()
          const switcher = document
            .querySelector('[aria-label="Modo de visualização"]')!
            .getBoundingClientRect()
          return switcher.right <= overlay.right
        })
      )
      .toBe(true)
  }
})

test('overdue tasks in a long column do not make the page scroll', async () => {
  await open()
  await page.evaluate(async () => {
    const [inbox] = await window.api.invoke('lists:getAll')
    for (let i = 0; i < 20; i++) {
      await window.api.invoke('tasks:create', {
        listId: inbox.id,
        title: `Atrasada ${i}`,
        dueDate: '2020-01-01'
      })
    }
  })
  await page.reload()
  await page.getByRole('radio', { name: 'Colunas' }).click()
  await expect(page.getByRole('row', { name: /Atrasada 19/ })).toBeAttached()
  // Hidden "(atrasada)" labels below the fold used to stretch the document past the window.
  const overflow = await page.evaluate(
    () => document.scrollingElement!.scrollHeight - window.innerHeight
  )
  expect(overflow).toBe(0)
})
