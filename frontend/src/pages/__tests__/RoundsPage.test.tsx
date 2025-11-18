import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RoundsPage } from '@/pages/RoundsPage'
import { useAuthStore } from '@/store/authStore'
import * as roundsQueryHook from '@/hooks/useRoundsQuery'
import { ToastProvider } from '@/components/ToastContainer'
import type { RoundListDto } from '@/api/types'

// Mock useRoundsQuery hook
vi.mock('@/hooks/useRoundsQuery', () => ({
  useRoundsQuery: vi.fn(),
}))

// Mock react-router-dom navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock RoundCard to simplify tests
vi.mock('@/components/RoundCard', () => ({
  RoundCard: ({ round }: { round: RoundListDto }) => (
    <div data-testid={`round-card-${round.id}`}>{round.id}</div>
  ),
}))

const mockActiveRound: RoundListDto = {
  id: 'active-round-id',
  status: 'ACTIVE',
  cooldownStartAt: '2025-05-18T06:27:47.000Z',
  cooldownEndsAt: '2025-05-18T06:28:17.000Z',
  startAt: '2025-05-18T06:28:17.000Z',
  endAt: '2025-05-18T06:29:17.000Z',
  totalPoints: 150,
  timeUntilStart: null,
  timeRemaining: 45000,
}

const mockCooldownRound: RoundListDto = {
  id: 'cooldown-round-id',
  status: 'COOLDOWN',
  cooldownStartAt: '2025-05-18T07:27:47.000Z',
  cooldownEndsAt: '2025-05-18T07:28:17.000Z',
  startAt: '2025-05-18T07:28:17.000Z',
  endAt: '2025-05-18T08:29:17.000Z',
  totalPoints: 0,
  timeUntilStart: 30000,
  timeRemaining: null,
}

const mockCompletedRound: RoundListDto = {
  id: 'completed-round-id',
  status: 'COMPLETED',
  cooldownStartAt: '2025-05-18T05:27:47.000Z',
  cooldownEndsAt: '2025-05-18T05:28:17.000Z',
  startAt: '2025-05-18T05:28:17.000Z',
  endAt: '2025-05-18T05:29:17.000Z',
  totalPoints: 500,
  timeUntilStart: null,
  timeRemaining: null,
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const createWrapper = () => {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>{children}</BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    )
  }
}

describe('RoundsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: null, isAuthenticated: false })
    queryClient.clear()
    vi.clearAllTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const renderRoundsPage = () => {
    return render(<RoundsPage />, { wrapper: createWrapper() })
  }

  it('should render loading state with skeletons', () => {
    vi.mocked(roundsQueryHook.useRoundsQuery).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any)

    renderRoundsPage()

    expect(screen.getByText('Rounds')).toBeInTheDocument()
    // Should show skeleton loaders
    expect(document.querySelectorAll('.rounds-page__skeleton').length).toBeGreaterThan(0)
  })

  it('should display user name in header', () => {
    useAuthStore.setState({
      user: { id: '1', username: 'testuser', role: 'SURVIVOR' },
      isAuthenticated: true,
    })

    vi.mocked(roundsQueryHook.useRoundsQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    renderRoundsPage()

    expect(screen.getByText('testuser')).toBeInTheDocument()
  })

  it('should show admin button only for ADMIN role', () => {
    useAuthStore.setState({
      user: { id: '1', username: 'admin', role: 'ADMIN' },
      isAuthenticated: true,
    })

    vi.mocked(roundsQueryHook.useRoundsQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    renderRoundsPage()

    expect(screen.getByText('Create Round')).toBeInTheDocument()
  })

  it('should hide admin button for non-admin users', () => {
    useAuthStore.setState({
      user: { id: '1', username: 'user', role: 'SURVIVOR' },
      isAuthenticated: true,
    })

    vi.mocked(roundsQueryHook.useRoundsQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    renderRoundsPage()

    expect(screen.queryByText('Create Round')).not.toBeInTheDocument()
  })

  it('should navigate to create round page when admin button clicked', async () => {
    const user = userEvent.setup({ delay: null })
    useAuthStore.setState({
      user: { id: '1', username: 'admin', role: 'ADMIN' },
      isAuthenticated: true,
    })

    vi.mocked(roundsQueryHook.useRoundsQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    renderRoundsPage()

    const createBtn = screen.getByText('Create Round')
    await user.click(createBtn)

    expect(mockNavigate).toHaveBeenCalledWith('/rounds/new')
  })

  it('should display rounds grouped by status', () => {
    useAuthStore.setState({
      user: { id: '1', username: 'user', role: 'SURVIVOR' },
      isAuthenticated: true,
    })

    vi.mocked(roundsQueryHook.useRoundsQuery).mockReturnValue({
      data: [mockActiveRound, mockCooldownRound, mockCompletedRound],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    renderRoundsPage()

    expect(screen.getByText('Active Rounds')).toBeInTheDocument()
    expect(screen.getByText('Upcoming (Cooldown)')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()

    expect(screen.getByTestId('round-card-active-round-id')).toBeInTheDocument()
    expect(screen.getByTestId('round-card-cooldown-round-id')).toBeInTheDocument()
    expect(screen.getByTestId('round-card-completed-round-id')).toBeInTheDocument()
  })

  it('should display empty state when no rounds', () => {
    useAuthStore.setState({
      user: { id: '1', username: 'user', role: 'SURVIVOR' },
      isAuthenticated: true,
    })

    vi.mocked(roundsQueryHook.useRoundsQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    renderRoundsPage()

    expect(screen.getByText('No rounds available')).toBeInTheDocument()
  })

  it('should display error message on error', () => {
    vi.mocked(roundsQueryHook.useRoundsQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: { message: 'Failed to load rounds' } as Error,
      refetch: vi.fn(),
    } as any)

    renderRoundsPage()

    expect(screen.getByText('Failed to load rounds')).toBeInTheDocument()
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('should call refetch when retry button clicked', async () => {
    const user = userEvent.setup({ delay: null })
    const mockRefetch = vi.fn()

    vi.mocked(roundsQueryHook.useRoundsQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: { message: 'Failed to load rounds' } as Error,
      refetch: mockRefetch,
    } as any)

    renderRoundsPage()

    const retryBtn = screen.getByText('Retry')
    await user.click(retryBtn)

    expect(mockRefetch).toHaveBeenCalled()
  })

})
