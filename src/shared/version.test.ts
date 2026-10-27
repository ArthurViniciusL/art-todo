import { describe, expect, it } from 'vitest'
import { isNewer } from './version'

describe('isNewer', () => {
  it('compares each part as a number', () => {
    expect(isNewer('v1.2.0', '1.1.0')).toBe(true)
    expect(isNewer('1.10.0', '1.9.0')).toBe(true)
    expect(isNewer('2.0.0', '1.99.99')).toBe(true)
    expect(isNewer('1.1.0', '1.1.0')).toBe(false)
    expect(isNewer('1.0.9', '1.1.0')).toBe(false)
  })

  it('never treats an unparsable version as newer', () => {
    expect(isNewer('v1.2.0-beta', '1.1.0')).toBe(false)
    expect(isNewer('latest', '1.1.0')).toBe(false)
  })
})
