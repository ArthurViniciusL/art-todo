import { useEffect, useSyncExternalStore } from 'react'
import { useThemePreference } from './queries'

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

function subscribe(onChange: () => void): () => void {
  darkQuery.addEventListener('change', onChange)
  return () => darkQuery.removeEventListener('change', onChange)
}

/** Applies the stored theme preference as a class on <html>. */
export function useTheme(): void {
  const { data: theme = 'system' } = useThemePreference()
  const systemIsDark = useSyncExternalStore(subscribe, () => darkQuery.matches)
  const isDark = theme === 'dark' || (theme === 'system' && systemIsDark)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', isDark)
    root.classList.toggle('light', !isDark)
  }, [isDark])
}
