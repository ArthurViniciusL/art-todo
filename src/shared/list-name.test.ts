import { describe, expect, it } from 'vitest'
import { defaultListName } from './list-name'

describe('defaultListName', () => {
  it('formats as dd/mm/yy - hh:mm:ss with zero padding', () => {
    expect(defaultListName(new Date(2026, 0, 5, 9, 3, 7))).toBe('05/01/26 - 09:03:07')
  })

  it('uses a 24-hour clock', () => {
    expect(defaultListName(new Date(2026, 9, 23, 23, 59, 59))).toBe('23/10/26 - 23:59:59')
  })
})
