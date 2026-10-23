import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useCreateTask } from '../hooks/queries'

export function QuickAdd({ listId }: { listId: number }): React.JSX.Element {
  const [title, setTitle] = useState('')
  const { mutate: createTask } = useCreateTask()

  return (
    <form
      className="flex h-10 items-center gap-2 rounded-md px-2.5 focus-within:bg-surface focus-within:ring-1 focus-within:ring-border"
      onSubmit={(event) => {
        event.preventDefault()
        if (!title.trim()) return
        createTask({ listId, title })
        setTitle('')
      }}
    >
      <Plus className="size-4 text-muted" aria-hidden />
      <input
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
