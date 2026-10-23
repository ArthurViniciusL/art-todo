import { CircleCheck } from 'lucide-react'
import { ContentHeader } from './components/ContentHeader'
import { Sidebar } from './components/Sidebar'
import { useTheme } from './hooks/useTheme'
import { useUiStore } from './stores/ui'
import { SMART_VIEWS } from './views'

function App(): React.JSX.Element {
  useTheme()
  const view = useUiStore((state) => state.view)
  const title = SMART_VIEWS.find((item) => item.id === view)?.label ?? ''

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <ContentHeader title={title} />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <CircleCheck className="size-10 text-accent-text" strokeWidth={1.5} aria-hidden />
          <p className="text-base font-semibold">Nada por aqui ainda</p>
          <p className="max-w-xs text-sm text-muted">As tarefas desta visão aparecem aqui.</p>
        </div>
      </main>
    </div>
  )
}

export default App
