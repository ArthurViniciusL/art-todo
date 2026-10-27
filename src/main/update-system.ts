import { execFile } from 'child_process'
import { createHash } from 'crypto'
import { app, net, shell } from 'electron'
import { createReadStream, createWriteStream } from 'fs'
import { mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import type { InstallOutcome, UpdaterDeps } from './updates'

// pkexec exit codes: 126 = the user dismissed the password dialog, 127 = not authorized.
const PKEXEC_DENIED = new Set([126, 127])

/** Electron and OS side of the updater: network, files, checksum and pkexec. */
export const systemUpdaterDeps: Omit<UpdaterDeps, 'emit' | 'url'> = {
  currentVersion: app.getVersion(),

  async fetchJson(url) {
    const response = await net.fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
    if (!response.ok) throw new Error(`Falha ao verificar atualizações (HTTP ${response.status}).`)
    return response.json()
  },

  async download(url, name, onProgress) {
    // Only GitHub's own asset links, unless a test feed is configured.
    if (!process.env['ART_TODO_UPDATE_URL'] && new URL(url).host !== 'github.com') {
      throw new Error('Endereço de download inesperado para a atualização.')
    }
    const response = await net.fetch(url)
    if (!response.ok || !response.body) {
      throw new Error(`Falha ao baixar a atualização (HTTP ${response.status}).`)
    }
    const dir = join(app.getPath('temp'), 'art-todo-update')
    await rm(dir, { recursive: true, force: true })
    await mkdir(dir, { recursive: true })
    const file = join(dir, name)
    const total = Number(response.headers.get('content-length')) || 0
    let received = 0
    const body = Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0])
    body.on('data', (chunk: Buffer) => {
      received += chunk.length
      if (total) onProgress(Math.min(1, received / total))
    })
    await pipeline(body, createWriteStream(file))
    return file
  },

  async sha256(file) {
    const hash = createHash('sha256')
    await pipeline(createReadStream(file), hash)
    return hash.digest('hex')
  },

  install(file) {
    // E2E tests stop here: record the request instead of asking for a password.
    if (process.env['ART_TODO_FAKE_UPDATE_INSTALL']) {
      ;(globalThis as { updateInstallRequest?: string }).updateInstallRequest = file
      return new Promise<InstallOutcome>(() => {})
    }
    return new Promise<InstallOutcome>((resolve, reject) => {
      // execFile, never a shell: the path goes to apt-get as a single argument.
      execFile('pkexec', ['apt-get', 'install', '-y', file], (error) => {
        if (!error) return resolve('installed')
        const code = (error as NodeJS.ErrnoException & { code?: unknown }).code
        if (code === 'ENOENT') {
          // No pkexec: hand the package to the system installer.
          void shell.openPath(file)
          return resolve('opened')
        }
        if (typeof code === 'number' && PKEXEC_DENIED.has(code)) return resolve('cancelled')
        reject(new Error('A instalação da atualização falhou.'))
      })
    })
  },

  relaunch() {
    app.relaunch()
    app.exit(0)
  }
}
