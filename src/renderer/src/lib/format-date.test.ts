import { describe, expect, it } from 'vitest'
import { dayHeading, shortDateLabel } from './format-date'

const today = '2026-10-25' // a Sunday

describe('shortDateLabel', () => {
  it('uses words for yesterday, today and tomorrow', () => {
    expect(shortDateLabel('2026-10-24', today)).toBe('Ontem')
    expect(shortDateLabel('2026-10-25', today)).toBe('Hoje')
    expect(shortDateLabel('2026-10-26', today)).toBe('Amanhã')
  })

  it('uses the weekday within the next week', () => {
    expect(shortDateLabel('2026-10-30', today)).toBe('sex')
  })

  it('uses day and month further out, with the year when it differs', () => {
    expect(shortDateLabel('2026-11-03', today)).toBe('3 de nov')
    expect(shortDateLabel('2027-01-02', today)).toBe('2 de jan de 2027')
  })
})

describe('dayHeading', () => {
  it('names tomorrow and spells out other days', () => {
    expect(dayHeading('2026-10-26', today)).toBe('Amanhã')
    expect(dayHeading('2026-10-27', today)).toBe('Terça-feira, 27 de outubro')
  })
})
