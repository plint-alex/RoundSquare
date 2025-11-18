import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { LoginForm } from '@/components/LoginForm'
import { useAuthStore } from '@/store/authStore'
import * as authApi from '@/api/auth'

// Mock the API module
vi.mock('@/api/auth', () => ({
  login: vi.fn(),
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

describe('LoginForm', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({ user: null, isAuthenticated: false })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderLoginForm = () => {
    return render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    )
  }

  it('should disable submit button when fields are empty', () => {
    renderLoginForm()

    const submitButton = screen.getByRole('button', { name: /log in/i })
    expect(submitButton).toBeDisabled()
  })

  it('should enable submit button when both fields are filled', async () => {
    const user = userEvent.setup()
    renderLoginForm()

    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /log in/i })

    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'password123')

    expect(submitButton).not.toBeDisabled()
  })

  it('should disable submit button when only one field is filled', async () => {
    const user = userEvent.setup()
    renderLoginForm()

    const usernameInput = screen.getByLabelText(/username/i)
    const submitButton = screen.getByRole('button', { name: /log in/i })

    await user.type(usernameInput, 'testuser')

    expect(submitButton).toBeDisabled()
  })

  it('should display error message on login failure', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.mocked(authApi.login)
    mockLogin.mockRejectedValueOnce({
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid username or password',
      status: 400,
    })

    renderLoginForm()

    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /log in/i })

    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid username or password')
    })

    // Form inputs should still be filled
    expect(usernameInput).toHaveValue('testuser')
    expect(passwordInput).toHaveValue('wrongpassword')
  })

  it('should update auth store and navigate on successful login', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.mocked(authApi.login)
    const mockUser = {
      id: '1',
      username: 'testuser',
      role: 'SURVIVOR' as const,
    }
    mockLogin.mockResolvedValueOnce(mockUser)

    renderLoginForm()

    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /log in/i })

    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123')
      expect(useAuthStore.getState().user).toEqual(mockUser)
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
      expect(mockNavigate).toHaveBeenCalledWith('/rounds')
    })
  })

  it('should show loading state during login', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.mocked(authApi.login)
    // Delay the promise resolution
    let resolveLogin: (value: any) => void
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve
    })
    mockLogin.mockReturnValueOnce(loginPromise)

    renderLoginForm()

    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /log in/i })

    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // Button should show loading state
    expect(submitButton).toHaveAttribute('aria-busy', 'true')
    expect(submitButton).toBeDisabled()
    // Button text remains "Log in" but becomes transparent with spinner overlay

    // Resolve the promise
    resolveLogin!({
      id: '1',
      username: 'testuser',
      role: 'SURVIVOR',
    })

    await waitFor(() => {
      expect(submitButton).not.toHaveAttribute('aria-busy', 'true')
    })
  })

  it('should trim username and password before submitting', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.mocked(authApi.login)
    mockLogin.mockResolvedValueOnce({
      id: '1',
      username: 'testuser',
      role: 'SURVIVOR',
    })

    renderLoginForm()

    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /log in/i })

    await user.type(usernameInput, '  testuser  ')
    await user.type(passwordInput, '  password123  ')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123')
    })
  })
})


