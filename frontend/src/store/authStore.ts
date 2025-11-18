import { create } from 'zustand'
import type { User } from '@/api/types'
import { logout as logoutApi } from '@/api/auth'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => Promise<void>
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user: User) => {
    set({ user, isAuthenticated: true })
    // Optionally persist to localStorage for refresh
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('user', JSON.stringify(user))
      } catch {
        // Ignore localStorage errors
      }
    }
  },
  logout: async () => {
    try {
      // Call backend to clear httpOnly cookie
      await logoutApi()
    } catch {
      // Even if API call fails, clear local state
      // Silently fail - user will be logged out locally anyway
    }
    // Clear local state and localStorage
    set({ user: null, isAuthenticated: false })
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('user')
      } catch {
        // Ignore localStorage errors
      }
    }
  },
  setUser: (user: User | null) => {
    set({ user, isAuthenticated: user !== null })
  },
}))

// Initialize from localStorage on mount
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('user')
    if (stored) {
      const user = JSON.parse(stored) as User
      useAuthStore.getState().setUser(user)
    }
  } catch {
    // Ignore localStorage errors
  }
}


