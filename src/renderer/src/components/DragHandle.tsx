import { GripVertical } from 'lucide-react'
import { Button } from 'react-aria-components'

/**
 * React Aria drag handle. Keyboard and screen reader users start a drag from here
 * (Enter, then arrow keys to pick the drop position, Enter to drop).
 */
export function DragHandle({ taskTitle }: { taskTitle: string }): React.JSX.Element {
  return (
    <Button
      slot="drag"
      aria-label={`Arrastar ${taskTitle}`}
      className="flex size-5 shrink-0 cursor-grab items-center justify-center rounded text-muted opacity-0 outline-none transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-focus"
    >
      <GripVertical className="size-4" aria-hidden />
    </Button>
  )
}
