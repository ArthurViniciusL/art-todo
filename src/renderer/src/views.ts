import { CalendarDays, Sun, type LucideIcon } from 'lucide-react'
import type { SmartView } from './stores/ui'

export const SMART_VIEWS: { id: SmartView; label: string; icon: LucideIcon }[] = [
  { id: 'today', label: 'Hoje', icon: Sun },
  { id: 'upcoming', label: 'Próximos', icon: CalendarDays }
]
