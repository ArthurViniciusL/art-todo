import { Disclosure } from '@heroui/react'
import { CircleCheck } from 'lucide-react'
import type { List, Task } from '../../../shared/domain'
import { useTasksByList } from '../hooks/queries'
import { useViewMode } from '../hooks/useViewMode'
import { useUiStore } from '../stores/ui'
import { ContentHeader } from './ContentHeader'
import { ExportButton, ExportDialog } from './ExportDialog'
import { QuickAdd } from './QuickAdd'
import { TaskBoard } from './TaskBoard'
import { TaskEditorModal } from './TaskEditorModal'
import { TaskGrid } from './TaskGrid'
import { ViewModeSwitcher } from './ViewModeSwitcher'

const byPosition = (a: Task, b: Task): number => a.position - b.position

export function TaskListView({ list }: { list: List }): React.JSX.Element {
  const { data: tasks = [], isSuccess } = useTasksByList(list.id)
  const recentlyDone = useUiStore((state) => state.recentlyDone)
  const [mode, setMode] = useViewMode({ list })

  const active = tasks.filter((task) => task.status !== 'done' || recentlyDone.has(task.id))
  const done = tasks
    .filter((task) => task.status === 'done' && !recentlyDone.has(task.id))
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
  const layout = mode === 'cards' ? 'cards' : 'list'

  return (
    <>
      <ContentHeader
        title={list.name}
        actions={
          <>
            <ExportButton />
            <ViewModeSwitcher value={mode} onChange={setMode} />
          </>
        }
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-10 sm:px-6">
        <div
          className={`mx-auto flex w-full flex-col gap-1 ${
            mode === 'list' ? 'max-w-2xl' : 'max-w-6xl'
          } ${mode === 'columns' ? 'min-h-0 flex-1' : ''}`}
        >
          <QuickAdd defaults={{ listId: list.id }} />

          {mode === 'columns' ? (
            <TaskBoard tasks={tasks} compare={byPosition} isReorderable />
          ) : (
            <>
              <TaskGrid label="Tarefas" tasks={active} layout={layout} isReorderable />

              {tasks.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-24 text-center">
                  <CircleCheck className="size-10 text-accent-text" strokeWidth={1.5} aria-hidden />
                  <p className="text-base font-semibold">Nada por aqui ainda</p>
                  <p className="max-w-xs text-sm text-muted">
                    Escreva acima e pressione Enter para criar uma tarefa.
                  </p>
                </div>
              )}

              {done.length > 0 && (
                <Disclosure className="mt-4" defaultExpanded>
                  <Disclosure.Heading>
                    <Disclosure.Trigger className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold uppercase tracking-wide text-muted outline-none focus-visible:ring-2 focus-visible:ring-focus">
                      <Disclosure.Indicator />
                      Concluídas · {done.length}
                    </Disclosure.Trigger>
                  </Disclosure.Heading>
                  <Disclosure.Content>
                    <TaskGrid label="Concluídas" tasks={done} layout={layout} />
                  </Disclosure.Content>
                </Disclosure>
              )}
            </>
          )}
        </div>
      </div>
      <TaskEditorModal tasks={tasks} isLoaded={isSuccess} />
      <ExportDialog
        source={{
          title: list.name,
          mode,
          groups: [{ tasks: tasks.filter((task) => task.status !== 'done') }],
          done: tasks
            .filter((task) => task.status === 'done')
            .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
        }}
      />
    </>
  )
}
