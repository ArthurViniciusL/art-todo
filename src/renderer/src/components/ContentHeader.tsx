interface ContentHeaderProps {
  title: string
}

export function ContentHeader({ title }: ContentHeaderProps): React.JSX.Element {
  return (
    <header className="app-drag titlebar-inset flex h-11 shrink-0 items-center px-6">
      <h1 className="text-sm font-semibold">{title}</h1>
    </header>
  )
}
