import { useNavigate } from 'react-router-dom'
import type { RoundListDto, RoundStatus } from '@/api/types'
import { formatDateTime } from '@/utils/dateFormat'
import './RoundCard.css'

interface RoundCardProps {
  round: RoundListDto
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

export function RoundCard({ round }: RoundCardProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/rounds/${round.id}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <div
      className="round-card"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Round ${round.id}, Status: ${STATUS_LABELS[round.status]}, Click to view details`}
    >
      <div
        className="round-card__accent"
        style={{ backgroundColor: STATUS_COLORS[round.status] }}
        aria-hidden="true"
      />
      <div className="round-card__content">
        <div className="round-card__header">
          <span className="round-card__dot" style={{ color: STATUS_COLORS[round.status] }} aria-hidden="true">
            ●
          </span>
          <span className="round-card__id">Round ID: {round.id}</span>
        </div>

        <div className="round-card__times">
          <div className="round-card__time">
            <span className="round-card__time-label">Start:</span>
            <span className="round-card__time-value">{formatDateTime(round.startAt)}</span>
          </div>
          <div className="round-card__time">
            <span className="round-card__time-label">End:</span>
            <span className="round-card__time-value">{formatDateTime(round.endAt)}</span>
          </div>
        </div>

        <div className="round-card__divider" aria-hidden="true" />

        <div className="round-card__status">
          <span className="round-card__status-label">Status:</span>
          <span className="round-card__status-value">{STATUS_LABELS[round.status]}</span>
        </div>
      </div>
    </div>
  )
}

