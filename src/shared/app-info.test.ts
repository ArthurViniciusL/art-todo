import { describe, expect, it } from 'vitest'
import { APP_NAME } from './app-info'

describe('app info', () => {
  it('exposes the display name', () => {
    expect(APP_NAME).toBe('Art Todo')
  })
})
