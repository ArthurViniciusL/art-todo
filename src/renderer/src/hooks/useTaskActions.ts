import { toast } from '@heroui/react'
import { useCallback } from 'react'
import type { List, NewTask, Task, TaskMove, TaskStatus } from '../../../shared/domain'
import { useUiStore } from '../stores/ui'
import { useUndoStore } from '../stores/undo'
import { nextStatus } from '../task-status'
import { useCreateTask, useMoveTask, useRemoveTask, useRestoreTask, useUpdateTask } from './queries'

/** How long a task stays in place, struck through, after it is marked done. */
export const DONE_LINGER_MS = 3000
const UNDO_TOAST_MS = 5000

const doneTimers = new Map<number, ReturnType<typeof setTimeout>>()

function showUndoToast(title: string, description: string, undo: () => void): void {
  const key = toast(title, {
    description,
    timeout: UNDO_TOAST_MS,
    actionProps: {
      children: 'Desfazer',
      onPress: () => {
        undo()
        toast.close(key)
      }
    }
  })
}

/** Task changes that can be undone with Ctrl+Z. */
export function useTaskActions(): {
  createTask: (input: NewTask) => void
  setStatus: (task: Task, status: TaskStatus) => void
  cycleStatus: (task: Task) => void
  undoDone: (task: Task) => void
  moveTask: (task: Task, target: TaskMove) => void
  moveToList: (task: Task, list: List) => void
  removeTask: (task: Task) => void
} {
  const { mutate: create } = useCreateTask()
  const { mutate: update } = useUpdateTask()
  const { mutate: move } = useMoveTask()
  const { mutate: remove, mutateAsync: removeAsync } = useRemoveTask()
  const { mutate: restore } = useRestoreTask()
  const setRecentlyDone = useUiStore((state) => state.setRecentlyDone)
  const pushUndo = useUndoStore((state) => state.push)

  const clearLinger = useCallback(
    (id: number) => {
      clearTimeout(doneTimers.get(id))
      doneTimers.delete(id)
      setRecentlyDone(id, false)
    },
    [setRecentlyDone]
  )

  const createTask = useCallback(
    (input: NewTask) => {
      create(input, {
        onSuccess: (created) => {
          if (created) pushUndo('Criar tarefa', () => remove(created.id))
        }
      })
    },
    [create, pushUndo, remove]
  )

  const setStatus = useCallback(
    (task: Task, status: TaskStatus, linger = true) => {
      if (status === task.status) return
      clearLinger(task.id)
      if (status === 'done' && linger) {
        setRecentlyDone(task.id, true)
        doneTimers.set(
          task.id,
          setTimeout(() => clearLinger(task.id), DONE_LINGER_MS)
        )
      }
      update({ id: task.id, patch: { status } })
      pushUndo('Alterar status', () => {
        clearLinger(task.id)
        update({ id: task.id, patch: { status: task.status } })
      })
    },
    [clearLinger, pushUndo, setRecentlyDone, update]
  )

  const undoDone = useCallback(
    (task: Task) => {
      clearLinger(task.id)
      update({ id: task.id, patch: { status: 'todo' } })
    },
    [clearLinger, update]
  )

  const moveTask = useCallback(
    (task: Task, target: TaskMove) => {
      move({ id: task.id, target })
      pushUndo('Mover tarefa', () =>
        move({ id: task.id, target: { position: task.position, status: task.status } })
      )
    },
    [move, pushUndo]
  )

  const moveToList = useCallback(
    (task: Task, list: List) => {
      if (list.id === task.listId) return
      move({ id: task.id, target: { listId: list.id } })
      const undo = pushUndo('Mover para lista', () =>
        move({ id: task.id, target: { listId: task.listId, position: task.position } })
      )
      showUndoToast(`Movida para ${list.name}`, task.title, undo)
    },
    [move, pushUndo]
  )

  const removeTask = useCallback(
    (task: Task) => {
      clearLinger(task.id)
      // A promise, not mutate's onSuccess: the caller may unmount first (the task menu does).
      void removeAsync(task.id).then(
        (removed) => {
          if (!removed) return
          const undo = pushUndo('Excluir tarefa', () => restore(removed))
          showUndoToast('Tarefa excluída', removed.title, undo)
        },
        () => {}
      )
    },
    [clearLinger, pushUndo, removeAsync, restore]
  )

  return {
    createTask,
    setStatus,
    cycleStatus: (task) => setStatus(task, nextStatus(task.status)),
    undoDone,
    moveTask,
    moveToList,
    removeTask
  }
}
