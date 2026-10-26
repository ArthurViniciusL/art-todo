import { useSyncExternalStore } from 'react'

/** Below this width the sidebar becomes an overlay drawer (phone-sized windows). */
export const COMPACT_QUERY = '(max-width: 640px)'

const compactQuery = window.matchMedia(COMPACT_QUERY)

function subscribe(onChange: () => void): () => void {
  compactQuery.addEventListener('change', onChange)
  return () => compactQuery.removeEventListener('change', onChange)
}

export function isCompactLayout(): boolean {
  return compactQuery.matches
}

export function useCompactLayout(): boolean {
  return useSyncExternalStore(subscribe, isCompactLayout)
}
