import { Toast } from '@heroui/react'
import { Sparkles } from 'lucide-react'
import { ContentHeader } from './components/ContentHeader'
import { Sidebar } from './components/Sidebar'
import { TaskEditorModal } from './components/TaskEditorModal'
import { TaskListView } from './components/TaskListView'
import { useLists } from './hooks/queries'
import { useTheme } from './hooks/useTheme'
import { useUiStore } from './stores/ui'
import { SMART_VIEWS } from './views'

function SmartViewPlaceholder({ title }: { title: string }): React.JSX.Element {
  return (
    <>
      <ContentHeader title={title} />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <Sparkles className="size-10 text-accent-text" strokeWidth={1.5} aria-hidden />
        <p className="text-base font-semibold">Em breve</p>
        <p className="max-w-xs text-sm text-muted">
          Esta visão chega quando as tarefas tiverem datas.
        </p>
      </div>
    </>
  )
}

function App(): React.JSX.Element {
  useTheme()
  const selection = useUiStore((state) => state.selection)
  const { data: lists = [] } = useLists()

  const list =
    selection?.kind === 'view'
      ? undefined
      : lists.find((item) => (selection ? item.id === selection.listId : item.isInbox))
  const view =
    selection?.kind === 'view' ? SMART_VIEWS.find((item) => item.id === selection.view) : undefined

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        {list && <TaskListView key={list.id} list={list} />}
        {view && <SmartViewPlaceholder title={view.label} />}
      </main>
      {list && <TaskEditorModal listId={list.id} />}
      <Toast.Provider placement="bottom end" />
    </div>
  )
}

export default App
