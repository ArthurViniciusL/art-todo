import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { List } from '../../../shared/domain'
import { onEvent } from '../lib/api'
import { selectionForList, useUiStore } from '../stores/ui'
import { queryKeys } from './queries'

/** A clicked reminder opens its task in its list, or the Hoje view for a summary. */
export function useReminderOpen(): void {
  const client = useQueryClient()

  useEffect(
    () =>
      onEvent('reminders:open', (target) => {
        const { select, openTask } = useUiStore.getState()
        if (!target) {
          select({ kind: 'view', view: 'today' })
          return
        }
        const lists = client.getQueryData<List[]>(queryKeys.lists) ?? []
        select(selectionForList(lists, target.listId))
        openTask(target.taskId)
      }),
    [client]
  )
}
