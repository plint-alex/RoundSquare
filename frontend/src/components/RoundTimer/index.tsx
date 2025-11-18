import type { RoundStatus } from '@/api/types'
import { formatDuration } from '@/utils/dateFormat'
import './RoundTimer.css'

interface RoundTimerProps {
  status: RoundStatus
  timeUntilStart: number | null
  timeRemaining: number | null
}

export function RoundTimer({ status, timeUntilStart, timeRemaining }: RoundTimerProps) {
  if (status === 'COOLDOWN') {
    if (timeUntilStart === null) {
      return (
        <div className="round-timer round-timer--cooldown" role="timer" aria-label="Round in cooldown">
          Cooldown
        </div>
      )
    }
    return (
      <div
        className="round-timer round-timer--cooldown"
        role="timer"
        aria-label={`Time until round starts: ${formatDuration(timeUntilStart)}`}
        aria-live="polite"
      >
        <span>until round starts</span>
        <span className="round-timer__time">{formatDuration(timeUntilStart)}</span>
      </div>
    )
  }

  if (status === 'ACTIVE') {
    if (timeRemaining === null) {
      return (
        <div className="round-timer round-timer--active" role="timer" aria-label="Round is active">
          Round Active!
        </div>
      )
    }
    return (
      <div
        className="round-timer round-timer--active"
        role="timer"
        aria-label={`Time remaining: ${formatDuration(timeRemaining)}`}
        aria-live="polite"
      >
        <span>Time remaining:</span>
        <span className="round-timer__time">{formatDuration(timeRemaining)}</span>
      </div>
    )
  }

  // COMPLETED
  return (
    <div className="round-timer round-timer--completed" role="timer" aria-label="Round completed">
      Round Completed
    </div>
  )
}

