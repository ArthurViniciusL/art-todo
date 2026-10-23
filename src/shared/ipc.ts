import type { ThemePreference } from './theme'

// Single source of truth for IPC channel names and their payload types.
export const IpcChannel = {
  setTheme: 'theme:set'
} as const

export interface IpcApi {
  setTheme(preference: ThemePreference): Promise<void>
}
