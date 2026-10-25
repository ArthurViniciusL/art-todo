import { daysBetween, fromIsoDate } from '../../../shared/dates'

const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
const dayMonth = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })
const dayMonthYear = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric'
})
const longDay = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

const clean = (text: string): string => text.replace(/\./g, '')

/** Short relative label for a due date: "Hoje", "Amanhã", "sex", "3 nov". */
export function shortDateLabel(iso: string, today: string): string {
  const diff = daysBetween(today, iso)
  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Amanhã'
  if (diff === -1) return 'Ontem'
  const date = fromIsoDate(iso)
  if (diff > 1 && diff < 7) return clean(weekday.format(date))
  const sameYear = iso.slice(0, 4) === today.slice(0, 4)
  return clean((sameYear ? dayMonth : dayMonthYear).format(date))
}

/** Heading for a day group: "Amanhã" or "segunda-feira, 27 de outubro". */
export function dayHeading(iso: string, today: string): string {
  if (daysBetween(today, iso) === 1) return 'Amanhã'
  const text = longDay.format(fromIsoDate(iso))
  return text.charAt(0).toUpperCase() + text.slice(1)
}
