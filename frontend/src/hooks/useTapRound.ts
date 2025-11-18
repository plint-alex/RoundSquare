import { useRef, useEffect, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { tapRound } from '@/api/rounds'
import { calculateScore } from '@/utils/scoreCalculation'
import type { TapResultDto } from '@/api/types'
import type { ApiError } from '@/api/types'
import { useToastContext } from '@/components/ToastContainer'

interface UseTapRoundReturn {
  tap: () => void
  localTapCount: number
  localScore: number
  isTapping: boolean
  error: string | null
}

/**
 * Hook for tapping a round with batching
 * - Tracks local tap count and calculates score on frontend
 * - Sends immediately on first tap
 * - Batches subsequent taps: sends after 1 second if changed
 * - If no changes, doesn't send until next tap
 */
export function useTapRound(
  roundId: string,
  initialTapCount: number = 0,
  onSuccess?: (result: TapResultDto) => void,
  onError?: (error: string) => void
): UseTapRoundReturn {
  const queryClient = useQueryClient()
  const { showToast } = useToastContext()
  const [localTapCount, setLocalTapCount] = useState(initialTapCount)
  const [isTapping, setIsTapping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lastSentTapCountRef = useRef<number>(initialTapCount)
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isFirstTapRef = useRef<boolean>(true)
  const pendingTapCountRef = useRef<number>(initialTapCount)

  // Calculate score from tap count
  const localScore = calculateScore(localTapCount)

  // Send tap update to server
  const sendTapUpdate = useCallback(
    async (tapCount: number, score: number) => {
      setIsTapping(true)
      setError(null)

      try {
        const result = await tapRound(roundId, tapCount, score)
        lastSentTapCountRef.current = tapCount

        // Update query cache
        queryClient.setQueryData(['round', roundId], (oldData: any) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            myStats: {
              ...oldData.myStats,
              tapCount: result.tapCount,
              score: result.score,
            },
          }
        })

        // Invalidate queries after a delay
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['round', roundId] })
          queryClient.invalidateQueries({ queryKey: ['rounds'] })
        }, 500)

        if (onSuccess) {
          onSuccess(result)
        }
      } catch (err) {
        const apiError = err as ApiError
        const errorMessage =
          apiError.code === 'ROUND_NOT_ACTIVE'
            ? 'Round is not active'
            : apiError.message || 'Failed to tap'

        setError(errorMessage)
        showToast(errorMessage, 'error')

        if (onError) {
          onError(errorMessage)
        }
      } finally {
        setIsTapping(false)
      }
    },
    [roundId, queryClient, onSuccess, onError, showToast]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current)
        batchTimeoutRef.current = null
      }
    }
  }, [])

  // Sync local tap count with initial value when it changes
  useEffect(() => {
    // Only sync if server value is higher (monotonic)
    if (initialTapCount >= lastSentTapCountRef.current) {
      lastSentTapCountRef.current = initialTapCount
      setLocalTapCount(initialTapCount)
      pendingTapCountRef.current = initialTapCount
      // Reset first tap flag if we have existing taps
      isFirstTapRef.current = initialTapCount === 0
    }
  }, [initialTapCount])

  const tap = useCallback(() => {
    const newTapCount = localTapCount + 1
    setLocalTapCount(newTapCount)
    pendingTapCountRef.current = newTapCount

    // Send immediately on first tap
    if (isFirstTapRef.current) {
      isFirstTapRef.current = false
      const newScore = calculateScore(newTapCount)
      sendTapUpdate(newTapCount, newScore)
      return
    }

    // For subsequent taps, batch them
    // Clear existing timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current)
    }

    // Set new timeout to send after 1 second
    batchTimeoutRef.current = setTimeout(() => {
      const currentPending = pendingTapCountRef.current
      // Only send if tap count has changed since last sent
      if (currentPending > lastSentTapCountRef.current) {
        const currentScore = calculateScore(currentPending)
        sendTapUpdate(currentPending, currentScore)
      }
      batchTimeoutRef.current = null
    }, 1000)
  }, [localTapCount, sendTapUpdate])

  return {
    tap,
    localTapCount,
    localScore,
    isTapping,
    error,
  }
}

