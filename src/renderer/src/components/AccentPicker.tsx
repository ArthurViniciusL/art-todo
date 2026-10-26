import { Button, ColorField, ColorSwatchPicker, Label, Popover, Tooltip } from '@heroui/react'
import { parseColor, type Color } from 'react-aria-components'
import { useState } from 'react'
import { ACCENT_PRESETS, DEFAULT_ACCENT } from '../../../shared/palette'
import { useAccent, useSetAccent } from '../hooks/queries'

const toHex = (color: Color): string => color.toString('hex').toLowerCase()

/** Accent color: preset swatches plus a free #rrggbb field. Saved in the settings table. */
export function AccentPicker(): React.JSX.Element {
  const { data: stored } = useAccent()
  const { mutate: setAccent } = useSetAccent()
  const accent = stored ?? DEFAULT_ACCENT
  // The field keeps its own draft so partial input does not repaint the app on every key.
  const [draft, setDraft] = useState<Color | null>(null)

  const apply = (color: Color | null): void => {
    if (!color) return
    const hex = toHex(color)
    setAccent(hex === DEFAULT_ACCENT ? null : hex)
  }

  return (
    <Popover onOpenChange={() => setDraft(null)}>
      <Tooltip delay={400}>
        <Button size="sm" variant="ghost" isIconOnly aria-label="Cor de destaque">
          <span
            aria-hidden
            className="size-4 rounded-full border border-border"
            style={{ background: 'var(--accent)' }}
          />
        </Button>
        <Tooltip.Content>Cor de destaque</Tooltip.Content>
      </Tooltip>
      <Popover.Content placement="top start" className="w-64">
        <Popover.Dialog aria-label="Cor de destaque" className="flex flex-col gap-3 p-3">
          <span className="text-sm font-medium">Cor de destaque</span>
          <ColorSwatchPicker
            aria-label="Cores prontas"
            value={parseColor(accent)}
            onChange={apply}
            className="flex flex-wrap gap-2"
          >
            {ACCENT_PRESETS.map((preset) => (
              <ColorSwatchPicker.Item key={preset.hex} color={preset.hex} aria-label={preset.label}>
                <ColorSwatchPicker.Swatch />
              </ColorSwatchPicker.Item>
            ))}
          </ColorSwatchPicker>
          <ColorField
            value={draft ?? parseColor(accent)}
            onChange={(color) => {
              setDraft(color)
              apply(color)
            }}
          >
            <Label>Hex</Label>
            <ColorField.Group>
              <ColorField.Input />
            </ColorField.Group>
          </ColorField>
          <Button
            size="sm"
            variant="tertiary"
            isDisabled={stored === null}
            onPress={() => {
              setDraft(null)
              setAccent(null)
            }}
          >
            Restaurar padrão
          </Button>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  )
}
