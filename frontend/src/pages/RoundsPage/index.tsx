import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useRoundsQuery } from '@/hooks/useRoundsQuery'
import { groupRoundsByStatus } from '@/utils/roundsGrouping'
import { Layout } from '@/components/Layout'
import { RoundCard } from '@/components/RoundCard'
import { Button } from '@/components/Button'
import './RoundsPage.css'

export function RoundsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { data: rounds = [], isLoading: loading, error, refetch } = useRoundsQuery()
  const grouped = groupRoundsByStatus(rounds)

  const handleCreateRound = () => {
    // Navigate to create round page (to be implemented in F05)
    // For now, placeholder - could navigate to a new route
    navigate('/rounds/new')
  }

  if (loading && rounds.length === 0) {
    return (
      <Layout title="Rounds">
        <div className="rounds-page__loading">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounds-page__skeleton">
              <div className="rounds-page__skeleton-accent" />
              <div className="rounds-page__skeleton-content">
                <div className="rounds-page__skeleton-line" style={{ width: '60%' }} />
                <div className="rounds-page__skeleton-line" style={{ width: '80%' }} />
                <div className="rounds-page__skeleton-line" style={{ width: '70%' }} />
              </div>
            </div>
          ))}
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Rounds">
        <div className="rounds-page__error">
          <p>{error?.message || 'Failed to load rounds'}</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </Layout>
    )
  }

  const hasAnyRounds = grouped.active.length > 0 || grouped.cooldown.length > 0 || grouped.completed.length > 0

  return (
    <Layout
      title="Rounds"
      headerActions={
        user?.role === 'ADMIN' ? (
          <Button variant="primary" onClick={handleCreateRound}>
            Create Round
          </Button>
        ) : undefined
      }
      footer={
        <Button variant="secondary" onClick={() => refetch()} disabled={loading} isLoading={loading}>
          Refresh
        </Button>
      }
    >
      {!hasAnyRounds ? (
        <div className="rounds-page__empty">
          <p>No rounds available</p>
          {user?.role === 'ADMIN' && (
            <p className="rounds-page__empty-hint">Create a round to get started</p>
          )}
        </div>
      ) : (
        <div className="rounds-page__content">
          {grouped.active.length > 0 && (
            <section className="rounds-page__section">
              <h2 className="rounds-page__section-title">Active Rounds</h2>
              <div className="rounds-page__cards">
                {grouped.active.map((round) => (
                  <RoundCard key={round.id} round={round} />
                ))}
              </div>
            </section>
          )}

          {grouped.cooldown.length > 0 && (
            <section className="rounds-page__section">
              <h2 className="rounds-page__section-title">Upcoming (Cooldown)</h2>
              <div className="rounds-page__cards">
                {grouped.cooldown.map((round) => (
                  <RoundCard key={round.id} round={round} />
                ))}
              </div>
            </section>
          )}

          {grouped.completed.length > 0 && (
            <section className="rounds-page__section">
              <h2 className="rounds-page__section-title">Completed</h2>
              <div className="rounds-page__cards">
                {grouped.completed.map((round) => (
                  <RoundCard key={round.id} round={round} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </Layout>
  )
}

