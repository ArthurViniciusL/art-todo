import { toast } from '@heroui/react'
import { useCallback } from 'react'
import type { Task, TaskStatus } from '../../../shared/domain'
import { useUiStore } from '../stores/ui'
import { nextStatus } from '../task-status'
import { useRemoveTask, useRestoreTask, useUpdateTask } from './queries'

/** How long a task stays in place, struck through, after it is marked done. */
export const DONE_LINGER_MS = 3000
const UNDO_TOAST_MS = 5000

const doneTimers = new Map<number, ReturnType<typeof setTimeout>>()

export function useTaskActions(): {
  setStatus: (task: Task, status: TaskStatus) => void
  cycleStatus: (task: Task) => void
  undoDone: (task: Task) => void
  removeTask: (task: Task) => void
} {
  const { mutate: update } = useUpdateTask()
  const { mutate: remove } = useRemoveTask()
  const { mutate: restore } = useRestoreTask()
  const setRecentlyDone = useUiStore((state) => state.setRecentlyDone)

  const clearLinger = useCallback(
    (id: number) => {
      clearTimeout(doneTimers.get(id))
      doneTimers.delete(id)
      setRecentlyDone(id, false)
    },
    [setRecentlyDone]
  )

  const setStatus = useCallback(
    (task: Task, status: TaskStatus) => {
      if (status === task.status) return
      clearLinger(task.id)
      if (status === 'done') {
        setRecentlyDone(task.id, true)
        doneTimers.set(
          task.id,
          setTimeout(() => clearLinger(task.id), DONE_LINGER_MS)
        )
      }
      update({ id: task.id, patch: { status } })
    },
    [clearLinger, setRecentlyDone, update]
  )

  const undoDone = useCallback(
    (task: Task) => {
      clearLinger(task.id)
      update({ id: task.id, patch: { status: 'todo' } })
    },
    [clearLinger, update]
  )

  const removeTask = useCallback(
    (task: Task) => {
      clearLinger(task.id)
      remove(task.id, {
        onSuccess: (removed) => {
          if (!removed) return
          const key = toast('Tarefa excluída', {
            description: removed.title,
            timeout: UNDO_TOAST_MS,
            actionProps: {
              children: 'Desfazer',
              onPress: () => {
                restore(removed)
                toast.close(key)
              }
            }
          })
        }
      })
    },
    [clearLinger, remove, restore]
  )

  return {
    setStatus,
    cycleStatus: (task) => setStatus(task, nextStatus(task.status)),
    undoDone,
    removeTask
  }
}
