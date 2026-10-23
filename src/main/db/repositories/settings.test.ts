import { describe, expect, it } from 'vitest'
import { openTestDatabase } from '../test-db'
import { createSettingsRepository } from './settings'

describe('settings repository', () => {
  it('returns the fallback for a missing key', () => {
    const settings = createSettingsRepository(openTestDatabase())
    expect(settings.get('theme', 'system')).toBe('system')
  })

  it('stores and overwrites JSON values', () => {
    const settings = createSettingsRepository(openTestDatabase())
    settings.set('theme', 'dark')
    settings.set('theme', 'light')
    settings.set('window', { width: 800, height: 600 })
    expect(settings.get('theme', 'system')).toBe('light')
    expect(settings.get('window', null)).toEqual({ width: 800, height: 600 })
  })
})
