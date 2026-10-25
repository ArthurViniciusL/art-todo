import { Toast } from '@heroui/react'
import { Sidebar } from './components/Sidebar'
import { SmartTaskView } from './components/SmartTaskView'
import { TaskListView } from './components/TaskListView'
import { useLists } from './hooks/queries'
import { useTheme } from './hooks/useTheme'
import { useUiStore } from './stores/ui'

function App(): React.JSX.Element {
  useTheme()
  const selection = useUiStore((state) => state.selection)
  const { data: lists = [] } = useLists()

  const list =
    selection?.kind === 'view'
      ? undefined
      : lists.find((item) => (selection ? item.id === selection.listId : item.isInbox))

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        {list && <TaskListView key={list.id} list={list} />}
        {selection?.kind === 'view' && <SmartTaskView key={selection.view} view={selection.view} />}
      </main>
      <Toast.Provider placement="bottom end" />
    </div>
  )
}

export default App
