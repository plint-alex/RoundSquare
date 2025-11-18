import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RoundDetailPage } from '@/pages/RoundDetailPage'
import { useAuthStore } from '@/store/authStore'
import * as roundDetailQueryHook from '@/hooks/useRoundDetailQuery'
import * as roundTimerHook from '@/hooks/useRoundTimer'
import * as tapRoundHook from '@/hooks/useTapRound'
import { createTestWrapper } from '@/test-utils'
import type { RoundDetailDto } from '@/api/types'

// Mock hooks
vi.mock('@/hooks/useRoundDetailQuery', () => ({
  useRoundDetailQuery: vi.fn(),
}))

vi.mock('@/hooks/useRoundTimer', () => ({
  useRoundTimer: vi.fn(),
}))

vi.mock('@/hooks/useTapRound', () => ({
  useTapRound: vi.fn(),
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: 'test-round-id' }),
    useNavigate: () => mockNavigate,
  }
})

// Mock Goose component
vi.mock('@/components/Goose', () => ({
  Goose: ({ onTap, disabled }: { onTap: () => void; disabled: boolean }) => (
    <button onClick={onTap} disabled={disabled} data-testid="goose-button">
      Goose
    </button>
  ),
}))

// Mock RoundTimer component
vi.mock('@/components/RoundTimer', () => ({
  RoundTimer: ({ status }: { status: string }) => (
    <div data-testid="round-timer">Timer: {status}</div>
  ),
}))

const mockRound: RoundDetailDto = {
  id: 'test-round-id',
  status: 'ACTIVE',
  cooldownStartAt: '2025-05-18T10:04:00.000Z',
  cooldownEndsAt: '2025-05-18T10:05:00.000Z',
  startAt: '2025-05-18T10:05:00.000Z',
  endAt: '2025-05-18T10:10:00.000Z',
  totalPoints: 100,
  timeUntilStart: null,
  timeRemaining: 300000,
  myStats: {
    tapCount: 5,
    score: 10,
  },
}

describe('RoundDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: null, isAuthenticated: false })
    vi.clearAllTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const renderRoundDetailPage = () => {
    return render(<RoundDetailPage />, { wrapper: createTestWrapper() })
  }

  it('should render loading state', () => {
    vi.mocked(roundDetailQueryHook.useRoundDetailQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any)

    vi.mocked(roundTimerHook.useRoundTimer).mockReturnValue({
      timeUntilStart: null,
      timeRemaining: null,
      status: 'COOLDOWN',
    })

    vi.mocked(tapRoundHook.useTapRound).mockReturnValue({
      tap: vi.fn(),
      localTapCount: 0,
      localScore: 0,
      isTapping: false,
      error: null,
    })

    renderRoundDetailPage()

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should render error state when round not found', () => {
    vi.mocked(roundDetailQueryHook.useRoundDetailQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'Round not found' } as Error,
    } as any)

    vi.mocked(roundTimerHook.useRoundTimer).mockReturnValue({
      timeUntilStart: null,
      timeRemaining: null,
      status: 'COOLDOWN',
    })

    vi.mocked(tapRoundHook.useTapRound).mockReturnValue({
      tap: vi.fn(),
      localTapCount: 0,
      localScore: 0,
      isTapping: false,
      error: null,
    })

    renderRoundDetailPage()

    expect(screen.getByText('Round Not Found')).toBeInTheDocument()
    expect(screen.getByText('Round not found')).toBeInTheDocument()
  })

  it('should display round detail with ACTIVE status', () => {
    useAuthStore.setState({
      user: { id: '1', username: 'testuser', role: 'SURVIVOR' },
      isAuthenticated: true,
    })

    vi.mocked(roundDetailQueryHook.useRoundDetailQuery).mockReturnValue({
      data: mockRound,
      isLoading: false,
      error: null,
    } as any)

    vi.mocked(roundTimerHook.useRoundTimer).mockReturnValue({
      timeUntilStart: null,
      timeRemaining: 300000,
      status: 'ACTIVE',
    })

    vi.mocked(tapRoundHook.useTapRound).mockReturnValue({
      tap: vi.fn(),
      localTapCount: 5,
      localScore: 10,
      isTapping: false,
      error: null,
    })

    renderRoundDetailPage()

    expect(screen.getByText('Round Active!')).toBeInTheDocument()
    expect(screen.getByText('testuser')).toBeInTheDocument()
    expect(screen.getByTestId('goose-button')).not.toBeDisabled()
    expect(screen.getByText(/My Points - 10/)).toBeInTheDocument()
  })

  it('should show Никита role with 0 score', () => {
    useAuthStore.setState({
      user: { id: '1', username: 'nikita', role: 'NIKITA' },
      isAuthenticated: true,
    })

    vi.mocked(roundDetailQueryHook.useRoundDetailQuery).mockReturnValue({
      data: mockRound,
      isLoading: false,
      error: null,
    } as any)

    vi.mocked(roundTimerHook.useRoundTimer).mockReturnValue({
      timeUntilStart: null,
      timeRemaining: 300000,
      status: 'ACTIVE',
    })

    vi.mocked(tapRoundHook.useTapRound).mockReturnValue({
      tap: vi.fn(),
      localTapCount: 5,
      localScore: 0, // Никита always shows 0
      isTapping: false,
      error: null,
    })

    renderRoundDetailPage()

    expect(screen.getByText(/My Points - 0/)).toBeInTheDocument()
  })

  it('should disable goose when round is not ACTIVE', () => {
    vi.mocked(roundDetailQueryHook.useRoundDetailQuery).mockReturnValue({
      data: mockRound,
      isLoading: false,
      error: null,
    } as any)

    vi.mocked(roundTimerHook.useRoundTimer).mockReturnValue({
      timeUntilStart: 60000,
      timeRemaining: null,
      status: 'COOLDOWN',
    })

    vi.mocked(tapRoundHook.useTapRound).mockReturnValue({
      tap: vi.fn(),
      localTapCount: 0,
      localScore: 0,
      isTapping: false,
      error: null,
    })

    renderRoundDetailPage()

    expect(screen.getByText('Cooldown')).toBeInTheDocument()
    expect(screen.getByTestId('goose-button')).toBeDisabled()
  })

  it('should display stats when round is COMPLETED', () => {
    useAuthStore.setState({
      user: { id: '1', username: 'testuser', role: 'SURVIVOR' },
      isAuthenticated: true,
    })

    const completedRound: RoundDetailDto = {
      ...mockRound,
      status: 'COMPLETED',
      totalPoints: 500,
      winner: {
        userId: '2',
        username: 'winner',
        score: 250,
      },
      myStats: {
        tapCount: 10,
        score: 100,
      },
    }

    vi.mocked(roundDetailQueryHook.useRoundDetailQuery).mockReturnValue({
      data: completedRound,
      isLoading: false,
      error: null,
    } as any)

    vi.mocked(roundTimerHook.useRoundTimer).mockReturnValue({
      timeUntilStart: null,
      timeRemaining: null,
      status: 'COMPLETED',
    })

    vi.mocked(tapRoundHook.useTapRound).mockReturnValue({
      tap: vi.fn(),
      localTapCount: 10,
      localScore: 100,
      isTapping: false,
      error: null,
    })

    renderRoundDetailPage()

    expect(screen.getByText('Round Completed')).toBeInTheDocument()
    expect(screen.getByText('500')).toBeInTheDocument()
    expect(screen.getByText(/Winner - winner/)).toBeInTheDocument()
    expect(screen.getByText('250')).toBeInTheDocument()
    expect(screen.getByText(/My Points/)).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('should show Никита score as 0 in completed stats', () => {
    useAuthStore.setState({
      user: { id: '1', username: 'nikita', role: 'NIKITA' },
      isAuthenticated: true,
    })

    const completedRound: RoundDetailDto = {
      ...mockRound,
      status: 'COMPLETED',
      totalPoints: 500,
      myStats: {
        tapCount: 10,
        score: 100, // Actual score in backend, but should show 0
      },
    }

    vi.mocked(roundDetailQueryHook.useRoundDetailQuery).mockReturnValue({
      data: completedRound,
      isLoading: false,
      error: null,
    } as any)

    vi.mocked(roundTimerHook.useRoundTimer).mockReturnValue({
      timeUntilStart: null,
      timeRemaining: null,
      status: 'COMPLETED',
    })

    vi.mocked(tapRoundHook.useTapRound).mockReturnValue({
      tap: vi.fn(),
      localTapCount: 10,
      localScore: 0,
      isTapping: false,
      error: null,
    })

    renderRoundDetailPage()

    // Should show 0 for Никита in stats
    const myPointsLabels = screen.getAllByText(/My Points/)
    expect(myPointsLabels.length).toBeGreaterThan(0)
    // The component should show 0 for Никита role
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('should handle tap interaction', async () => {
    const user = userEvent.setup({ delay: null })
    const mockTap = vi.fn()

    useAuthStore.setState({
      user: { id: '1', username: 'testuser', role: 'SURVIVOR' },
      isAuthenticated: true,
    })

    vi.mocked(roundDetailQueryHook.useRoundDetailQuery).mockReturnValue({
      data: mockRound,
      isLoading: false,
      error: null,
    } as any)

    vi.mocked(roundTimerHook.useRoundTimer).mockReturnValue({
      timeUntilStart: null,
      timeRemaining: 300000,
      status: 'ACTIVE',
    })

    vi.mocked(tapRoundHook.useTapRound).mockReturnValue({
      tap: mockTap,
      localTapCount: 5,
      localScore: 10,
      isTapping: false,
      error: null,
    })

    renderRoundDetailPage()

    const gooseButton = screen.getByTestId('goose-button')
    await user.click(gooseButton)

    expect(mockTap).toHaveBeenCalled()
  })

  it('should disable goose when isTapping', () => {
    vi.mocked(roundDetailQueryHook.useRoundDetailQuery).mockReturnValue({
      data: mockRound,
      isLoading: false,
      error: null,
    } as any)

    vi.mocked(roundTimerHook.useRoundTimer).mockReturnValue({
      timeUntilStart: null,
      timeRemaining: 300000,
      status: 'ACTIVE',
    })

    vi.mocked(tapRoundHook.useTapRound).mockReturnValue({
      tap: vi.fn(),
      localTapCount: 5,
      localScore: 10,
      isTapping: true,
      error: null,
    })

    renderRoundDetailPage()

    expect(screen.getByTestId('goose-button')).toBeDisabled()
  })

  it('should display tap error', () => {
    vi.mocked(roundDetailQueryHook.useRoundDetailQuery).mockReturnValue({
      data: mockRound,
      isLoading: false,
      error: null,
    } as any)

    vi.mocked(roundTimerHook.useRoundTimer).mockReturnValue({
      timeUntilStart: null,
      timeRemaining: 300000,
      status: 'ACTIVE',
    })

    vi.mocked(tapRoundHook.useTapRound).mockReturnValue({
      tap: vi.fn(),
      localTapCount: 5,
      localScore: 10,
      isTapping: false,
      error: 'Round is not active',
    })

    renderRoundDetailPage()

    expect(screen.getByText('Round is not active')).toBeInTheDocument()
  })

  it('should navigate to rounds list on back button click', async () => {
    const user = userEvent.setup({ delay: null })

    vi.mocked(roundDetailQueryHook.useRoundDetailQuery).mockReturnValue({
      data: mockRound,
      isLoading: false,
      error: null,
    } as any)

    vi.mocked(roundTimerHook.useRoundTimer).mockReturnValue({
      timeUntilStart: null,
      timeRemaining: 300000,
      status: 'ACTIVE',
    })

    vi.mocked(tapRoundHook.useTapRound).mockReturnValue({
      tap: vi.fn(),
      localTapCount: 5,
      localScore: 10,
      isTapping: false,
      error: null,
    })

    renderRoundDetailPage()

    const backButton = screen.getByText('Back to Rounds')
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/rounds')
  })
})
