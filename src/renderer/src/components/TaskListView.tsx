import type { List, Task } from '../../../shared/domain'
import { newestDoneFirst, splitDone } from '../../../shared/ordering'
import { useTasksByList } from '../hooks/queries'
import { useViewMode } from '../hooks/useViewMode'
import { useUiStore } from '../stores/ui'
import { ContentHeader } from './ContentHeader'
import { ExportButton, ExportDialog } from './ExportDialog'
import { QuickAdd } from './QuickAdd'
import { TaskBoard } from './TaskBoard'
import { TaskContextMenu } from './TaskContextMenu'
import { TaskEditorModal } from './TaskEditorModal'
import { TaskGrid } from './TaskGrid'
import { EmptyTasks, TaskSection } from './TaskSection'
import { ViewModeSwitcher } from './ViewModeSwitcher'

const byPosition = (a: Task, b: Task): number => a.position - b.position

export function TaskListView({ list }: { list: List }): React.JSX.Element {
  const { data: tasks = [], isSuccess } = useTasksByList(list.id)
  const recentlyDone = useUiStore((state) => state.recentlyDone)
  const [mode, setMode] = useViewMode({ list })

  const { active, done } = splitDone(tasks, recentlyDone)
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
          {mode === 'columns' ? (
            <TaskBoard
              tasks={tasks}
              compare={byPosition}
              isReorderable
              newTaskDefaults={{ listId: list.id }}
            />
          ) : (
            <>
              <QuickAdd defaults={{ listId: list.id }} />
              <TaskGrid label="Tarefas" tasks={active} layout={layout} isReorderable />

              {tasks.length === 0 && <EmptyTasks />}

              {done.length > 0 && (
                <TaskSection label="Concluídas" count={done.length} className="mt-4">
                  <TaskGrid label="Concluídas" tasks={done} layout={layout} />
                </TaskSection>
              )}
            </>
          )}
        </div>
      </div>
      <TaskEditorModal tasks={tasks} isLoaded={isSuccess} />
      <TaskContextMenu tasks={tasks} />
      <ExportDialog
        source={{
          title: list.name,
          mode,
          groups: [{ tasks: tasks.filter((task) => task.status !== 'done') }],
          done: tasks.filter((task) => task.status === 'done').sort(newestDoneFirst)
        }}
      />
    </>
  )
}
