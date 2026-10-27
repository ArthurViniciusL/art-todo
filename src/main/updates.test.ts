import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UpdateState } from '../shared/domain'
import { createUpdater, parseRelease, type UpdaterDeps } from './updates'

const SHA = 'a'.repeat(64)

function release(version: string, body = `Notas\n\nSHA-256: \`${SHA}\``): unknown {
  return {
    tag_name: `v${version}`,
    body,
    assets: [
      { name: `art-todo_${version}_amd64.deb`, browser_download_url: `https://x/${version}.deb` }
    ]
  }
}

describe('parseRelease', () => {
  it('reads the version, the .deb asset and the checksum', () => {
    expect(parseRelease(release('1.2.0'))).toEqual({
      version: '1.2.0',
      assetName: 'art-todo_1.2.0_amd64.deb',
      assetUrl: 'https://x/1.2.0.deb',
      sha256: SHA
    })
  })

  it('refuses a release without checksum or .deb', () => {
    expect(parseRelease(release('1.2.0', 'sem hash'))).toBeNull()
    expect(parseRelease({ tag_name: 'v1.2.0', body: `SHA-256: ${SHA}`, assets: [] })).toBeNull()
    expect(parseRelease(null)).toBeNull()
  })
})

describe('createUpdater', () => {
  let states: UpdateState[]
  let deps: UpdaterDeps

  beforeEach(() => {
    states = []
    deps = {
      currentVersion: '1.1.0',
      fetchJson: vi.fn(async () => release('1.2.0')),
      download: vi.fn(async (_url, name, onProgress) => {
        onProgress(0.5)
        return `/tmp/${name}`
      }),
      sha256: vi.fn(async () => SHA),
      install: vi.fn(async () => 'installed' as const),
      relaunch: vi.fn(),
      emit: (state) => states.push(state)
    }
  })

  it('checks, downloads, verifies and installs, then relaunches', async () => {
    const updater = createUpdater(deps)
    await updater.check()
    expect(updater.getState()).toEqual({ status: 'available', version: '1.2.0' })
    await updater.download()
    expect(states).toContainEqual({ status: 'downloading', version: '1.2.0', progress: 0.5 })
    expect(updater.getState()).toEqual({ status: 'ready', version: '1.2.0' })
    await updater.install()
    expect(deps.install).toHaveBeenCalledWith('/tmp/art-todo_1.2.0_amd64.deb')
    expect(deps.relaunch).toHaveBeenCalled()
  })

  it('stays idle when the latest release is not newer', async () => {
    deps.fetchJson = async () => release('1.1.0')
    const updater = createUpdater(deps)
    await updater.check()
    expect(updater.getState()).toEqual({ status: 'idle' })
  })

  it('rejects a download whose checksum does not match', async () => {
    deps.sha256 = async () => 'b'.repeat(64)
    const updater = createUpdater(deps)
    await updater.check()
    await updater.download()
    expect(updater.getState()).toMatchObject({ status: 'error', version: '1.2.0' })
    await updater.install()
    expect(deps.install).not.toHaveBeenCalled()
  })

  it('goes back to ready when the password prompt is cancelled', async () => {
    deps.install = async () => 'cancelled'
    const updater = createUpdater(deps)
    await updater.check()
    await updater.download()
    await updater.install()
    expect(updater.getState()).toEqual({ status: 'ready', version: '1.2.0' })
    expect(deps.relaunch).not.toHaveBeenCalled()
  })

  it('reports a network failure as an error', async () => {
    deps.fetchJson = async () => {
      throw new Error('offline')
    }
    const updater = createUpdater(deps)
    await updater.check()
    expect(updater.getState()).toEqual({ status: 'error', message: 'offline', version: undefined })
  })
})
