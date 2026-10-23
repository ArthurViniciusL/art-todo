import { ToggleButton, ToggleButtonGroup, Tooltip } from '@heroui/react'
import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { isThemePreference, type ThemePreference } from '../../../shared/theme'
import { useUiStore } from '../stores/ui'

const OPTIONS: { id: ThemePreference; label: string; icon: LucideIcon }[] = [
  { id: 'system', label: 'Sistema', icon: Monitor },
  { id: 'light', label: 'Claro', icon: Sun },
  { id: 'dark', label: 'Escuro', icon: Moon }
]

export function ThemeSwitcher(): React.JSX.Element {
  const theme = useUiStore((state) => state.theme)
  const setTheme = useUiStore((state) => state.setTheme)

  return (
    <ToggleButtonGroup
      aria-label="Tema"
      size="sm"
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[theme]}
      onSelectionChange={(keys) => {
        const [key] = keys
        if (isThemePreference(key)) setTheme(key)
      }}
    >
      {OPTIONS.map(({ id, label, icon: Icon }) => (
        <Tooltip key={id} delay={400}>
          <ToggleButton id={id} aria-label={label} isIconOnly>
            <Icon className="size-4" aria-hidden />
          </ToggleButton>
          <Tooltip.Content>{label}</Tooltip.Content>
        </Tooltip>
      ))}
    </ToggleButtonGroup>
  )
}
