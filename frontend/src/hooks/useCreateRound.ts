import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createRound } from '@/api/rounds'
import type { RoundListDto } from '@/api/types'
import type { ApiError } from '@/api/types'
import { useToastContext } from '@/components/ToastContainer'

interface UseCreateRoundReturn {
  createRound: (data?: { startDelaySeconds?: number }) => void
  isCreating: boolean
  error: string | null
}

/**
 * React Query mutation hook for creating a new round
 * - On success:
 *   - Invalidates ['rounds'] queries (refresh lobby)
 *   - Returns created round data
 * - Error handling with toast notifications
 */
export function useCreateRound(
  onSuccess?: (round: RoundListDto) => void,
  onError?: (error: string) => void
): UseCreateRoundReturn {
  const queryClient = useQueryClient()
  const { showToast } = useToastContext()

  const mutation = useMutation({
    mutationFn: (data?: { startDelaySeconds?: number }) => createRound(data),
    onSuccess: (round: RoundListDto) => {
      // Invalidate rounds list to refresh lobby
      queryClient.invalidateQueries({ queryKey: ['rounds'] })

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(round)
      }
    },
    onError: (error: Error) => {
      const apiError = error as ApiError
      const errorMessage = apiError.message || 'Failed to create round'

      // Show toast for error
      showToast(errorMessage, 'error')

      // Call error callback if provided
      if (onError) {
        onError(errorMessage)
      }
    },
  })

  return {
    createRound: (data?: { startDelaySeconds?: number }) => mutation.mutate(data),
    isCreating: mutation.isPending,
    error: mutation.error ? (mutation.error as ApiError).message || 'Failed to create round' : null,
  }
}


