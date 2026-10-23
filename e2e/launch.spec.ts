import { expect, test, type ElectronApplication, type Page } from '@playwright/test'
import { launchApp, newProfileDir } from './fixtures'

let app: ElectronApplication
let page: Page

test.afterEach(async () => {
  await app?.close()
})

test('opens with the app title and the Inbox', async () => {
  app = await launchApp()
  page = await app.firstWindow()
  await expect(page).toHaveTitle('Art Todo')
  await expect(page.getByRole('heading', { level: 1, name: 'Entrada' })).toBeVisible()
})

test('switches smart views from the sidebar', async () => {
  app = await launchApp()
  page = await app.firstWindow()
  const nav = page.getByRole('navigation', { name: 'Visões' })
  await expect(nav.getByRole('button', { name: 'Entrada' })).toHaveAttribute('aria-current', 'page')
  await nav.getByRole('button', { name: 'Hoje' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Hoje' })).toBeVisible()
  await expect(nav.getByRole('button', { name: 'Hoje' })).toHaveAttribute('aria-current', 'page')
})

test('applies the chosen theme and keeps it after a restart', async () => {
  const profile = newProfileDir()
  app = await launchApp(profile)
  page = await app.firstWindow()
  await page.getByRole('radio', { name: 'Escuro' }).click()
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  await app.close()

  app = await launchApp(profile)
  page = await app.firstWindow()
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  await page.getByRole('radio', { name: 'Claro' }).click()
  await expect(page.locator('html')).toHaveClass(/\blight\b/)
})

test('exposes the seeded Inbox through IPC', async () => {
  app = await launchApp()
  page = await app.firstWindow()
  const lists = await page.evaluate(() => window.api.invoke('lists:getAll'))
  expect(lists).toEqual([expect.objectContaining({ name: 'Entrada', isInbox: true })])
  await expect(
    page.evaluate(() => window.api.invoke('lists:remove', 1, 'delete-tasks'))
  ).rejects.toThrow(/Inbox cannot be deleted/)
})
