import { app, shell, BrowserWindow, Menu, Notification } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { openDatabase } from './db/client'
import { createListsRepository } from './db/repositories/lists'
import { createSettingsRepository, type SettingsRepository } from './db/repositories/settings'
import { createTasksRepository } from './db/repositories/tasks'
import { registerIpcHandlers, UPDATE_AUTO_CHECK_KEY } from './ipc'
import { startReminders, type Reminder } from './reminders'
import { systemUpdaterDeps } from './update-system'
import { createUpdater } from './updates'
import { applyTheme, currentTitlebarOverlay, storedTheme, watchNativeTheme } from './theme'
import { loadWindowState, trackWindowState } from './window-state'

// Lets E2E tests run against a throwaway profile.
if (process.env['ART_TODO_USER_DATA']) {
  app.setPath('userData', process.env['ART_TODO_USER_DATA'])
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
}

const UPDATE_FIRST_CHECK_MS = Number(process.env['ART_TODO_UPDATE_DELAY_MS']) || 10_000
const UPDATE_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000

// Electron drops a notification's click handler once the object is garbage collected.
const shownNotifications = new Set<Notification>()

function revealWindow(window: BrowserWindow): void {
  if (window.isMinimized()) window.restore()
  window.show()
  window.focus()
}

/** System notification for a reminder; clicking it brings the window up on the task. */
function showReminder(reminder: Reminder, getWindow: () => BrowserWindow): void {
  const notification = new Notification({ title: reminder.title, body: reminder.body, icon })
  shownNotifications.add(notification)
  const forget = (): void => void shownNotifications.delete(notification)
  notification.on('click', () => {
    forget()
    const window = getWindow()
    revealWindow(window)
    window.webContents.send('reminders:open', reminder.target)
  })
  notification.on('close', forget)
  notification.on('failed', forget)
  notification.show()
}

function createWindow(settings: SettingsRepository): BrowserWindow {
  const state = loadWindowState(settings)
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    ...state.bounds,
    // Down to a phone-sized window; the layout switches to a drawer below 640 px.
    minWidth: 360,
    minHeight: 520,
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
  const tasks = createTasksRepository(db)
  // ART_TODO_UPDATE_URL points E2E tests (and manual checks) at a local release feed.
  const updateUrl = process.env['ART_TODO_UPDATE_URL']
  const updater = createUpdater({
    ...systemUpdaterDeps,
    url: updateUrl,
    emit: (state) => {
      for (const window of BrowserWindow.getAllWindows()) {
        window.webContents.send('updates:state', state)
      }
    }
  })
  registerIpcHandlers({ lists: createListsRepository(db), tasks, settings, updater })

  // Set before the window exists so the first paint already has the right theme.
  applyTheme(storedTheme(settings))
  watchNativeTheme()

  let mainWindow = createWindow(settings)

  // Automatic checks only in the installed app (or against a test feed), and only when enabled.
  if (app.isPackaged || updateUrl) {
    const autoCheck = (): void => {
      if (settings.get<unknown>(UPDATE_AUTO_CHECK_KEY, true) !== false) void updater.check()
    }
    setTimeout(autoCheck, UPDATE_FIRST_CHECK_MS)
    setInterval(autoCheck, UPDATE_CHECK_INTERVAL_MS)
  }

  // Start once the renderer can receive a notification click. Without notification support,
  // alerts stay pending instead of being marked as fired.
  if (Notification.isSupported()) {
    mainWindow.webContents.once('did-finish-load', () =>
      startReminders(tasks, (reminder) => showReminder(reminder, () => mainWindow))
    )
  }

  app.on('second-instance', () => revealWindow(mainWindow))

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow(settings)
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
