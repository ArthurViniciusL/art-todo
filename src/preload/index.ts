import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS, type IpcApi } from '../shared/ipc'

const allowed = new Set<string>(IPC_CHANNELS)

const api: IpcApi = {
  invoke: (channel, ...args) => {
    if (!allowed.has(channel)) return Promise.reject(new Error(`Unknown IPC channel: ${channel}`))
    return ipcRenderer.invoke(channel, ...args)
  }
}

contextBridge.exposeInMainWorld('api', api)
