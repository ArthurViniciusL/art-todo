/** sRGB color helpers for contrast-safe theme tokens (WCAG 2.x relative luminance). */

export type Rgb = [number, number, number]

const HEX_RE = /^#([0-9a-f]{6})$/i

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_RE.test(value)
}

export function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

export function rgbToHex([r, g, b]: Rgb): string {
  const part = (channel: number): string =>
    Math.round(Math.min(255, Math.max(0, channel)))
      .toString(16)
      .padStart(2, '0')
  return `#${part(r)}${part(g)}${part(b)}`
}

/** Converts OKLCH (as HeroUI writes its theme) to sRGB hex, clipping out-of-gamut values. */
export function oklchToHex(lightness: number, chroma: number, hueDegrees: number): string {
  const hue = (hueDegrees * Math.PI) / 180
  const a = chroma * Math.cos(hue)
  const b = chroma * Math.sin(hue)
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ]
  const gamma = (x: number): number => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055)
  return rgbToHex(linear.map((x) => gamma(Math.min(1, Math.max(0, x))) * 255) as Rgb)
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

/** Mixes `hex` toward `target` by `amount` (0–1). */
export function mix(hex: string, target: string, amount: number): string {
  const from = hexToRgb(hex)
  const to = hexToRgb(target)
  return rgbToHex(from.map((channel, i) => channel + (to[i] - channel) * amount) as Rgb)
}

/**
 * The closest shade of `hex` with at least `min` contrast on `background`: darker on light
 * backgrounds, lighter on dark ones. Returns `hex` unchanged when it already passes.
 */
export function ensureContrast(hex: string, background: string, min: number): string {
  const target = luminance(background) > 0.18 ? '#000000' : '#ffffff'
  for (let amount = 0; amount <= 1; amount += 0.02) {
    const candidate = mix(hex, target, amount)
    if (contrast(candidate, background) >= min) return candidate
  }
  return target
}

/** Dark or light text, whichever reads better on `hex`. */
export function readableOn(hex: string): string {
  return contrast('#1a1a1a', hex) >= contrast('#ffffff', hex) ? '#1a1a1a' : '#ffffff'
}
