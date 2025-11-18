import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useCreateRound } from '@/hooks/useCreateRound'
import { Layout } from '@/components/Layout'
import { Card } from '@/components/Card'
import { CreateRoundForm } from '@/components/CreateRoundForm'
import { Button } from '@/components/Button'
import { useToastContext } from '@/components/ToastContainer'
import { formatTime } from '@/utils/dateFormat'
import type { RoundListDto } from '@/api/types'
import './CreateRoundPage.css'

export function CreateRoundPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { showToast } = useToastContext()
  const [createdRound, setCreatedRound] = useState<RoundListDto | null>(null)

  const handleSuccess = useCallback(
    (round: RoundListDto) => {
      setCreatedRound(round)
      const startTime = formatTime(round.startAt)
      showToast(`Round scheduled for ${startTime}`, 'info')

      // Redirect to round detail page after a short delay
      setTimeout(() => {
        navigate(`/rounds/${round.id}`)
      }, 1000)
    },
    [navigate, showToast]
  )

  const { createRound, isCreating, error } = useCreateRound(handleSuccess)

  const handleFormSubmit = useCallback(
    (data?: { startDelaySeconds?: number }) => {
      createRound(data)
    },
    [createRound]
  )

  return (
    <Layout
      title="Create Round"
      footer={
        <Button variant="secondary" onClick={() => navigate('/rounds')} disabled={isCreating}>
          Back to Rounds
        </Button>
      }
    >
      <div className="create-round-page__content">
        <div className="create-round-page__card">
          <CreateRoundForm onSubmit={handleFormSubmit} isCreating={isCreating} error={error} />
        </div>

        {createdRound && (
          <div className="create-round-page__activity-log">
            <Card
              accentColor="var(--color-status-cooldown)"
              header={
                <p className="create-round-page__activity-message">
                  Round scheduled for{' '}
                  <span className="create-round-page__activity-time">
                    {formatTime(createdRound.startAt)}
                  </span>
                </p>
              }
              footer={
                <p className="create-round-page__activity-details">ID: {createdRound.id}</p>
              }
            />
          </div>
        )}
      </div>
    </Layout>
  )
}

