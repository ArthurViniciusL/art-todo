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

const setWindowSize = (width: number, height: number): Promise<void> =>
  app.evaluate(
    ({ BrowserWindow }, [width, height]) => {
      BrowserWindow.getAllWindows()[0].setSize(width, height)
    },
    [width, height]
  )

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
  const overflows = await page.evaluate(() => {
    const board = document.querySelector('section[aria-labelledby="column-todo"]')!.parentElement!
    return board.scrollWidth > board.clientWidth
  })
  expect(overflows).toBe(true)
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
