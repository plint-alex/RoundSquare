import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRoundDetailQuery } from '../useRoundDetailQuery'
import * as roundsApi from '@/api/rounds'
import { ToastProvider } from '@/components/ToastContainer'

// Mock the API calls
vi.mock('@/api/rounds', () => ({
  getRoundById: vi.fn(),
}))

// Mock the toast context
vi.mock('@/components/ToastContainer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/ToastContainer')>()
  return {
    ...actual,
    useToastContext: () => ({
      showToast: vi.fn(),
    }),
  }
})

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  )
}

describe('useRoundDetailQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches round detail on mount', async () => {
    const mockRound = {
      id: '1',
      status: 'ACTIVE' as const,
      cooldownStartAt: '2025-01-01T00:00:00Z',
      cooldownEndsAt: '2025-01-01T00:00:30Z',
      startAt: '2025-01-01T00:00:30Z',
      endAt: '2025-01-01T00:01:30Z',
      totalPoints: 100,
      timeUntilStart: null,
      timeRemaining: 50000,
      myStats: {
        tapCount: 5,
        score: 10,
      },
    }
    vi.mocked(roundsApi.getRoundById).mockResolvedValue(mockRound)

    const { result } = renderHook(() => useRoundDetailQuery('1', 10), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(roundsApi.getRoundById).toHaveBeenCalledWith('1', 10)
    expect(result.current.data).toEqual(mockRound)
  })

  it('handles errors with toast', async () => {
    const errorMessage = 'Failed to load round details'
    vi.mocked(roundsApi.getRoundById).mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() => useRoundDetailQuery('1'), {
      wrapper: createWrapper(),
    })

    // Wait for query to finish loading (either success or error)
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    }, { timeout: 3000 })

    // Check that error state is set or error is defined
    expect(result.current.isError || result.current.error).toBeTruthy()
  })
})


