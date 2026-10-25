import { ipcMain } from 'electron'
import type { ViewMode } from '../shared/domain'
import type { IpcChannel, IpcContract } from '../shared/ipc'
import * as v from '../shared/validate'
import type { ListsRepository } from './db/repositories/lists'
import type { SettingsRepository } from './db/repositories/settings'
import type { TasksRepository } from './db/repositories/tasks'
import { applyTheme, storedTheme, THEME_KEY } from './theme'

interface Repositories {
  lists: ListsRepository
  tasks: TasksRepository
  settings: SettingsRepository
}

/** Handlers get raw renderer arguments; each one validates before touching the database. */
type Handlers = {
  [C in IpcChannel]: (...args: unknown[]) => ReturnType<IpcContract[C]>
}

export function registerIpcHandlers({ lists, tasks, settings }: Repositories): void {
  const handlers: Handlers = {
    'settings:getTheme': () => storedTheme(settings),
    'settings:setTheme': (preference) => {
      const theme = v.theme(preference)
      settings.set(THEME_KEY, theme)
      applyTheme(theme)
    },
    'settings:getSmartViewMode': (view) => {
      const stored = settings.get<unknown>(`viewMode:${v.smartView(view)}`, 'list')
      try {
        return v.viewMode(stored)
      } catch {
        return 'list' satisfies ViewMode
      }
    },
    'settings:setSmartViewMode': (view, mode) =>
      settings.set(`viewMode:${v.smartView(view)}`, v.viewMode(mode)),

    'lists:getAll': () => lists.getAll(),
    'lists:create': (name) => lists.create(v.optionalText(name, 'name')),
    'lists:rename': (id, name) => lists.rename(v.id(id), v.text(name, 'name')),
    'lists:setViewMode': (id, mode) => lists.setViewMode(v.id(id), v.viewMode(mode)),
    'lists:remove': (id, mode) => lists.remove(v.id(id), v.listDeleteMode(mode)),

    'tasks:getByList': (listId) => tasks.getByList(v.id(listId)),
    'tasks:getDue': (until, since) => tasks.getDue(v.isoDate(until), v.timestamp(since)),
    'tasks:create': (input) => tasks.create(v.newTask(input)),
    'tasks:update': (id, patch) => tasks.update(v.id(id), v.taskPatch(patch)),
    'tasks:remove': (id) => tasks.remove(v.id(id)),
    'tasks:restore': (task) => tasks.restore(v.task(task))
  }

  for (const [channel, handler] of Object.entries(handlers)) {
    ipcMain.handle(channel, (_event, ...args: unknown[]) => handler(...args))
  }
}
