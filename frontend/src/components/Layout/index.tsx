import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/Button'
import './Layout.css'

interface LayoutProps {
  title?: string
  children: ReactNode
  footer?: ReactNode
  headerActions?: ReactNode
  className?: string
}

/**
 * Global layout component providing consistent structure across all pages.
 * Includes header with title and user info, flexible content area, and optional footer.
 */
export function Layout({ title, children, footer, headerActions, className = '' }: LayoutProps) {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className={`layout ${className}`}>
      {(title || user || headerActions) && (
        <header className="layout__header">
          {title && <h1 className="layout__title">{title}</h1>}
          <div className="layout__header-right">
            {headerActions}
            {user && (
              <>
                <div className="layout__user" aria-label={`Logged in as ${user.username}`}>
                  <span className="layout__username">{user.username}</span>
                </div>
                <Button variant="secondary" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            )}
          </div>
        </header>
      )}
      <main className="layout__content">{children}</main>
      {footer && <footer className="layout__footer">{footer}</footer>}
    </div>
  )
}

