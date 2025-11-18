import { useAuthStore } from '@/store/authStore'

/**
 * Convenience hook for accessing auth store
 */
export function useAuth() {
  const { user, isAuthenticated, login, logout, setUser } = useAuthStore()
  return { user, isAuthenticated, login, logout, setUser }
}


