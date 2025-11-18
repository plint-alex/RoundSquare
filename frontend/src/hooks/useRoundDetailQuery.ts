import { useQuery } from '@tanstack/react-query'
import { getRoundById } from '@/api/rounds'
import { useToastContext } from '@/components/ToastContainer'
import type { RoundStatus } from '@/api/types'

/**
 * React Query hook for fetching round detail with adaptive polling
 * - Query key: ['round', id, limit?]
 * - Stale time: 5s
 * - Adaptive polling based on round status:
 *   - ACTIVE: 1s (refetchInterval: 1000)
 *   - COOLDOWN or COMPLETED: 15s (refetchInterval: 15000)
 * - Error handling with toast notifications
 */
function computeRoundStatus(round: { startAt: string; endAt: string } | null | undefined): RoundStatus {
  if (!round) return 'COOLDOWN'
  
  const now = new Date()
  const startAt = new Date(round.startAt)
  const endAt = new Date(round.endAt)
  
  if (now < startAt) return 'COOLDOWN'
  if (now >= startAt && now < endAt) return 'ACTIVE'
  return 'COMPLETED'
}

export function useRoundDetailQuery(roundId: string, leaderboardLimit?: number) {
  const { showToast } = useToastContext()

  const query = useQuery({
    queryKey: ['round', roundId, leaderboardLimit],
    queryFn: async ({ signal }) => {
      return getRoundById(roundId, leaderboardLimit)
    },
    enabled: !!roundId,
    staleTime: 5 * 1000,
    refetchInterval: (query) => {
      const round = query.state.data as { startAt: string; endAt: string } | undefined
      if (!round) return false
      
      const status = computeRoundStatus(round)
      if (status === 'ACTIVE') {
        return 1000 // 1 second for active rounds
      }
      return 15000 // 15 seconds for cooldown or completed
    },
    retry: 2,
    retryDelay: 1000,
    onError: (error: Error) => {
      if (error.name !== 'AbortError') {
        const message = error.message || 'Failed to load round details'
        showToast(message, 'error')
      }
    },
  })

  return query
}

