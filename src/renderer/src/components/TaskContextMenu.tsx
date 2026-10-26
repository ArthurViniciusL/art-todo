import { Dropdown } from '@heroui/react'
import { FolderInput, Pencil, Trash2 } from 'lucide-react'
import { useRef } from 'react'
import type { Task } from '../../../shared/domain'
import { useLists } from '../hooks/queries'
import { useTaskActions } from '../hooks/useTaskActions'
import { focusSibling, taskRow } from '../lib/task-focus'
import { useUiStore, type TaskContextMenuState } from '../stores/ui'

/**
 * Right-click menu of a task (also Shift+F10 or the menu key on a row). The menu opens from an
 * invisible trigger placed at the pointer, so one instance serves every row of the view.
 * It mounts only while open: idle task-action hooks here made column drag and drop flaky.
 */
export function TaskContextMenu({ tasks }: { tasks: Task[] }): React.JSX.Element | null {
  const menu = useUiStore((state) => state.taskContextMenu)
  const task = tasks.find((item) => item.id === menu?.taskId)
  return task && menu ? <OpenTaskContextMenu task={task} menu={menu} /> : null
}

function OpenTaskContextMenu({
  task,
  menu
}: {
  task: Task
  menu: TaskContextMenuState
}): React.JSX.Element {
  const setMenu = useUiStore((state) => state.setTaskContextMenu)
  const openTask = useUiStore((state) => state.openTask)
  const { data: lists = [] } = useLists()
  const { moveToList, removeTask } = useTaskActions()
  // In a list, a task moved to another list leaves the view; in Hoje / Próximos it stays.
  const isSmartView = useUiStore((state) => state.selection?.kind === 'view')
  const targets = lists.filter((list) => list.id !== task.listId)
  // Set when an item ran, so the close that follows does not refocus the row again.
  const hasActed = useRef(false)

  // The menu returns focus to its hidden trigger; send it back to the task's row instead.
  const close = (then?: (row: HTMLElement | null) => void): void => {
    const row = taskRow(task.id)
    setMenu(null)
    requestAnimationFrame(() => {
      row?.focus()
      then?.(row)
    })
  }

  const act = (then: (row: HTMLElement | null) => void): void => {
    hasActed.current = true
    close(then)
  }

  // The task leaves the view: focus the next row first, as the Delete shortcut does.
  const leave = (action: () => void, leavesView = true): void =>
    act((row) => {
      if (row && leavesView) focusSibling(row, 1)
      action()
    })

  return (
    <Dropdown
      isOpen
      onOpenChange={(isOpen) => {
        if (isOpen) return
        if (!hasActed.current) close()
        hasActed.current = false
      }}
    >
      <Dropdown.Trigger
        aria-hidden
        excludeFromTabOrder
        className="pointer-events-none fixed size-0 opacity-0"
        style={{ left: menu.x, top: menu.y }}
      >
        <span />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom start" offset={2} className="min-w-48">
        <Dropdown.Menu
          aria-label={`Ações da tarefa ${task.title}`}
          autoFocus="first"
          onAction={(key) => {
            if (key === 'edit') act(() => openTask(task.id))
            if (key === 'delete') leave(() => removeTask(task))
          }}
        >
          <Dropdown.Item id="edit" textValue="Editar">
            <Pencil className="size-4 text-muted" aria-hidden />
            Editar
          </Dropdown.Item>
          <Dropdown.SubmenuTrigger>
            <Dropdown.Item id="move" textValue="Mover para lista" isDisabled={!targets.length}>
              <FolderInput className="size-4 text-muted" aria-hidden />
              Mover para lista
              <Dropdown.SubmenuIndicator />
            </Dropdown.Item>
            <Dropdown.Popover className="min-w-44">
              <Dropdown.Menu
                aria-label="Mover para lista"
                onAction={(key) => {
                  const list = targets.find((item) => String(item.id) === key)
                  if (list) leave(() => moveToList(task, list), !isSmartView)
                }}
              >
                {targets.map((list) => (
                  <Dropdown.Item key={list.id} id={String(list.id)} textValue={list.name}>
                    {list.name}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown.SubmenuTrigger>
          <Dropdown.Item id="delete" textValue="Excluir" variant="danger">
            <Trash2 className="size-4" aria-hidden />
            Excluir
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
