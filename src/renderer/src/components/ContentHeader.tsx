import type { ReactNode } from 'react'

interface ContentHeaderProps {
  title: string
  /** Controls on the right side of the header, such as the view mode switcher. */
  actions?: ReactNode
}

export function ContentHeader({ title, actions }: ContentHeaderProps): React.JSX.Element {
  return (
    <header className="app-drag titlebar-inset flex h-11 shrink-0 items-center gap-4 px-6">
      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</h1>
      {actions}
    </header>
  )
}
