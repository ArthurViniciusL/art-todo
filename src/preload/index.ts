import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { IPC_CHANNELS, IPC_EVENTS, type IpcApi } from '../shared/ipc'

const allowed = new Set<string>(IPC_CHANNELS)
const allowedEvents = new Set<string>(IPC_EVENTS)

const api: IpcApi = {
  invoke: (channel, ...args) => {
    if (!allowed.has(channel)) return Promise.reject(new Error(`Unknown IPC channel: ${channel}`))
    return ipcRenderer.invoke(channel, ...args)
  },
  on: (event, listener) => {
    if (!allowedEvents.has(event)) throw new Error(`Unknown IPC event: ${event}`)
    // Drop the Electron event object: the renderer only gets the payload.
    const handler = (_event: IpcRendererEvent, ...args: unknown[]): void =>
      (listener as (...payload: unknown[]) => void)(...args)
    ipcRenderer.on(event, handler)
    return () => ipcRenderer.removeListener(event, handler)
  }
}

contextBridge.exposeInMainWorld('api', api)
