import { Button } from '@heroui/react'
import type { Task } from '../../../shared/domain'
import { useTaskActions } from '../hooks/useTaskActions'
import { useUiStore } from '../stores/ui'

/** "Desfazer" shown while a just-completed task lingers. */
export function UndoDoneButton({ task }: { task: Task }): React.JSX.Element | null {
  const isRecentlyDone = useUiStore((state) => state.recentlyDone.has(task.id))
  const { undoDone } = useTaskActions()
  if (!isRecentlyDone) return null
  return (
    <Button size="sm" variant="ghost" onPress={() => undoDone(task)}>
      Desfazer
    </Button>
  )
}
