import { ipcMain } from 'electron'
import { isHexColor } from '../shared/color'
import type { ListSort, ViewMode } from '../shared/domain'
import type { IpcChannel, IpcContract } from '../shared/ipc'
import * as v from '../shared/validate'
import type { ListsRepository } from './db/repositories/lists'
import type { SettingsRepository } from './db/repositories/settings'
import type { TasksRepository } from './db/repositories/tasks'
import { copyText, saveMarkdown } from './export'
import { applyTheme, storedTheme, THEME_KEY } from './theme'

interface Repositories {
  lists: ListsRepository
  tasks: TasksRepository
  settings: SettingsRepository
}

/** Handlers get raw renderer arguments; each one validates before touching the database. */
type Handlers = {
  [C in IpcChannel]: (
    ...args: unknown[]
  ) => ReturnType<IpcContract[C]> | Promise<ReturnType<IpcContract[C]>>
}

export function registerIpcHandlers({ lists, tasks, settings }: Repositories): void {
  const handlers: Handlers = {
    'settings:getTheme': () => storedTheme(settings),
    'settings:setTheme': (preference) => {
      const theme = v.theme(preference)
      settings.set(THEME_KEY, theme)
      applyTheme(theme)
    },
    'settings:getAccent': () => {
      const stored = settings.get<unknown>('accent', null)
      return isHexColor(stored) ? stored : null
    },
    'settings:setAccent': (hex) => settings.set('accent', v.nullableHexColor(hex)),
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
    'settings:getListSort': () => {
      try {
        return v.listSort(settings.get<unknown>('listSort', 'manual'))
      } catch {
        return 'manual' satisfies ListSort
      }
    },
    'settings:setListSort': (sort) => settings.set('listSort', v.listSort(sort)),

    'lists:getAll': () => lists.getAll(),
    'lists:create': (name) => lists.create(v.optionalText(name, 'name')),
    'lists:rename': (id, name) => lists.rename(v.id(id), v.text(name, 'name')),
    'lists:setViewMode': (id, mode) => lists.setViewMode(v.id(id), v.viewMode(mode)),
    'lists:move': (id, target) => lists.move(v.id(id), v.listMove(target)),
    'lists:remove': (id, mode) => lists.remove(v.id(id), v.listDeleteMode(mode)),

    'tasks:getByList': (listId) => tasks.getByList(v.id(listId)),
    'tasks:getDue': (until, since) => tasks.getDue(v.isoDate(until), v.timestamp(since)),
    'tasks:create': (input) => tasks.create(v.newTask(input)),
    'tasks:update': (id, patch) => tasks.update(v.id(id), v.taskPatch(patch)),
    'tasks:move': (id, target) => tasks.move(v.id(id), v.taskMove(target)),
    'tasks:search': (query) => tasks.search(v.text(query, 'query')),
    'tasks:remove': (id) => tasks.remove(v.id(id)),
    'tasks:restore': (task) => tasks.restore(v.task(task)),

    'export:saveMarkdown': (title, content) =>
      saveMarkdown(v.text(title, 'title'), v.text(content, 'content')),
    'export:copy': (text) => copyText(v.text(text, 'text'))
  }

  for (const [channel, handler] of Object.entries(handlers)) {
    ipcMain.handle(channel, (_event, ...args: unknown[]) => handler(...args))
  }
}
