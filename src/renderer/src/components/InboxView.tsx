import type { List, Task } from '../../../shared/domain'
import { newestDoneFirst, splitDone } from '../../../shared/ordering'
import { useAllTasks } from '../hooks/queries'
import { useOrderedLists } from '../hooks/useNavigation'
import { useViewMode } from '../hooks/useViewMode'
import { useUiStore } from '../stores/ui'
import { ContentHeader } from './ContentHeader'
import { ExportButton, ExportDialog } from './ExportDialog'
import { QuickAdd } from './QuickAdd'
import { TaskBoard } from './TaskBoard'
import { TaskContextMenu } from './TaskContextMenu'
import { TaskEditorModal } from './TaskEditorModal'
import { TaskGrid } from './TaskGrid'
import type { TaskRowOptions } from './TaskRow'
import { EmptyTasks, TaskSection } from './TaskSection'
import { ViewModeSwitcher } from './ViewModeSwitcher'

interface ListSection {
  list: List
  tasks: Task[]
}

/**
 * The Inbox shows every list's tasks: one section per list (the Inbox first, then sidebar
 * order), and a single "Concluídas" section. New tasks still go to the Inbox itself.
 */
export function InboxView({ inbox }: { inbox: List }): React.JSX.Element {
  const { data: tasks = [], isSuccess } = useAllTasks()
  const { userLists } = useOrderedLists()
  const recentlyDone = useUiStore((state) => state.recentlyDone)
  const [mode, setMode] = useViewMode({ list: inbox })
  const layout = mode === 'cards' ? 'cards' : 'list'

  const lists = [inbox, ...userLists]
  const listNames = new Map(lists.map((list) => [list.id, list.name]))
  const listIndex = new Map(lists.map((list, index) => [list.id, index]))
  // Tasks arrive in position order inside each list, so filtering keeps the manual order.
  const sectionsOf = (open: Task[]): ListSection[] =>
    lists
      .map((list) => ({ list, tasks: open.filter((task) => task.listId === list.id) }))
      .filter((section) => section.tasks.length > 0)
  const { active, done } = splitDone(tasks, recentlyDone)
  const sections = sectionsOf(active)
  // Columns mix lists: sidebar order first, then each list's manual order.
  const byListThenPosition = (a: Task, b: Task): number =>
    (listIndex.get(a.listId) ?? 0) - (listIndex.get(b.listId) ?? 0) || a.position - b.position
  const withListName = (task: Task): TaskRowOptions => ({ listName: listNames.get(task.listId) })

  return (
    <>
      <ContentHeader
        title={inbox.name}
        actions={
          <>
            <ExportButton />
            <ViewModeSwitcher value={mode} onChange={setMode} />
          </>
        }
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-10 sm:px-6">
        <div
          // Sections form one J/K sequence; board columns keep their own.
          data-task-scope={mode === 'columns' ? undefined : ''}
          className={`mx-auto flex w-full flex-col gap-1 ${
            mode === 'list' ? 'max-w-2xl' : 'max-w-6xl'
          } ${mode === 'columns' ? 'min-h-0 flex-1' : ''}`}
        >
          {mode === 'columns' ? (
            <TaskBoard
              tasks={tasks}
              compare={byListThenPosition}
              rowOptions={withListName}
              newTaskDefaults={{ listId: inbox.id }}
            />
          ) : (
            <>
              <QuickAdd defaults={{ listId: inbox.id }} />

              {sections.map(({ list, tasks: sectionTasks }) => (
                <TaskSection
                  key={list.id}
                  label={list.name}
                  count={sectionTasks.length}
                  className="mt-3"
                >
                  <TaskGrid label={list.name} tasks={sectionTasks} layout={layout} isReorderable />
                </TaskSection>
              ))}

              {tasks.length === 0 && <EmptyTasks />}

              {done.length > 0 && (
                <TaskSection label="Concluídas" count={done.length} className="mt-4">
                  <TaskGrid
                    label="Concluídas"
                    tasks={done}
                    layout={layout}
                    rowOptions={withListName}
                  />
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
          title: inbox.name,
          mode,
          groups: sectionsOf(tasks.filter((task) => task.status !== 'done')).map((section) => ({
            heading: section.list.name,
            tasks: section.tasks
          })),
          done: tasks.filter((task) => task.status === 'done').sort(newestDoneFirst)
        }}
      />
    </>
  )
}
