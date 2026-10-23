import { _electron as electron, expect, test } from '@playwright/test'

test('app window opens with the app title', async () => {
  const app = await electron.launch({ args: ['.'] })
  const window = await app.firstWindow()
  await expect(window).toHaveTitle('Art Todo')
  await expect(window.getByRole('heading', { name: 'Art Todo' })).toBeVisible()
  await app.close()
})
