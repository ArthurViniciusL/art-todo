import { useState } from 'react'

interface InlineNameInputProps {
  label: string
  initialValue?: string
  placeholder?: string
  onSubmit: (value: string) => void
  onCancel: () => void
  /** Blur with an empty value cancels instead of submitting (Enter still submits). */
  cancelEmptyOnBlur?: boolean
  className?: string
}

/** Text input that saves on Enter or blur and cancels on Escape. */
export function InlineNameInput({
  label,
  initialValue = '',
  placeholder,
  onSubmit,
  onCancel,
  cancelEmptyOnBlur = false,
  className = ''
}: InlineNameInputProps): React.JSX.Element {
  const [value, setValue] = useState(initialValue)
  const [isDone, setIsDone] = useState(false)

  const finish = (save: boolean): void => {
    if (isDone) return
    setIsDone(true)
    if (save) onSubmit(value)
    else onCancel()
  }

  return (
    <input
      aria-label={label}
      autoFocus
      value={value}
      placeholder={placeholder}
      onChange={(event) => setValue(event.target.value)}
      onFocus={(event) => event.target.select()}
      onBlur={() => finish(!(cancelEmptyOnBlur && !value.trim()))}
      onKeyDown={(event) => {
        event.stopPropagation()
        if (event.key === 'Enter') finish(true)
        if (event.key === 'Escape') finish(false)
      }}
      className={`h-8 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-focus ${className}`}
    />
  )
}
