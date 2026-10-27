import { _electron as electron, type ElectronApplication } from '@playwright/test'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

export function newProfileDir(): string {
  return mkdtempSync(join(tmpdir(), 'art-todo-e2e-'))
}

/** Launches the built app against an isolated profile directory. */
export function launchApp(
  profileDir = newProfileDir(),
  env: Record<string, string> = {}
): Promise<ElectronApplication> {
  return electron.launch({
    args: ['.'],
    env: { ...process.env, ART_TODO_USER_DATA: profileDir, ...env }
  })
}
