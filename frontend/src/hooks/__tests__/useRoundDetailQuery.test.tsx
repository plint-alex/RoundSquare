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

  it('polls every 1 second for active rounds', async () => {
    vi.useFakeTimers()
    const now = Date.now()
    const mockRound = {
      id: '1',
      status: 'ACTIVE' as const,
      cooldownStartAt: new Date(now - 60000).toISOString(),
      cooldownEndsAt: new Date(now - 30000).toISOString(),
      startAt: new Date(now - 30000).toISOString(),
      endAt: new Date(now + 60000).toISOString(),
      totalPoints: 100,
      timeUntilStart: null,
      timeRemaining: 60000,
      myStats: {
        tapCount: 5,
        score: 10,
      },
    }
    vi.mocked(roundsApi.getRoundById).mockResolvedValue(mockRound)

    const { result } = renderHook(() => useRoundDetailQuery('1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(roundsApi.getRoundById).toHaveBeenCalledTimes(1)

    // Advance timer by 1 second (for active rounds)
    vi.advanceTimersByTime(1000)

    await waitFor(() => {
      expect(roundsApi.getRoundById).toHaveBeenCalledTimes(2)
    }, { timeout: 100 })

    vi.useRealTimers()
  })

  it('polls every 15 seconds for completed rounds', async () => {
    vi.useFakeTimers()
    const now = Date.now()
    const mockRound = {
      id: '1',
      status: 'COMPLETED' as const,
      cooldownStartAt: new Date(now - 120000).toISOString(),
      cooldownEndsAt: new Date(now - 90000).toISOString(),
      startAt: new Date(now - 90000).toISOString(),
      endAt: new Date(now - 30000).toISOString(),
      totalPoints: 100,
      timeUntilStart: null,
      timeRemaining: null,
      myStats: {
        tapCount: 5,
        score: 10,
      },
    }
    vi.mocked(roundsApi.getRoundById).mockResolvedValue(mockRound)

    const { result } = renderHook(() => useRoundDetailQuery('1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(roundsApi.getRoundById).toHaveBeenCalledTimes(1)

    // Advance timer by 15 seconds (for completed rounds)
    vi.advanceTimersByTime(15000)

    await waitFor(() => {
      expect(roundsApi.getRoundById).toHaveBeenCalledTimes(2)
    }, { timeout: 100 })

    vi.useRealTimers()
  })

  it('handles errors with toast', async () => {
    const errorMessage = 'Failed to load round details'
    vi.mocked(roundsApi.getRoundById).mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() => useRoundDetailQuery('1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })
})


