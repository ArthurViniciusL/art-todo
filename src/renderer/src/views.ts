import { CalendarDays, Inbox, Sun, type LucideIcon } from 'lucide-react'
import type { SmartView } from './stores/ui'

export const SMART_VIEWS: { id: SmartView; label: string; icon: LucideIcon }[] = [
  { id: 'inbox', label: 'Entrada', icon: Inbox },
  { id: 'today', label: 'Hoje', icon: Sun },
  { id: 'upcoming', label: 'Próximos', icon: CalendarDays }
]
