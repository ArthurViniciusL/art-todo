import { useEffect } from 'react'
import { useCompactLayout } from '../hooks/useCompactLayout'
import { useUiStore } from '../stores/ui'
import { Sidebar } from './Sidebar'

/** Sidebar layout by window width: full or rail when wide, an overlay drawer when narrow. */
export function AppSidebar(): React.JSX.Element | null {
  const isCompact = useCompactLayout()
  const isCollapsed = useUiStore((state) => state.isSidebarCollapsed)
  const isDrawerOpen = useUiStore((state) => state.isDrawerOpen)
  const setDrawerOpen = useUiStore((state) => state.setDrawerOpen)
  const isCreatingList = useUiStore((state) => state.isCreatingList)

  // Creating a list needs the sidebar's name field, so open the drawer for it.
  useEffect(() => {
    if (isCompact && isCreatingList) setDrawerOpen(true)
  }, [isCompact, isCreatingList, setDrawerOpen])

  // The drawer only exists on narrow windows.
  useEffect(() => {
    if (!isCompact) setDrawerOpen(false)
  }, [isCompact, setDrawerOpen])

  useEffect(() => {
    if (!isDrawerOpen) return
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isDrawerOpen, setDrawerOpen])

  if (!isCompact) return <Sidebar variant={isCollapsed ? 'rail' : 'full'} />
  if (!isDrawerOpen) return null

  return (
    <div className="fixed inset-0 z-40 flex">
      <Sidebar variant="drawer" />
      <button
        type="button"
        aria-label="Fechar barra lateral"
        tabIndex={-1}
        className="flex-1 bg-black/40"
        onClick={() => setDrawerOpen(false)}
      />
    </div>
  )
}
