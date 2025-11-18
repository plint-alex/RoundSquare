import { LoginForm } from '@/components/LoginForm'
import './LoginPage.css'

export function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-page__container">
        <h1 className="login-page__title">The Last of Guss</h1>
        <p className="login-page__subtitle">Sign in to continue</p>
        <LoginForm />
      </div>
    </div>
  )
}


