import type { Toast as ToastType } from '@/hooks/useToast'
import './Toast.css'

interface ToastProps {
  toast: ToastType
  onDismiss: (id: string) => void
}

export function Toast({ toast, onDismiss }: ToastProps) {
  return (
    <div
      className={`toast toast--${toast.type}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="toast__content">
        <span className="toast__message">{toast.message}</span>
      </div>
      <button
        className="toast__close"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}

