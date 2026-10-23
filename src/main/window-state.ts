import { screen, type BrowserWindow, type Rectangle } from 'electron'
import type { SettingsRepository } from './db/repositories/settings'

const KEY = 'window'

export interface WindowState {
  bounds?: Rectangle
  isMaximized?: boolean
}

/** Saved bounds, dropped when they no longer fit on any connected display. */
export function loadWindowState(settings: SettingsRepository): WindowState {
  const state = settings.get<WindowState>(KEY, {})
  const bounds = state.bounds
  if (!bounds) return state
  const visible = screen.getAllDisplays().some(({ workArea }) => {
    return (
      bounds.x >= workArea.x &&
      bounds.y >= workArea.y &&
      bounds.x + bounds.width <= workArea.x + workArea.width &&
      bounds.y + bounds.height <= workArea.y + workArea.height
    )
  })
  return visible ? state : { isMaximized: state.isMaximized }
}

export function trackWindowState(window: BrowserWindow, settings: SettingsRepository): void {
  window.on('close', () => {
    settings.set<WindowState>(KEY, {
      bounds: window.getNormalBounds(),
      isMaximized: window.isMaximized()
    })
  })
}
