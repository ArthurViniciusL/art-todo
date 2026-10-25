import { Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { NewTask } from '../../../shared/domain'
import { useTaskActions } from '../hooks/useTaskActions'
import { useUiStore } from '../stores/ui'

interface QuickAddProps {
  /** Fields every new task gets, at least the target list. */
  defaults: Omit<NewTask, 'title'>
}

export function QuickAdd({ defaults }: QuickAddProps): React.JSX.Element {
  const [title, setTitle] = useState('')
  const { createTask } = useTaskActions()
  const focusRequest = useUiStore((state) => state.quickAddFocusRequest)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus on request (shortcut N), but not on first mount.
  const initialRequest = useRef(focusRequest)
  useEffect(() => {
    if (focusRequest !== initialRequest.current) inputRef.current?.focus()
  }, [focusRequest])

  return (
    <form
      className="flex h-10 items-center gap-2 rounded-md px-2.5 focus-within:bg-surface focus-within:ring-1 focus-within:ring-border"
      onSubmit={(event) => {
        event.preventDefault()
        if (!title.trim()) return
        createTask({ ...defaults, title })
        setTitle('')
      }}
    >
      <Plus className="size-4 text-muted" aria-hidden />
      <input
        ref={inputRef}
        aria-label="Nova tarefa"
        placeholder="Nova tarefa"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => event.key === 'Escape' && setTitle('')}
        className="h-full flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
      />
    </form>
  )
}
