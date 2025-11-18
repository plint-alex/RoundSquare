import type { RoundStatus } from '@/api/types'
import './StatusBadge.css'

interface StatusBadgeProps {
  status: RoundStatus
  showLabel?: boolean
  className?: string
}

const STATUS_LABELS: Record<RoundStatus, string> = {
  ACTIVE: 'Active',
  COOLDOWN: 'Cooldown',
  COMPLETED: 'Completed',
}

const STATUS_COLORS: Record<RoundStatus, string> = {
  ACTIVE: 'var(--color-status-active)',
  COOLDOWN: 'var(--color-status-cooldown)',
  COMPLETED: 'var(--color-status-completed)',
}

/**
 * StatusBadge component for displaying round status with color-coded indicators.
 * Provides accessible labels and consistent styling.
 */
export function StatusBadge({ status, showLabel = true, className = '' }: StatusBadgeProps) {
  const color = STATUS_COLORS[status]
  const label = STATUS_LABELS[status]

  return (
    <div
      className={`status-badge status-badge--${status.toLowerCase()} ${className}`}
      aria-label={`Status: ${label}`}
    >
      <span
        className="status-badge__dot"
        style={{ color }}
        aria-hidden="true"
        role="presentation"
      >
        ●
      </span>
      {showLabel && <span className="status-badge__label">{label}</span>}
    </div>
  )
}

