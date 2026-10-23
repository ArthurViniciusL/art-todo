import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannel, type IpcApi } from '../shared/ipc'

const api: IpcApi = {
  setTheme: (preference) => ipcRenderer.invoke(IpcChannel.setTheme, preference)
}

contextBridge.exposeInMainWorld('api', api)
