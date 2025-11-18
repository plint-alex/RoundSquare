import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useRoundDetailQuery } from '@/hooks/useRoundDetailQuery'
import { useRoundTimer } from '@/hooks/useRoundTimer'
import { useTapRound } from '@/hooks/useTapRound'
import { Layout } from '@/components/Layout'
import { Goose } from '@/components/Goose'
import { RoundTimer } from '@/components/RoundTimer'
import { StatRow } from '@/components/StatRow'
import { Button } from '@/components/Button'
import './RoundDetailPage.css'

export function RoundDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { data: round, isLoading: loading, error } = useRoundDetailQuery(id || '', 10)
  const { timeUntilStart, timeRemaining, status } = useRoundTimer(round)

  const initialTapCount = round?.myStats?.tapCount || 0
  const { tap, localTapCount, localScore, isTapping, error: tapError } = useTapRound(
    id || '',
    initialTapCount
  )

  const handleTap = () => {
    if (status !== 'ACTIVE') {
      return
    }

    // Hook handles incrementing and sending
    tap()
  }

  if (loading && !round) {
    return (
      <div className="round-detail-page">
        <div className="round-detail-page__header">
          <div className="round-detail-page__loading-title">Loading...</div>
          {user && (
            <div className="round-detail-page__user">
              <span>{user.username}</span>
            </div>
          )}
        </div>
        <div className="round-detail-page__loading">
          <div className="round-detail-page__skeleton-goose" />
          <div className="round-detail-page__skeleton-timer" />
        </div>
      </div>
    )
  }

  if (error || !round || !id) {
    return (
      <div className="round-detail-page">
        <div className="round-detail-page__header">
          <h1 className="round-detail-page__title">Round Not Found</h1>
          {user && (
            <div className="round-detail-page__user">
              <span>{user.username}</span>
            </div>
          )}
        </div>
        <div className="round-detail-page__error">
          <p>{error?.message || 'Round not found'}</p>
          <button className="round-detail-page__back-btn" onClick={() => navigate('/rounds')}>
            Back to Rounds
          </button>
        </div>
      </div>
    )
  }

  const isActive = status === 'ACTIVE'
  const isDisabled = !isActive || isTapping

  // Calculate display score (handle Никита role)
  // Use local values from hook, fallback to server values
  const displayScore = user?.role === 'NIKITA' ? 0 : localScore
  const displayTapCount = localTapCount

  // Status banner text
  const statusBanner =
    status === 'ACTIVE'
      ? 'Round Active!'
      : status === 'COOLDOWN'
        ? 'Cooldown'
        : 'Round Completed'

  return (
    <Layout
      title={statusBanner}
      footer={
        <Button variant="secondary" onClick={() => navigate('/rounds')}>
          Back to Rounds
        </Button>
      }
    >
      <div className="round-detail-page__content">
        <Goose onTap={handleTap} disabled={isDisabled} isAnimating={isTapping} />

        <RoundTimer
          status={status}
          timeUntilStart={timeUntilStart}
          timeRemaining={timeRemaining}
        />

        {isActive && (
          <div className="round-detail-page__score">
            <span>My Points - {displayScore}</span>
          </div>
        )}

        {tapError && (
          <div className="round-detail-page__tap-error" role="alert">
            {tapError}
          </div>
        )}

        {status === 'COMPLETED' && (
          <div className="round-detail-page__stats">
            <StatRow label="Total" value={round.totalPoints} />
            {round.winner && (
              <StatRow
                label={`Winner - ${round.winner.username}`}
                value={round.winner.score}
              />
            )}
            <StatRow
              label="My Points"
              value={user?.role === 'NIKITA' ? 0 : round.myStats?.score || 0}
            />
          </div>
        )}
      </div>
    </Layout>
  )
}

