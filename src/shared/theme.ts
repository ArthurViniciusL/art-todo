export type ThemePreference = 'system' | 'light' | 'dark'

export const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark']

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEME_PREFERENCES as readonly string[]).includes(value)
}

export const TITLEBAR_HEIGHT = 44

// Must match --background and --foreground in src/renderer/src/assets/main.css.
export const TITLEBAR_COLORS = {
  light: { color: '#fafaf9', symbolColor: '#1a1a1a' },
  dark: { color: '#161616', symbolColor: '#ededed' }
} as const

export function titlebarOverlay(isDark: boolean): {
  color: string
  symbolColor: string
  height: number
} {
  return { ...TITLEBAR_COLORS[isDark ? 'dark' : 'light'], height: TITLEBAR_HEIGHT }
}
