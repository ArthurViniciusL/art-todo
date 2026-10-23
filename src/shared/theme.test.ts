import { describe, expect, it } from 'vitest'
import { isThemePreference, titlebarOverlay } from './theme'

describe('isThemePreference', () => {
  it('accepts the three preferences', () => {
    expect(['system', 'light', 'dark'].every(isThemePreference)).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isThemePreference('blue')).toBe(false)
    expect(isThemePreference(undefined)).toBe(false)
    expect(isThemePreference(1)).toBe(false)
  })
})

describe('titlebarOverlay', () => {
  it('uses the dark palette when dark', () => {
    expect(titlebarOverlay(true)).toEqual({ color: '#161616', symbolColor: '#ededed', height: 44 })
  })

  it('uses the light palette when light', () => {
    expect(titlebarOverlay(false).color).toBe('#fafaf9')
  })
})
