import { ensureContrast, oklchToHex, readableOn } from './color'

/** HeroUI's default accent, the app default until the user picks another color. */
export const DEFAULT_ACCENT = oklchToHex(0.6204, 0.195, 253.83)

/** Swatches offered by the accent picker. */
export const ACCENT_PRESETS: { hex: string; label: string }[] = [
  { hex: DEFAULT_ACCENT, label: 'Azul HeroUI' },
  { hex: '#ffca39', label: 'Amarelo' },
  { hex: '#17c964', label: 'Verde' },
  { hex: '#7828c8', label: 'Violeta' },
  { hex: '#ff6b4a', label: 'Coral' },
  { hex: '#000000', label: 'Preto' }
]

// Must match --background in src/renderer/src/assets/main.css.
const BACKGROUND = { light: '#fafaf9', dark: '#161616' }

// HeroUI status colors (danger / warning / success), per theme.
const STATUS_BASE = {
  light: {
    todo: oklchToHex(0.6532, 0.2328, 25.74),
    doing: oklchToHex(0.7819, 0.1585, 72.33),
    done: oklchToHex(0.7329, 0.1935, 150.81)
  },
  dark: {
    todo: oklchToHex(0.594, 0.1967, 24.63),
    doing: oklchToHex(0.8203, 0.1388, 76.34),
    done: oklchToHex(0.7329, 0.1935, 150.81)
  }
}

/** Text and thin icons need 4.5:1; large fills only need to stand out from the page. */
const TEXT_CONTRAST = 4.5
const FILL_CONTRAST = 1.3
const FILL_FALLBACK_CONTRAST = 3

/** CSS custom properties for the chosen accent and the status colors in one theme. */
export function themeTokens(accent: string, isDark: boolean): Record<string, string> {
  const mode = isDark ? 'dark' : 'light'
  const background = BACKGROUND[mode]
  const status = STATUS_BASE[mode]
  // A fill that almost matches the page (black on dark, white on light) gets shaded.
  const fill =
    ensureContrast(accent, background, FILL_CONTRAST) === accent
      ? accent
      : ensureContrast(accent, background, FILL_FALLBACK_CONTRAST)
  const accentText = ensureContrast(accent, background, TEXT_CONTRAST)

  return {
    '--accent': fill,
    '--accent-foreground': readableOn(fill),
    '--accent-text': accentText,
    '--accent-soft-foreground': accentText,
    '--status-todo': ensureContrast(status.todo, background, TEXT_CONTRAST),
    '--status-doing': ensureContrast(status.doing, background, TEXT_CONTRAST),
    '--status-done': ensureContrast(status.done, background, TEXT_CONTRAST),
    '--status-done-fill': status.done,
    '--status-done-foreground': readableOn(status.done)
  }
}
