import type { UpdateState } from '../shared/domain'
import { isNewer } from '../shared/version'

export const LATEST_RELEASE_URL =
  'https://api.github.com/repos/ArthurViniciusL/art-todo/releases/latest'

export interface Release {
  version: string
  assetName: string
  assetUrl: string
  /** Lowercase hex SHA-256 of the asset, from the release notes. */
  sha256: string
}

/**
 * Reads a GitHub "latest release" response. The `.deb` asset and the `SHA-256: <hex>` line of
 * the notes are required, so a release without a checksum is never offered.
 */
export function parseRelease(json: unknown): Release | null {
  if (typeof json !== 'object' || json === null) return null
  const { tag_name: tag, body, assets } = json as Record<string, unknown>
  if (typeof tag !== 'string' || typeof body !== 'string' || !Array.isArray(assets)) return null
  const version = tag.replace(/^v/, '')
  const asset = assets.find(
    (item): item is { name: string; browser_download_url: string } =>
      typeof item?.name === 'string' &&
      typeof item?.browser_download_url === 'string' &&
      item.name === `art-todo_${version}_amd64.deb`
  )
  const sha = /SHA-256:\s*`?([0-9a-f]{64})`?/i.exec(body)?.[1]
  if (!asset || !sha) return null
  return {
    version,
    assetName: asset.name,
    assetUrl: asset.browser_download_url,
    sha256: sha.toLowerCase()
  }
}

/** What happened when installation was attempted. */
export type InstallOutcome = 'installed' | 'cancelled' | 'opened'

export interface UpdaterDeps {
  currentVersion: string
  fetchJson: (url: string) => Promise<unknown>
  /** Saves `url` to a local file and returns its path. */
  download: (url: string, name: string, onProgress: (fraction: number) => void) => Promise<string>
  sha256: (file: string) => Promise<string>
  install: (file: string) => Promise<InstallOutcome>
  relaunch: () => void
  emit: (state: UpdateState) => void
  url?: string
}

export interface Updater {
  getState: () => UpdateState
  check: () => Promise<void>
  /** Downloads the available release and verifies its checksum. */
  download: () => Promise<void>
  /** Installs the downloaded package, then relaunches the app. */
  install: () => Promise<void>
}

/** The update flow: check, download (checksum verified), install. One instance per app. */
export function createUpdater(deps: UpdaterDeps): Updater {
  let state: UpdateState = { status: 'idle' }
  let release: Release | null = null
  let file: string | null = null

  const set = (next: UpdateState): void => {
    state = next
    deps.emit(next)
  }
  const fail = (error: unknown, version?: string): void =>
    set({
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
      version
    })

  return {
    getState: () => state,

    async check(): Promise<void> {
      if (state.status === 'checking' || state.status === 'downloading') return
      if (state.status === 'installing') return
      set({ status: 'checking' })
      try {
        const latest = parseRelease(await deps.fetchJson(deps.url ?? LATEST_RELEASE_URL))
        if (latest && isNewer(latest.version, deps.currentVersion)) {
          // A newer release than the one already downloaded starts over.
          if (release?.version !== latest.version) file = null
          release = latest
          set(
            file
              ? { status: 'ready', version: latest.version }
              : { status: 'available', version: latest.version }
          )
        } else {
          set({ status: 'idle' })
        }
      } catch (error) {
        fail(error)
      }
    },

    async download(): Promise<void> {
      if (!release || (state.status !== 'available' && state.status !== 'error')) return
      const { version } = release
      set({ status: 'downloading', version, progress: 0 })
      try {
        const saved = await deps.download(release.assetUrl, release.assetName, (progress) =>
          set({ status: 'downloading', version, progress })
        )
        if ((await deps.sha256(saved)) !== release.sha256) {
          throw new Error('O arquivo baixado não confere com o SHA-256 da versão.')
        }
        file = saved
        set({ status: 'ready', version })
      } catch (error) {
        fail(error, version)
      }
    },

    async install(): Promise<void> {
      if (!release || !file || state.status !== 'ready') return
      const { version } = release
      set({ status: 'installing', version })
      try {
        const outcome = await deps.install(file)
        if (outcome === 'installed') deps.relaunch()
        else set({ status: 'ready', version })
      } catch (error) {
        fail(error, version)
      }
    }
  }
}
