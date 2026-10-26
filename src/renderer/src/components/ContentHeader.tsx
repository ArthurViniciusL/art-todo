import { Button } from '@heroui/react'
import { Menu } from 'lucide-react'
import type { ReactNode } from 'react'
import { useCompactLayout } from '../hooks/useCompactLayout'
import { useUiStore } from '../stores/ui'

interface ContentHeaderProps {
  title: string
  /** Controls on the right side of the header, such as the view mode switcher. */
  actions?: ReactNode
}

export function ContentHeader({ title, actions }: ContentHeaderProps): React.JSX.Element {
  const isCompact = useCompactLayout()
  const setDrawerOpen = useUiStore((state) => state.setDrawerOpen)

  return (
    <header className="app-drag titlebar-inset flex h-11 shrink-0 items-center gap-2 px-3 sm:gap-4 sm:px-6">
      {isCompact && (
        <Button
          size="sm"
          variant="ghost"
          isIconOnly
          aria-label="Abrir barra lateral"
          className="app-no-drag"
          onPress={() => setDrawerOpen(true)}
        >
          <Menu className="size-4" aria-hidden />
        </Button>
      )}
      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</h1>
      {actions}
    </header>
  )
}
