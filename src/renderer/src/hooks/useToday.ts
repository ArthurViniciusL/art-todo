import { useEffect, useState } from 'react'
import { toIsoDate } from '../../../shared/dates'

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/** Today's local date, updated at midnight while the app stays open. */
export function useToday(): { today: string; startOfToday: number } {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const nextMidnight = startOfDay(now) + 86_400_000
    const timer = setTimeout(() => setNow(new Date()), nextMidnight - Date.now() + 1000)
    return () => clearTimeout(timer)
  }, [now])

  return { today: toIsoDate(now), startOfToday: startOfDay(now) }
}
