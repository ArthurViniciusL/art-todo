import { toast } from '@heroui/react'
import { MutationCache, QueryClient } from '@tanstack/react-query'

// Electron prefixes errors thrown in IPC handlers; keep only the message.
function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/^Error invoking remote method '[^']+': (Error: )?/, '')
}

// Data is local and only this window writes it, so cached data stays fresh until a mutation
// invalidates it.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: Infinity, retry: false, refetchOnWindowFocus: false },
    mutations: { retry: false }
  },
  mutationCache: new MutationCache({
    onError: (error) => {
      toast.danger('Não foi possível salvar', { description: errorMessage(error) })
    }
  })
})
