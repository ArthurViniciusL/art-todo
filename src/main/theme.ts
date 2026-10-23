import { BrowserWindow, ipcMain, nativeTheme } from 'electron'
import { IpcChannel } from '../shared/ipc'
import { isThemePreference, titlebarOverlay } from '../shared/theme'

export function currentTitlebarOverlay(): ReturnType<typeof titlebarOverlay> {
  return titlebarOverlay(nativeTheme.shouldUseDarkColors)
}

export function registerThemeHandlers(): void {
  ipcMain.handle(IpcChannel.setTheme, (_event, preference: unknown) => {
    if (!isThemePreference(preference)) throw new Error(`Invalid theme preference: ${preference}`)
    nativeTheme.themeSource = preference
  })

  // The renderer follows prefers-color-scheme on its own; only the native controls need a push.
  nativeTheme.on('updated', () => {
    for (const window of BrowserWindow.getAllWindows()) {
      window.setTitleBarOverlay(currentTitlebarOverlay())
    }
  })
}
