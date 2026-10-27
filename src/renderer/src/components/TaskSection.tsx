import { Disclosure } from '@heroui/react'
import { CircleCheck } from 'lucide-react'
import type { ReactNode } from 'react'

/** A collapsible group of tasks with a "Label · count" heading, open by default. */
export function TaskSection({
  label,
  count,
  className,
  children
}: {
  label: string
  count: number
  className?: string
  children: ReactNode
}): React.JSX.Element {
  return (
    <Disclosure className={className} defaultExpanded>
      <Disclosure.Heading>
        <Disclosure.Trigger className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold uppercase tracking-wide text-muted outline-none focus-visible:ring-2 focus-visible:ring-focus">
          <Disclosure.Indicator />
          {label} · {count}
        </Disclosure.Trigger>
      </Disclosure.Heading>
      <Disclosure.Content>{children}</Disclosure.Content>
    </Disclosure>
  )
}

export function EmptyTasks(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <CircleCheck className="size-10 text-accent-text" strokeWidth={1.5} aria-hidden />
      <p className="text-base font-semibold">Nada por aqui ainda</p>
      <p className="max-w-xs text-sm text-muted">
        Escreva acima e pressione Enter para criar uma tarefa.
      </p>
    </div>
  )
}
