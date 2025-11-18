import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRoundsQuery } from '../useRoundsQuery'
import * as roundsApi from '@/api/rounds'
import { ToastProvider } from '@/components/ToastContainer'

// Mock the API calls
vi.mock('@/api/rounds', () => ({
  getRounds: vi.fn(),
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

describe('useRoundsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches rounds on mount', async () => {
    const mockRounds = [
      {
        id: '1',
        status: 'ACTIVE' as const,
        cooldownStartAt: '2025-01-01T00:00:00Z',
        cooldownEndsAt: '2025-01-01T00:00:30Z',
        startAt: '2025-01-01T00:00:30Z',
        endAt: '2025-01-01T00:01:30Z',
        totalPoints: 100,
        timeUntilStart: null,
        timeRemaining: 50000,
      },
    ]
    vi.mocked(roundsApi.getRounds).mockResolvedValue(mockRounds)

    const { result } = renderHook(() => useRoundsQuery(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(roundsApi.getRounds).toHaveBeenCalled()
    expect(result.current.data).toEqual(mockRounds)
  })

  it('handles errors with toast', async () => {
    const errorMessage = 'Failed to load rounds'
    vi.mocked(roundsApi.getRounds).mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() => useRoundsQuery(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeDefined()
  })

  it('polls every 30 seconds', async () => {
    vi.useFakeTimers()
    const mockRounds = []
    vi.mocked(roundsApi.getRounds).mockResolvedValue(mockRounds)

    const { result } = renderHook(() => useRoundsQuery(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(roundsApi.getRounds).toHaveBeenCalledTimes(1)

    // Advance timer by 30 seconds
    vi.advanceTimersByTime(30000)

    await waitFor(() => {
      expect(roundsApi.getRounds).toHaveBeenCalledTimes(2)
    })

    vi.useRealTimers()
  })
})


