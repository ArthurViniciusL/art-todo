import { Disclosure } from '@heroui/react'
import { CircleCheck } from 'lucide-react'
import type { List } from '../../../shared/domain'
import { useTasksByList } from '../hooks/queries'
import { useUiStore } from '../stores/ui'
import { ContentHeader } from './ContentHeader'
import { QuickAdd } from './QuickAdd'
import { TaskEditorModal } from './TaskEditorModal'
import { TaskGrid } from './TaskGrid'

export function TaskListView({ list }: { list: List }): React.JSX.Element {
  const { data: tasks = [] } = useTasksByList(list.id)
  const recentlyDone = useUiStore((state) => state.recentlyDone)

  const active = tasks.filter((task) => task.status !== 'done' || recentlyDone.has(task.id))
  const done = tasks
    .filter((task) => task.status === 'done' && !recentlyDone.has(task.id))
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))

  return (
    <>
      <ContentHeader title={list.name} />
      <div className="flex-1 overflow-y-auto px-6 pb-10">
        <div className="mx-auto flex max-w-2xl flex-col gap-1">
          <QuickAdd defaults={{ listId: list.id }} />
          <TaskGrid label="Tarefas" tasks={active} />

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
                <TaskGrid label="Concluídas" tasks={done} />
              </Disclosure.Content>
            </Disclosure>
          )}
        </div>
      </div>
      <TaskEditorModal tasks={tasks} />
    </>
  )
}
