import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/Button'
import type { ApiError } from '@/api/types'
import './LoginForm.css'

export function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const loginUser = useAuthStore((state) => state.login)

  const isSubmitDisabled = !username.trim() || !password.trim() || isLoading

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const user = await login(username.trim(), password.trim())
      loginUser(user)
      navigate('/rounds')
    } catch (err) {
      const apiError = err as ApiError
      const errorMessage =
        apiError.code === 'INVALID_CREDENTIALS'
          ? apiError.message || 'Invalid username or password'
          : apiError.message || 'An error occurred. Please try again.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="login-form__field">
        <label htmlFor="username" className="login-form__label">
          Username
        </label>
        <input
          id="username"
          type="text"
          className="login-form__input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading}
          autoComplete="username"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'error-message' : undefined}
        />
      </div>

      <div className="login-form__field">
        <label htmlFor="password" className="login-form__label">
          Password
        </label>
        <input
          id="password"
          type="password"
          className="login-form__input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          autoComplete="current-password"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'error-message' : undefined}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        fullWidth
        isLoading={isLoading}
        disabled={isSubmitDisabled}
      >
        Log in
      </Button>

      {error && (
        <div id="error-message" className="login-form__error" role="alert">
          {error}
        </div>
      )}
    </form>
  )
}

