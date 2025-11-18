import { createContext, useContext, ReactNode } from 'react'
import { useToast } from '@/hooks/useToast'
import { Toast } from './Toast'
import './ToastContainer.css'

interface ToastContextValue {
  showToast: (message: string, type?: 'error' | 'info') => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function useToastContext() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const { toasts, showToast, dismissToast } = useToast()

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}


