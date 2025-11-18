import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useTapRound } from '../useTapRound'
import * as roundsApi from '@/api/rounds'
import type { TapResultDto } from '@/api/types'

// Mock the API module
vi.mock('@/api/rounds', () => ({
  tapRound: vi.fn(),
}))

describe('useTapRound', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockTapResult: TapResultDto = {
    tapCount: 5,
    score: 5,
  }

  it('should call tap API and return result', async () => {
    const mockTapRound = vi.mocked(roundsApi.tapRound)
    mockTapRound.mockResolvedValueOnce(mockTapResult)

    const onSuccess = vi.fn()
    const onError = vi.fn()

    const { result } = renderHook(() => useTapRound('round-id', 0, onSuccess, onError))

    expect(result.current.isTapping).toBe(false)
    expect(result.current.localTapCount).toBe(0)
    expect(result.current.localScore).toBe(0)

    result.current.tap()

    await waitFor(() => {
      expect(mockTapRound).toHaveBeenCalledWith('round-id', 1, 1)
      expect(result.current.isTapping).toBe(false)
      expect(result.current.localTapCount).toBe(1)
      expect(onSuccess).toHaveBeenCalledWith(mockTapResult)
      expect(onError).not.toHaveBeenCalled()
    })
  })

  it('should handle error and call onError', async () => {
    const mockTapRound = vi.mocked(roundsApi.tapRound)
    const apiError = new Error('Round is not active') as Error & { code?: string; status?: number }
    apiError.code = 'ROUND_NOT_ACTIVE'
    apiError.status = 409
    mockTapRound.mockRejectedValueOnce(apiError)

    const onSuccess = vi.fn()
    const onError = vi.fn()

    const { result } = renderHook(() => useTapRound('round-id', 0, onSuccess, onError))

    result.current.tap()

    await waitFor(() => {
      expect(result.current.isTapping).toBe(false)
      expect(result.current.error).toBe('Round is not active')
      expect(onSuccess).not.toHaveBeenCalled()
      expect(onError).toHaveBeenCalledWith('Round is not active')
    })
  })

  it('should set isTapping during API call', async () => {
    let resolvePromise: (value: TapResultDto) => void
    const promise = new Promise<TapResultDto>((resolve) => {
      resolvePromise = resolve
    })

    const mockTapRound = vi.mocked(roundsApi.tapRound)
    mockTapRound.mockReturnValueOnce(promise)

    const { result } = renderHook(() => useTapRound('round-id', 0))

    result.current.tap()

    // Should be tapping while promise is pending
    await waitFor(() => {
      expect(result.current.isTapping).toBe(true)
    })

    // Resolve the promise
    resolvePromise!(mockTapResult)

    await waitFor(() => {
      expect(result.current.isTapping).toBe(false)
    })
  })

  it('should handle generic errors', async () => {
    const mockTapRound = vi.mocked(roundsApi.tapRound)
    mockTapRound.mockRejectedValueOnce(new Error('Network error'))

    const onSuccess = vi.fn()
    const onError = vi.fn()

    const { result } = renderHook(() => useTapRound('round-id', 0, onSuccess, onError))

    result.current.tap()

    await waitFor(() => {
      expect(result.current.error).toBe('Network error')
      expect(onError).toHaveBeenCalledWith('Network error')
    })
  })

  it('should handle errors without message', async () => {
    const mockTapRound = vi.mocked(roundsApi.tapRound)
    const error = new Error() as Error & { code?: string; message?: string }
    error.message = undefined
    mockTapRound.mockRejectedValueOnce(error)

    const { result } = renderHook(() => useTapRound('round-id', 0))

    result.current.tap()

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to tap')
    })
  })
})


