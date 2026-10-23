import { useEffect, useSyncExternalStore } from 'react'
import { useUiStore } from '../stores/ui'

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

function subscribe(onChange: () => void): () => void {
  darkQuery.addEventListener('change', onChange)
  return () => darkQuery.removeEventListener('change', onChange)
}

/**
 * Applies the theme class to <html> and sends the preference to the main process,
 * which sets nativeTheme.themeSource so the native window controls match.
 */
export function useTheme(): void {
  const theme = useUiStore((state) => state.theme)
  const systemIsDark = useSyncExternalStore(subscribe, () => darkQuery.matches)
  const isDark = theme === 'dark' || (theme === 'system' && systemIsDark)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', isDark)
    root.classList.toggle('light', !isDark)
  }, [isDark])

  useEffect(() => {
    void window.api.setTheme(theme)
  }, [theme])
}
