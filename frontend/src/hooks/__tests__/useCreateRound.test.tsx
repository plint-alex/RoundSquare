import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCreateRound } from '../useCreateRound'
import * as roundsApi from '@/api/rounds'
import { ToastProvider, useToastContext } from '@/components/ToastContainer'

// Mock the API calls
vi.mock('@/api/rounds', () => ({
  createRound: vi.fn(),
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
      mutations: {
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

describe('useCreateRound', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates round with default duration', async () => {
    const mockRound = {
      id: '1',
      status: 'COOLDOWN' as const,
      cooldownStartAt: '2025-01-01T00:00:00Z',
      cooldownEndsAt: '2025-01-01T00:00:30Z',
      startAt: '2025-01-01T00:00:30Z',
      endAt: '2025-01-01T00:01:30Z',
      totalPoints: 0,
      timeUntilStart: 30,
      timeRemaining: null,
    }
    vi.mocked(roundsApi.createRound).mockResolvedValue(mockRound)

    const onSuccess = vi.fn()
    const { result } = renderHook(() => useCreateRound(onSuccess), {
      wrapper: createWrapper(),
    })

    result.current.createRound()

    await waitFor(() => {
      expect(result.current.isCreating).toBe(false)
    })

    expect(roundsApi.createRound).toHaveBeenCalledWith(undefined)
    expect(onSuccess).toHaveBeenCalledWith(mockRound)
  })

  it('creates round with custom startDelaySeconds', async () => {
    const mockRound = {
      id: '1',
      status: 'COOLDOWN' as const,
      cooldownStartAt: '2025-01-01T00:00:00Z',
      cooldownEndsAt: '2025-01-01T00:01:00Z',
      startAt: '2025-01-01T00:01:00Z',
      endAt: '2025-01-01T00:02:00Z',
      totalPoints: 0,
      timeUntilStart: 60,
      timeRemaining: null,
    }
    vi.mocked(roundsApi.createRound).mockResolvedValue(mockRound)

    const onSuccess = vi.fn()
    const { result } = renderHook(() => useCreateRound(onSuccess), {
      wrapper: createWrapper(),
    })

    result.current.createRound({ startDelaySeconds: 60 })

    await waitFor(() => {
      expect(result.current.isCreating).toBe(false)
    })

    expect(roundsApi.createRound).toHaveBeenCalledWith({ startDelaySeconds: 60 })
    expect(onSuccess).toHaveBeenCalledWith(mockRound)
  })

  it('handles errors with toast', async () => {
    const errorMessage = 'Failed to create round'
    vi.mocked(roundsApi.createRound).mockRejectedValue(new Error(errorMessage))

    const onError = vi.fn()
    const { result } = renderHook(() => useCreateRound(undefined, onError), {
      wrapper: createWrapper(),
    })

    result.current.createRound()

    await waitFor(() => {
      expect(result.current.isCreating).toBe(false)
    })

    expect(result.current.error).toBe(errorMessage)
    expect(onError).toHaveBeenCalledWith(errorMessage)
  })

  it('shows loading state during creation', async () => {
    let resolvePromise: (value: any) => void
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    vi.mocked(roundsApi.createRound).mockReturnValue(promise as any)

    const { result } = renderHook(() => useCreateRound(), {
      wrapper: createWrapper(),
    })

    // Trigger mutation
    result.current.createRound({})

    // Check loading state is set
    await waitFor(() => {
      expect(result.current.isCreating).toBe(true)
    })

    // Resolve the promise
    resolvePromise!({ id: 'new-round-id' } as any)

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isCreating).toBe(false)
    })
  })
})


