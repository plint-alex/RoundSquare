import { useEffect, useRef } from 'react'
import { formatDuration } from '@/utils/dateFormat'
import './Timer.css'

interface TimerProps {
  duration: number | null
  label?: string
  variant?: 'cooldown' | 'active' | 'completed' | 'default'
  className?: string
  announceChanges?: boolean
}

/**
 * Generic Timer component for displaying formatted duration.
 * Supports different variants and optional screen reader announcements.
 */
export function Timer({
  duration,
  label,
  variant = 'default',
  className = '',
  announceChanges = false,
}: TimerProps) {
  const previousDuration = useRef<number | null>(null)
  const announceRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (announceChanges && duration !== null && previousDuration.current !== duration) {
      // Announce changes to screen readers
      if (announceRef.current) {
        const formatted = formatDuration(duration)
        announceRef.current.textContent = label ? `${label}: ${formatted}` : formatted
      }
      previousDuration.current = duration
    }
  }, [duration, label, announceChanges])

  if (duration === null) {
    return null
  }

  const formattedDuration = formatDuration(duration)
  const timerClasses = [
    'timer',
    `timer--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={timerClasses} aria-label={label || 'Timer'}>
      {announceChanges && (
        <span
          ref={announceRef}
          className="timer__announce"
          aria-live="polite"
          aria-atomic="true"
          role="status"
        >
          {label ? `${label}: ${formattedDuration}` : formattedDuration}
        </span>
      )}
      {label && <span className="timer__label">{label}</span>}
      <span className="timer__time" aria-hidden={announceChanges}>
        {formattedDuration}
      </span>
    </div>
  )
}


