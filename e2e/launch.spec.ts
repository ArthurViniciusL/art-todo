import {
  _electron as electron,
  expect,
  test,
  type ElectronApplication,
  type Page
} from '@playwright/test'

let app: ElectronApplication
let window: Page

test.beforeEach(async () => {
  app = await electron.launch({ args: ['.'] })
  window = await app.firstWindow()
})

test.afterEach(async () => {
  await app.close()
})

test('opens with the app title and the inbox view', async () => {
  await expect(window).toHaveTitle('Art Todo')
  await expect(window.getByRole('heading', { level: 1, name: 'Entrada' })).toBeVisible()
})

test('switches smart views from the sidebar', async () => {
  const nav = window.getByRole('navigation', { name: 'Visões' })
  await nav.getByRole('button', { name: 'Hoje' }).click()
  await expect(window.getByRole('heading', { level: 1, name: 'Hoje' })).toBeVisible()
  await expect(nav.getByRole('button', { name: 'Hoje' })).toHaveAttribute('aria-current', 'page')
})

test('applies the dark theme when chosen', async () => {
  await window.getByRole('radio', { name: 'Escuro' }).click()
  await expect(window.locator('html')).toHaveClass(/\bdark\b/)
  await window.getByRole('radio', { name: 'Claro' }).click()
  await expect(window.locator('html')).toHaveClass(/\blight\b/)
})
