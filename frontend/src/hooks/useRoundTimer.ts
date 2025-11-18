import { useState, useEffect, useRef } from 'react'
import type { RoundDetailDto, RoundStatus } from '@/api/types'

interface UseRoundTimerReturn {
  timeUntilStart: number | null
  timeRemaining: number | null
  status: RoundStatus
}

export function useRoundTimer(round: RoundDetailDto | null): UseRoundTimerReturn {
  const [currentTime, setCurrentTime] = useState(Date.now())
  const intervalRef = useRef<number | null>(null)
  const roundRef = useRef<RoundDetailDto | null>(round)

  // Update ref when round changes
  useEffect(() => {
    roundRef.current = round
  }, [round])

  // Set up interval once and keep it running
  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  // Use ref to get latest round data without causing re-renders
  const latestRound = roundRef.current || round

  if (!latestRound) {
    return {
      timeUntilStart: null,
      timeRemaining: null,
      status: 'COOLDOWN',
    }
  }

  const now = new Date(currentTime)
  const startAt = new Date(latestRound.startAt)
  const endAt = new Date(latestRound.endAt)

  let timeUntilStart: number | null = null
  let timeRemaining: number | null = null
  let status: RoundStatus = 'COOLDOWN'

  // Calculate times and status based on current time
  if (now < startAt) {
    // COOLDOWN: Round hasn't started yet
    status = 'COOLDOWN'
    timeUntilStart = startAt.getTime() - now.getTime()
    timeRemaining = null
  } else if (now >= startAt && now < endAt) {
    // ACTIVE: Round is in progress
    status = 'ACTIVE'
    timeUntilStart = null
    timeRemaining = endAt.getTime() - now.getTime()
  } else {
    // COMPLETED: Round has ended
    status = 'COMPLETED'
    timeUntilStart = null
    timeRemaining = null
  }

  return {
    timeUntilStart,
    timeRemaining,
    status,
  }
}


