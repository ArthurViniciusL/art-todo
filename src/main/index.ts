import { app, shell, BrowserWindow, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { openDatabase } from './db/client'
import { createListsRepository } from './db/repositories/lists'
import { createSettingsRepository, type SettingsRepository } from './db/repositories/settings'
import { createTasksRepository } from './db/repositories/tasks'
import { registerIpcHandlers } from './ipc'
import { applyTheme, currentTitlebarOverlay, storedTheme, watchNativeTheme } from './theme'
import { loadWindowState, trackWindowState } from './window-state'

// Lets E2E tests run against a throwaway profile.
if (process.env['ART_TODO_USER_DATA']) {
  app.setPath('userData', process.env['ART_TODO_USER_DATA'])
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
}

function createWindow(settings: SettingsRepository): BrowserWindow {
  const state = loadWindowState(settings)
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    ...state.bounds,
    minWidth: 720,
    minHeight: 480,
    title: 'Art Todo',
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: currentTitlebarOverlay(),
    backgroundColor: currentTitlebarOverlay().color,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true
    }
  })
  trackWindowState(mainWindow, settings)

  mainWindow.on('ready-to-show', () => {
    if (state.isMaximized) mainWindow.maximize()
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
  return mainWindow
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.arthurvinicius.arttodo')
  // No menu bar: its default accelerators (Ctrl+Z, Ctrl+R…) would swallow the app's shortcuts.
  Menu.setApplicationMenu(null)

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const db = openDatabase(
    join(app.getPath('userData'), 'art-todo.db'),
    join(app.getAppPath(), 'resources/migrations')
  )
  const settings = createSettingsRepository(db)
  registerIpcHandlers({
    lists: createListsRepository(db),
    tasks: createTasksRepository(db),
    settings
  })

  // Set before the window exists so the first paint already has the right theme.
  applyTheme(storedTheme(settings))
  watchNativeTheme()

  let mainWindow = createWindow(settings)

  app.on('second-instance', () => {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow(settings)
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
