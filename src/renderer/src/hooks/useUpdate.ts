import { toast } from '@heroui/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CircleArrowUp, Download, LoaderCircle, RefreshCw, type LucideIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { UpdateState } from '../../../shared/domain'
import { invoke, onEvent } from '../lib/api'
import { queryKeys } from './queries'

const IDLE: UpdateState = { status: 'idle' }

/** The main process's update state, kept live by the updates:state event. */
export function useUpdateState(): UpdateState {
  const client = useQueryClient()
  const { data = IDLE } = useQuery({
    queryKey: queryKeys.updateState,
    queryFn: () => invoke('updates:getState')
  })
  useEffect(
    () => onEvent('updates:state', (state) => client.setQueryData(queryKeys.updateState, state)),
    [client]
  )
  return data
}

export interface UpdateAction {
  label: string
  icon: LucideIcon
  /** Undefined while busy (checking, downloading, installing). */
  run?: () => void
  /** Download progress, 0–100. */
  percent?: number
}

const check = (): void => void invoke('updates:check')
const download = (): void => void invoke('updates:download')
const install = (): void => void invoke('updates:install')

/** What the update controls show and do in each state. */
export function updateAction(state: UpdateState): UpdateAction {
  switch (state.status) {
    case 'idle':
      return { label: 'Verificar atualizações', icon: RefreshCw, run: check }
    case 'checking':
      return { label: 'Verificando atualizações…', icon: RefreshCw }
    case 'available':
      return { label: `Baixar versão ${state.version}`, icon: Download, run: download }
    case 'downloading': {
      const percent = Math.round(state.progress * 100)
      return { label: `Baixando versão ${state.version}: ${percent}%`, icon: Download, percent }
    }
    case 'ready':
      return {
        label: `Instalar versão ${state.version} e reiniciar`,
        icon: CircleArrowUp,
        run: install
      }
    case 'installing':
      return { label: `Instalando versão ${state.version}…`, icon: LoaderCircle }
    case 'error':
      return {
        label: `${state.message} Tentar de novo`,
        icon: RefreshCw,
        run: state.version ? download : check
      }
  }
}

/** Toasts when a new version is found and when it is ready to install. */
export function useUpdateToasts(): void {
  const state = useUpdateState()
  const previous = useRef(state.status)
  // The "available" toast, closed once its Baixar action no longer applies.
  const availableToast = useRef<string | null>(null)

  useEffect(() => {
    const before = previous.current
    previous.current = state.status
    if (state.status === before) return
    if (availableToast.current && state.status !== 'available') {
      toast.close(availableToast.current)
      availableToast.current = null
    }
    if (state.status === 'available') {
      availableToast.current = toast(`Versão ${state.version} disponível`, {
        timeout: 0,
        actionProps: { children: 'Baixar', onPress: download }
      })
    } else if (state.status === 'ready' && before === 'downloading') {
      toast('Atualização baixada', {
        description: `Versão ${state.version}`,
        actionProps: { children: 'Instalar e reiniciar', onPress: install }
      })
    } else if (state.status === 'error' && before !== 'idle') {
      toast(state.message)
    }
  }, [state])
}
