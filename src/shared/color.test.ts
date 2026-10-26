import { describe, expect, it } from 'vitest'
import { contrast, ensureContrast, isHexColor, mix, oklchToHex, readableOn } from './color'
import { DEFAULT_ACCENT, themeTokens } from './palette'

describe('color helpers', () => {
  it('validates #rrggbb only', () => {
    expect(isHexColor('#0485f7')).toBe(true)
    expect(isHexColor('#FFF')).toBe(false)
    expect(isHexColor('0485f7')).toBe(false)
  })

  it('converts the HeroUI default accent from OKLCH', () => {
    expect(DEFAULT_ACCENT).toBe('#0485f7')
    expect(oklchToHex(1, 0, 0)).toBe('#ffffff')
  })

  it('computes WCAG contrast', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(contrast('#777777', '#777777')).toBe(1)
  })

  it('mixes colors', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080')
  })

  it('shades a color until it reaches the contrast', () => {
    const shaded = ensureContrast('#ffca39', '#fafaf9', 4.5)
    expect(contrast(shaded, '#fafaf9')).toBeGreaterThanOrEqual(4.5)
    expect(ensureContrast('#1a1a1a', '#fafaf9', 4.5)).toBe('#1a1a1a')
    expect(contrast(ensureContrast('#000000', '#161616', 4.5), '#161616')).toBeGreaterThanOrEqual(
      4.5
    )
  })

  it('picks readable text for a fill', () => {
    expect(readableOn('#ffca39')).toBe('#1a1a1a')
    expect(readableOn('#000000')).toBe('#ffffff')
  })
})

describe('themeTokens', () => {
  const backgrounds = { light: '#fafaf9', dark: '#161616' }

  for (const isDark of [false, true]) {
    const background = isDark ? backgrounds.dark : backgrounds.light
    for (const accent of ['#0485f7', '#ffca39', '#000000', '#ffffff']) {
      it(`keeps text tokens readable for ${accent} in ${isDark ? 'dark' : 'light'}`, () => {
        const tokens = themeTokens(accent, isDark)
        for (const key of ['--accent-text', '--status-todo', '--status-doing', '--status-done']) {
          expect(contrast(tokens[key], background)).toBeGreaterThanOrEqual(4.5)
        }
        expect(contrast(tokens['--accent-foreground'], tokens['--accent'])).toBeGreaterThanOrEqual(
          4.5
        )
      })
    }
  }

  it('keeps the chosen fill when it stands out from the page', () => {
    expect(themeTokens('#ffca39', false)['--accent']).toBe('#ffca39')
    expect(themeTokens('#000000', false)['--accent']).toBe('#000000')
  })

  it('shades a black accent in the dark theme so it stays visible', () => {
    const fill = themeTokens('#000000', true)['--accent']
    expect(contrast(fill, '#161616')).toBeGreaterThanOrEqual(3)
  })
})
