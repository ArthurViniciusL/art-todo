import { ToggleButton, ToggleButtonGroup, Tooltip } from '@heroui/react'
import { VIEW_MODES, type ViewMode } from '../../../shared/domain'
import { VIEW_MODE_META } from '../view-modes'

interface ViewModeSwitcherProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
}

export function ViewModeSwitcher({ value, onChange }: ViewModeSwitcherProps): React.JSX.Element {
  return (
    <ToggleButtonGroup
      aria-label="Modo de visualização"
      size="sm"
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[value]}
      onSelectionChange={(keys) => {
        const [key] = keys
        if (key) onChange(key as ViewMode)
      }}
      className="app-no-drag"
    >
      {VIEW_MODES.map((mode) => {
        const { label, icon: Icon, shortcut } = VIEW_MODE_META[mode]
        return (
          <Tooltip key={mode} delay={400}>
            <ToggleButton id={mode} aria-label={label} isIconOnly>
              <Icon className="size-4" aria-hidden />
            </ToggleButton>
            <Tooltip.Content>
              {label} · {shortcut}
            </Tooltip.Content>
          </Tooltip>
        )
      })}
    </ToggleButtonGroup>
  )
}
