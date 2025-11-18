import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { ReactNode } from 'react'

interface AdminProtectedRouteProps {
  children: ReactNode
}

/**
 * Protected route component that ensures only ADMIN users can access the route.
 * Non-admin users are redirected to /rounds.
 */
export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Redirect to rounds if not admin
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/rounds" replace />
  }

  return <>{children}</>
}

