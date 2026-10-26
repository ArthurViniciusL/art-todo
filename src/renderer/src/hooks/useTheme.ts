import { useEffect, useSyncExternalStore } from 'react'
import { DEFAULT_ACCENT, themeTokens } from '../../../shared/palette'
import { useAccent, useThemePreference } from './queries'

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

function subscribe(onChange: () => void): () => void {
  darkQuery.addEventListener('change', onChange)
  return () => darkQuery.removeEventListener('change', onChange)
}

/** Applies the theme class and the accent and status color tokens on <html>. */
export function useTheme(): void {
  const { data: theme = 'system' } = useThemePreference()
  const systemIsDark = useSyncExternalStore(subscribe, () => darkQuery.matches)
  const isDark = theme === 'dark' || (theme === 'system' && systemIsDark)
  const { data: accent } = useAccent()
  const accentHex = accent ?? DEFAULT_ACCENT

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', isDark)
    root.classList.toggle('light', !isDark)
    for (const [name, value] of Object.entries(themeTokens(accentHex, isDark))) {
      root.style.setProperty(name, value)
    }
  }, [isDark, accentHex])
}
