import { useState, useEffect, useCallback } from 'react'
import { getRounds } from '@/api/rounds'
import type { RoundListDto } from '@/api/types'
import type { ApiError } from '@/api/types'

interface UseRoundsReturn {
  rounds: RoundListDto[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useRounds(status?: string): UseRoundsReturn {
  const [rounds, setRounds] = useState<RoundListDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRounds = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getRounds(status)
      setRounds(data)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to load rounds')
      setRounds([])
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    fetchRounds()
  }, [fetchRounds])

  return {
    rounds,
    loading,
    error,
    refresh: fetchRounds,
  }
}


