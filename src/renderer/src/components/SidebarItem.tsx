import { Tooltip } from '@heroui/react'
import type { LucideIcon } from 'lucide-react'
import { Button } from 'react-aria-components'
import type { ReactNode } from 'react'

interface SidebarItemProps {
  icon: LucideIcon
  label: string
  isActive: boolean
  onSelect: () => void
  onDoubleClick?: () => void
  /** Rendered at the end of the row, outside the main button (for example a menu). */
  trailing?: ReactNode
  /** Icon-only rail button with a tooltip. */
  isRail?: boolean
  /** Shown instead of the icon in the rail (a list's initial). */
  railText?: string
}

export function SidebarItem({
  icon: Icon,
  label,
  isActive,
  onSelect,
  onDoubleClick,
  trailing,
  isRail = false,
  railText
}: SidebarItemProps): React.JSX.Element {
  if (isRail) {
    return (
      <Tooltip delay={300}>
        <Button
          aria-label={label}
          aria-current={isActive ? 'page' : undefined}
          onPress={onSelect}
          className="flex size-9 items-center justify-center rounded-md text-sm font-semibold text-foreground outline-none transition-colors hover:bg-sidebar-active focus-visible:ring-2 focus-visible:ring-focus aria-[current=page]:bg-sidebar-active"
        >
          {railText ? (
            <span aria-hidden className={isActive ? 'text-accent-text' : 'text-muted'}>
              {railText}
            </span>
          ) : (
            <Icon
              className={isActive ? 'size-4 text-accent-text' : 'size-4 text-muted'}
              aria-hidden
            />
          )}
        </Button>
        <Tooltip.Content placement="right">{label}</Tooltip.Content>
      </Tooltip>
    )
  }

  return (
    <div className="group relative flex items-center">
      <button
        type="button"
        aria-current={isActive ? 'page' : undefined}
        onClick={onSelect}
        onDoubleClick={onDoubleClick}
        className="flex h-8 min-w-0 flex-1 items-center gap-2.5 rounded-md px-2.5 text-left text-sm text-foreground outline-none transition-colors hover:bg-sidebar-active focus-visible:ring-2 focus-visible:ring-focus aria-[current=page]:bg-sidebar-active aria-[current=page]:font-semibold"
      >
        <Icon
          className={isActive ? 'size-4 shrink-0 text-accent-text' : 'size-4 shrink-0 text-muted'}
          aria-hidden
        />
        <span className="truncate">{label}</span>
      </button>
      {trailing && (
        <div className="absolute right-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 has-[[aria-expanded=true]]:opacity-100">
          {trailing}
        </div>
      )}
    </div>
  )
}
