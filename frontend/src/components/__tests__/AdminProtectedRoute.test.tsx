import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AdminProtectedRoute } from '@/components/AdminProtectedRoute'
import { useAuthStore } from '@/store/authStore'

describe('AdminProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: null, isAuthenticated: false })
  })

  it('redirects to /login if not authenticated', () => {
    const { container } = render(
      <MemoryRouter>
        <AdminProtectedRoute>
          <div>Protected Content</div>
        </AdminProtectedRoute>
      </MemoryRouter>
    )

    // Navigate component doesn't render children, just redirects
    // We can check that the protected content is not visible
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('redirects to /rounds if user is not admin', () => {
    useAuthStore.setState({
      user: { id: '1', username: 'user', role: 'SURVIVOR' },
      isAuthenticated: true,
    })

    render(
      <MemoryRouter initialEntries={['/rounds/new']}>
        <AdminProtectedRoute>
          <div>Protected Content</div>
        </AdminProtectedRoute>
      </MemoryRouter>
    )

    // Protected content should not be visible (redirected)
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children if user is admin', () => {
    useAuthStore.setState({
      user: { id: '1', username: 'admin', role: 'ADMIN' },
      isAuthenticated: true,
    })

    render(
      <MemoryRouter>
        <AdminProtectedRoute>
          <div>Protected Content</div>
        </AdminProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects to /rounds if user role is NIKITA', () => {
    useAuthStore.setState({
      user: { id: '1', username: 'nikita', role: 'NIKITA' },
      isAuthenticated: true,
    })

    render(
      <MemoryRouter initialEntries={['/rounds/new']}>
        <AdminProtectedRoute>
          <div>Protected Content</div>
        </AdminProtectedRoute>
      </MemoryRouter>
    )

    // Protected content should not be visible (redirected)
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })
})

