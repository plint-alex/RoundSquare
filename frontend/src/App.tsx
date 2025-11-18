import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ToastProvider } from '@/components/ToastContainer'
import { LoginPage } from '@/pages/LoginPage'
import { RoundsPage } from '@/pages/RoundsPage'
import { RoundDetailPage } from '@/pages/RoundDetailPage'
import { CreateRoundPage } from '@/pages/CreateRoundPage'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminProtectedRoute } from '@/components/AdminProtectedRoute'

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/rounds" replace /> : <LoginPage />
            }
          />
          <Route
            path="/rounds"
            element={
              <ProtectedRoute>
                <RoundsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rounds/new"
            element={
              <AdminProtectedRoute>
                <CreateRoundPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/rounds/:id"
            element={
              <ProtectedRoute>
                <RoundDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/rounds" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
