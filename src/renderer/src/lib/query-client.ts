import { QueryClient } from '@tanstack/react-query'

// Data is local and only this window writes it, so cached data stays fresh until a mutation
// invalidates it.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: Infinity, retry: false, refetchOnWindowFocus: false },
    mutations: { retry: false }
  }
})
