import { useState, useEffect, useCallback } from 'react'
import { getRoundById } from '@/api/rounds'
import type { RoundDetailDto } from '@/api/types'
import type { ApiError } from '@/api/types'

interface UseRoundDetailReturn {
  round: RoundDetailDto | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useRoundDetail(roundId: string, limit?: number): UseRoundDetailReturn {
  const [round, setRound] = useState<RoundDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRound = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getRoundById(roundId, limit)
      setRound(data)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to load round')
      setRound(null)
    } finally {
      setLoading(false)
    }
  }, [roundId, limit])

  useEffect(() => {
    fetchRound()
  }, [fetchRound])

  return {
    round,
    loading,
    error,
    refresh: fetchRound,
  }
}


