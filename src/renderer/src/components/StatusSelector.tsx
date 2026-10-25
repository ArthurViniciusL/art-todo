import { Button, Dropdown, Tooltip } from '@heroui/react'
import { TASK_STATUSES, type TaskStatus } from '../../../shared/domain'
import { STATUS_META } from '../task-status'

interface StatusSelectorProps {
  status: TaskStatus
  taskTitle: string
  onChange: (status: TaskStatus) => void
  /** Show the status name next to the icon, as a label (cards). */
  showLabel?: boolean
}

export function StatusSelector({
  status,
  taskTitle,
  onChange,
  showLabel = false
}: StatusSelectorProps): React.JSX.Element {
  const { label, icon: Icon, className } = STATUS_META[status]

  return (
    <Dropdown>
      <Tooltip delay={400}>
        <Button
          size="sm"
          variant="ghost"
          isIconOnly={!showLabel}
          aria-label={`Status: ${label}. Alterar status de ${taskTitle}`}
          data-status={status}
          className={
            showLabel
              ? 'h-6 min-w-0 gap-1.5 rounded-full bg-default px-2 text-xs font-medium text-foreground'
              : 'size-7 min-w-7'
          }
        >
          <Icon
            className={`${showLabel ? 'size-3.5' : 'size-[18px]'} ${className} ${
              status === 'done' ? 'animate-status-pop' : ''
            }`}
            aria-hidden
          />
          {showLabel && <span aria-hidden>{label}</span>}
        </Button>
        <Tooltip.Content>
          {label} — clique para alterar · <kbd className="font-sans">S</kbd>
        </Tooltip.Content>
      </Tooltip>
      <Dropdown.Popover placement="bottom start">
        <Dropdown.Menu
          aria-label="Status"
          selectionMode="single"
          selectedKeys={[status]}
          onAction={(key) => onChange(key as TaskStatus)}
        >
          {TASK_STATUSES.map((option) => {
            const meta = STATUS_META[option]
            return (
              <Dropdown.Item key={option} id={option} textValue={meta.label}>
                <meta.icon className={`size-4 ${meta.className}`} aria-hidden />
                {meta.label}
              </Dropdown.Item>
            )
          })}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
