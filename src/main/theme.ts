import { BrowserWindow, nativeTheme } from 'electron'
import { isThemePreference, titlebarOverlay, type ThemePreference } from '../shared/theme'
import type { SettingsRepository } from './db/repositories/settings'

export const THEME_KEY = 'theme'

export function currentTitlebarOverlay(): ReturnType<typeof titlebarOverlay> {
  return titlebarOverlay(nativeTheme.shouldUseDarkColors)
}

export function storedTheme(settings: SettingsRepository): ThemePreference {
  const value = settings.get<unknown>(THEME_KEY, 'system')
  return isThemePreference(value) ? value : 'system'
}

export function applyTheme(preference: ThemePreference): void {
  nativeTheme.themeSource = preference
}

/** The renderer applies its own theme class; only the native window controls need a push. */
export function watchNativeTheme(): void {
  nativeTheme.on('updated', () => {
    for (const window of BrowserWindow.getAllWindows()) {
      window.setTitleBarOverlay(currentTitlebarOverlay())
    }
  })
}
