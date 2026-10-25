import { Sun, CalendarDays } from 'lucide-react'
import {
  compareByTimeAndPriority,
  groupToday,
  groupUpcoming,
  type TaskGroup
} from '../../../shared/dates'
import type { Task } from '../../../shared/domain'
import { useDueTasks, useLists } from '../hooks/queries'
import { useToday } from '../hooks/useToday'
import { useViewMode } from '../hooks/useViewMode'
import { dayHeading } from '../lib/format-date'
import { useUiStore, type SmartView } from '../stores/ui'
import { ContentHeader } from './ContentHeader'
import { QuickAdd } from './QuickAdd'
import { TaskEditorModal } from './TaskEditorModal'
import { TaskBoard } from './TaskBoard'
import { TaskGrid } from './TaskGrid'
import { ViewModeSwitcher } from './ViewModeSwitcher'

// Upcoming has no end date; this sorts after any real ISO date.
const FAR_FUTURE = '9999-12-31'

const VIEW_COPY: Record<SmartView, { title: string; empty: string; icon: typeof Sun }> = {
  today: { title: 'Hoje', empty: 'Nenhuma tarefa para hoje.', icon: Sun },
  upcoming: {
    title: 'Próximos',
    empty: 'Nenhuma tarefa com data nos próximos dias.',
    icon: CalendarDays
  }
}

/** Columns drop the day groups, so order by date first. */
function compareByDate(a: Task, b: Task): number {
  if (a.dueDate !== b.dueDate) return (a.dueDate ?? '') < (b.dueDate ?? '') ? -1 : 1
  return compareByTimeAndPriority(a, b)
}

function groupHeading(group: TaskGroup, today: string): string {
  if (group.id === 'overdue') return 'Atrasadas'
  if (group.id === 'later') return 'Depois'
  if (group.date === today) return 'Hoje'
  return dayHeading(group.date ?? today, today)
}

export function SmartTaskView({ view }: { view: SmartView }): React.JSX.Element {
  const { today, startOfToday } = useToday()
  const until = view === 'today' ? today : FAR_FUTURE
  const { data: tasks = [], isSuccess } = useDueTasks(until, startOfToday)
  const { data: lists = [] } = useLists()
  const recentlyDone = useUiStore((state) => state.recentlyDone)
  const inbox = lists.find((list) => list.isInbox)
  const listNames = new Map(lists.map((list) => [list.id, list.name]))
  const copy = VIEW_COPY[view]
  const [mode, setMode] = useViewMode({ view })

  // Done tasks only linger for a moment; smart views show open work.
  const visible = tasks.filter((task) => task.status !== 'done' || recentlyDone.has(task.id))
  const groups = view === 'today' ? groupToday(visible, today) : groupUpcoming(visible, today)
  const rowOptions = (group?: TaskGroup) => (task: Task) => ({
    listName: listNames.get(task.listId),
    timeOnly: group?.date != null
  })

  return (
    <>
      <ContentHeader
        title={copy.title}
        actions={<ViewModeSwitcher value={mode} onChange={setMode} />}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-10">
        <div
          className={`mx-auto flex w-full flex-col gap-1 ${
            mode === 'list' ? 'max-w-2xl' : 'max-w-6xl'
          } ${mode === 'columns' ? 'min-h-0 flex-1' : ''}`}
        >
          {view === 'today' && inbox && (
            <QuickAdd defaults={{ listId: inbox.id, dueDate: today }} />
          )}

          {mode === 'columns' && (
            <TaskBoard
              tasks={
                view === 'today' ? tasks : tasks.filter((task) => (task.dueDate ?? '') > today)
              }
              compare={compareByDate}
              rowOptions={rowOptions()}
            />
          )}

          {mode !== 'columns' &&
            groups.map((group) => (
              <section key={group.id} aria-labelledby={`group-${group.id}`} className="mt-3">
                <h2
                  id={`group-${group.id}`}
                  className={`px-2.5 pb-1 text-xs font-semibold uppercase tracking-wide ${
                    group.id === 'overdue' ? 'text-priority-high' : 'text-muted'
                  }`}
                >
                  {groupHeading(group, today)}
                </h2>
                <TaskGrid
                  label={groupHeading(group, today)}
                  tasks={group.tasks}
                  layout={mode === 'cards' ? 'cards' : 'list'}
                  rowOptions={rowOptions(group)}
                />
              </section>
            ))}

          {mode !== 'columns' && groups.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <copy.icon className="size-10 text-accent-text" strokeWidth={1.5} aria-hidden />
              <p className="text-base font-semibold">Tudo em dia</p>
              <p className="max-w-xs text-sm text-muted">{copy.empty}</p>
            </div>
          )}
        </div>
      </div>
      <TaskEditorModal tasks={tasks} isLoaded={isSuccess} />
    </>
  )
}
