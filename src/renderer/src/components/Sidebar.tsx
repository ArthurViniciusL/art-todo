import { Button } from '@heroui/react'
import { Plus } from 'lucide-react'
import { useUiStore } from '../stores/ui'
import { SMART_VIEWS } from '../views'
import { ThemeSwitcher } from './ThemeSwitcher'

export function Sidebar(): React.JSX.Element {
  const view = useUiStore((state) => state.view)
  const setView = useUiStore((state) => state.setView)

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-separator bg-sidebar">
      <div className="app-drag flex h-11 items-center px-4">
        <span className="text-sm font-semibold tracking-tight">Art Todo</span>
      </div>

      <nav aria-label="Visões" className="flex flex-col gap-0.5 px-2 pt-2">
        {SMART_VIEWS.map(({ id, label, icon: Icon }) => {
          const isActive = id === view
          return (
            <button
              key={id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => setView(id)}
              className="flex h-8 items-center gap-2.5 rounded-md px-2.5 text-left text-sm text-foreground outline-none transition-colors hover:bg-sidebar-active focus-visible:ring-2 focus-visible:ring-focus aria-[current=page]:bg-sidebar-active aria-[current=page]:font-semibold"
            >
              <Icon
                className={isActive ? 'size-4 text-accent-text' : 'size-4 text-muted'}
                aria-hidden
              />
              {label}
            </button>
          )
        })}
      </nav>

      <section aria-labelledby="lists-heading" className="mt-6 flex flex-1 flex-col px-2">
        <div className="flex items-center justify-between px-2.5 pb-1">
          <h2
            id="lists-heading"
            className="text-xs font-semibold uppercase tracking-wide text-muted"
          >
            Listas
          </h2>
          <Button size="sm" variant="ghost" isIconOnly aria-label="Nova lista" isDisabled>
            <Plus className="size-4" aria-hidden />
          </Button>
        </div>
        <p className="px-2.5 text-sm text-muted">Nenhuma lista ainda.</p>
      </section>

      <footer className="flex items-center justify-between border-t border-separator px-3 py-2.5">
        <span className="text-xs text-muted">Tema</span>
        <ThemeSwitcher />
      </footer>
    </aside>
  )
}
