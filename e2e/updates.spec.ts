import { expect, test, type ElectronApplication, type Page } from '@playwright/test'
import { createHash } from 'crypto'
import { createServer, type Server } from 'http'
import type { AddressInfo } from 'net'
import { launchApp, newProfileDir } from './fixtures'

const VERSION = '9.9.9'
const PACKAGE = Buffer.alloc(256 * 1024, 7)

let server: Server
let baseUrl: string
let app: ElectronApplication
let page: Page

/** A local stand-in for the GitHub "latest release" API and its .deb asset. */
function startFeed(sha256: string): Promise<void> {
  server = createServer((request, response) => {
    if (request.url === '/latest') {
      response.setHeader('Content-Type', 'application/json')
      response.end(
        JSON.stringify({
          tag_name: `v${VERSION}`,
          body: `Notas\n\nSHA-256: \`${sha256}\``,
          assets: [
            {
              name: `art-todo_${VERSION}_amd64.deb`,
              browser_download_url: `${baseUrl}/art-todo.deb`
            }
          ]
        })
      )
    } else if (request.url === '/art-todo.deb') {
      response.setHeader('Content-Length', PACKAGE.length)
      response.end(PACKAGE)
    } else {
      response.statusCode = 404
      response.end()
    }
  })
  return new Promise((resolve) =>
    server.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
      resolve()
    })
  )
}

async function launch(profileDir = newProfileDir()): Promise<void> {
  app = await launchApp(profileDir, {
    ART_TODO_UPDATE_URL: `${baseUrl}/latest`,
    ART_TODO_UPDATE_DELAY_MS: '300',
    ART_TODO_FAKE_UPDATE_INSTALL: '1'
  })
  page = await app.firstWindow()
}

test.afterEach(async () => {
  await app.close()
  server.close()
})

const sha = createHash('sha256').update(PACKAGE).digest('hex')

test('finds, downloads and installs a new version', async () => {
  await startFeed(sha)
  await launch()
  await expect(page.getByText(`Versão ${VERSION} disponível`)).toBeVisible()
  await page
    .getByRole('button', { name: `Baixar versão ${VERSION}` })
    .first()
    .click()
  const install = page.getByRole('button', { name: `Instalar versão ${VERSION} e reiniciar` })
  await expect(install.first()).toBeVisible()
  await expect(page.getByText(`Atualizar para ${VERSION}`)).toBeVisible()
  // The "available" toast goes away once the download starts.
  await expect(page.getByText(`Versão ${VERSION} disponível`)).toHaveCount(0)

  await install.first().click()
  await expect
    .poll(() =>
      app.evaluate(() => (globalThis as { updateInstallRequest?: string }).updateInstallRequest)
    )
    .toMatch(new RegExp(`art-todo_${VERSION}_amd64\\.deb$`))
})

test('rejects a download whose checksum does not match', async () => {
  await startFeed('0'.repeat(64))
  await launch()
  await page
    .getByRole('button', { name: `Baixar versão ${VERSION}` })
    .first()
    .click()
  await expect(page.getByText('não confere com o SHA-256').first()).toBeVisible()
  await expect(page.getByRole('button', { name: /Instalar versão/ })).toHaveCount(0)
})

test('automatic checks can be turned off', async () => {
  await startFeed(sha)
  const profile = newProfileDir()
  await launch(profile)
  await page.evaluate(() => window.api.invoke('settings:setUpdateAutoCheck', false))
  await app.close()

  await launch(profile)
  await page.waitForTimeout(1000)
  await expect(page.getByRole('button', { name: 'Verificar atualizações' })).toBeVisible()
  await page.getByRole('button', { name: 'Verificar atualizações' }).click()
  await expect(page.getByRole('button', { name: `Baixar versão ${VERSION}` }).first()).toBeVisible()
})
