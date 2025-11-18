import { useQuery } from '@tanstack/react-query'
import { getRounds } from '@/api/rounds'
import { useToastContext } from '@/components/ToastContainer'

/**
 * React Query hook for fetching rounds list
 * - Query key: ['rounds', status?]
 * - Stale time: 10s (list can be slightly stale)
 * - Refetch interval: 30s (auto-refresh)
 * - Error handling with toast notifications
 */
export function useRoundsQuery(status?: string) {
  const { showToast } = useToastContext()

  return useQuery({
    queryKey: ['rounds', status],
    queryFn: async ({ signal }) => {
      // Signal is automatically passed by React Query for cancellation
      return getRounds(status)
    },
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // 30 seconds
    retry: 2,
    retryDelay: 1000,
    onError: (error: Error) => {
      // Only show toast for non-aborted errors
      if (error.name !== 'AbortError') {
        const message = error.message || 'Failed to load rounds'
        showToast(message, 'error')
      }
    },
  })
}

