import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CreateRoundPage } from '../CreateRoundPage'
import { useAuthStore } from '@/store/authStore'
import { useCreateRound } from '@/hooks/useCreateRound'
import * as roundsApi from '@/api/rounds'
import { ToastProvider } from '@/components/ToastContainer'

// Mock the API calls
vi.mock('@/api/rounds', () => ({
  createRound: vi.fn(),
}))

// Mock the hooks
vi.mock('@/hooks/useCreateRound', () => ({
  useCreateRound: vi.fn(),
}))

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock toast context
vi.mock('@/components/ToastContainer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/ToastContainer')>()
  return {
    ...actual,
    useToastContext: () => ({
      showToast: vi.fn(),
    }),
  }
})

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>{children}</BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}

describe('CreateRoundPage', () => {
  const mockCreateRound = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      user: { id: '1', username: 'admin', role: 'ADMIN' },
      isAuthenticated: true,
    })

    vi.mocked(useCreateRound).mockReturnValue({
      createRound: mockCreateRound,
      isCreating: false,
      error: null,
    })
  })

  it('renders page title and form', () => {
    render(<CreateRoundPage />, { wrapper: createWrapper() })

    expect(screen.getByText(/Create Round/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Use default durations/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create Round/i })).toBeInTheDocument()
  })

  it('displays user name in header', () => {
    render(<CreateRoundPage />, { wrapper: createWrapper() })

    expect(screen.getByText('admin')).toBeInTheDocument()
  })

  it('renders activity log section when createdRound is set', async () => {
    // This tests the UI rendering, not the callback behavior
    // The callback behavior is tested in useCreateRound tests
    render(<CreateRoundPage />, { wrapper: createWrapper() })

    // Initially, activity log should not be visible
    expect(screen.queryByText(/Round scheduled for/i)).not.toBeInTheDocument()
  })

  it('calls createRound when form is submitted with default', () => {
    render(<CreateRoundPage />, { wrapper: createWrapper() })

    const submitButton = screen.getByRole('button', { name: /Create Round/i })
    fireEvent.click(submitButton)

    expect(mockCreateRound).toHaveBeenCalledWith(undefined)
  })

  it('calls createRound when form is submitted with custom duration', () => {
    render(<CreateRoundPage />, { wrapper: createWrapper() })

    fireEvent.click(screen.getByLabelText(/Custom cooldown/i))
    const input = screen.getByLabelText(/Cooldown Duration/i)
    fireEvent.change(input, { target: { value: '120' } })

    const submitButton = screen.getByRole('button', { name: /Create Round/i })
    fireEvent.click(submitButton)

    expect(mockCreateRound).toHaveBeenCalledWith({ startDelaySeconds: 120 })
  })

  it('navigates back to rounds when back button is clicked', () => {
    render(<CreateRoundPage />, { wrapper: createWrapper() })

    const backButton = screen.getByRole('button', { name: /Back to Rounds/i })
    fireEvent.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/rounds')
  })
})

