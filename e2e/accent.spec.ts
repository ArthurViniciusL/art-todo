import { expect, test, type ElectronApplication, type Page } from '@playwright/test'
import { launchApp, newProfileDir } from './fixtures'

let app: ElectronApplication
let page: Page

test.afterEach(async () => {
  await app.close()
})

async function open(profile: string): Promise<void> {
  app = await launchApp(profile)
  page = await app.firstWindow()
  await expect(page.getByRole('heading', { level: 1, name: 'Entrada' })).toBeVisible()
}

const cssVar = (name: string): Promise<string> =>
  page.evaluate(
    (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
    name
  )

test('defaults to the HeroUI accent', async () => {
  await open(newProfileDir())
  await page.getByRole('radio', { name: 'Claro' }).click()
  await expect.poll(() => cssVar('--accent')).toBe('#0485f7')
})

test('a preset applies, survives a restart and resets to the default', async () => {
  const profile = newProfileDir()
  await open(profile)
  await page.getByRole('radio', { name: 'Claro' }).click()
  await page.getByRole('button', { name: 'Cor de destaque' }).click()
  await page.getByRole('option', { name: 'Preto' }).click()
  await expect.poll(() => cssVar('--accent')).toBe('#000000')
  await expect.poll(() => cssVar('--accent-foreground')).toBe('#ffffff')
  await app.close()

  await open(profile)
  await expect.poll(() => cssVar('--accent')).toBe('#000000')
  // A black fill disappears on the dark page, so it is shaded there.
  await page.getByRole('radio', { name: 'Escuro' }).click()
  await expect.poll(() => cssVar('--accent')).not.toBe('#000000')

  await page.getByRole('button', { name: 'Cor de destaque' }).click()
  await page.getByRole('button', { name: 'Restaurar padrão' }).click()
  await page.getByRole('radio', { name: 'Claro' }).click({ force: true })
  await expect.poll(() => cssVar('--accent')).toBe('#0485f7')
})

test('accepts a typed hex value', async () => {
  await open(newProfileDir())
  await page.getByRole('radio', { name: 'Claro' }).click()
  await page.getByRole('button', { name: 'Cor de destaque' }).click()
  const field = page.getByRole('textbox', { name: 'Hex' })
  await field.fill('#7828C8')
  await field.press('Enter')
  await expect.poll(() => cssVar('--accent')).toBe('#7828c8')
})
