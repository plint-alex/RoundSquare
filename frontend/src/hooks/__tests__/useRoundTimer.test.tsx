import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useRoundTimer } from '../useRoundTimer'
import type { RoundDetailDto } from '@/api/types'

describe('useRoundTimer', () => {
  beforeEach(() => {
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const createRound = (
    startAt: Date,
    endAt: Date,
    status: 'COOLDOWN' | 'ACTIVE' | 'COMPLETED' = 'ACTIVE'
  ): RoundDetailDto => {
    const now = new Date()
    return {
      id: 'test-round-id',
      status,
      cooldownStartAt: new Date(startAt.getTime() - 60000).toISOString(),
      cooldownEndsAt: startAt.toISOString(),
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      totalPoints: 0,
      timeUntilStart: null,
      timeRemaining: null,
    }
  }

  it('should return COOLDOWN status when round has not started', () => {
    const now = new Date('2025-05-18T10:00:00Z')
    vi.setSystemTime(now)

    const startAt = new Date('2025-05-18T10:05:00Z')
    const endAt = new Date('2025-05-18T10:10:00Z')
    const round = createRound(startAt, endAt, 'COOLDOWN')

    const { result } = renderHook(() => useRoundTimer(round))

    expect(result.current.status).toBe('COOLDOWN')
    expect(result.current.timeUntilStart).toBeCloseTo(300000, -2) // ~5 minutes in ms
    expect(result.current.timeRemaining).toBeNull()
  })

  it('should return ACTIVE status when round is in progress', () => {
    const now = new Date('2025-05-18T10:06:00Z')
    vi.setSystemTime(now)

    const startAt = new Date('2025-05-18T10:05:00Z')
    const endAt = new Date('2025-05-18T10:10:00Z')
    const round = createRound(startAt, endAt, 'ACTIVE')

    const { result } = renderHook(() => useRoundTimer(round))

    expect(result.current.status).toBe('ACTIVE')
    expect(result.current.timeUntilStart).toBeNull()
    expect(result.current.timeRemaining).toBeCloseTo(240000, -2) // ~4 minutes in ms
  })

  it('should return COMPLETED status when round has ended', () => {
    const now = new Date('2025-05-18T10:11:00Z')
    vi.setSystemTime(now)

    const startAt = new Date('2025-05-18T10:05:00Z')
    const endAt = new Date('2025-05-18T10:10:00Z')
    const round = createRound(startAt, endAt, 'COMPLETED')

    const { result } = renderHook(() => useRoundTimer(round))

    expect(result.current.status).toBe('COMPLETED')
    expect(result.current.timeUntilStart).toBeNull()
    expect(result.current.timeRemaining).toBeNull()
  })

  it('should handle null round', () => {
    const { result } = renderHook(() => useRoundTimer(null))

    expect(result.current.status).toBe('COOLDOWN')
    expect(result.current.timeUntilStart).toBeNull()
    expect(result.current.timeRemaining).toBeNull()
  })

  it('should clean up interval on unmount', () => {
    const now = new Date('2025-05-18T10:06:00Z')
    vi.setSystemTime(now)

    const startAt = new Date('2025-05-18T10:05:00Z')
    const endAt = new Date('2025-05-18T10:10:00Z')
    const round = createRound(startAt, endAt, 'ACTIVE')

    const { unmount } = renderHook(() => useRoundTimer(round))

    const clearIntervalSpy = vi.spyOn(window, 'clearInterval')

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
  })
})


