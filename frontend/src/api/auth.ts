import { apiRequest } from './client'
import type { User, LoginRequest } from './types'

export async function login(username: string, password: string): Promise<User> {
  const body: LoginRequest = { username, password }
  return apiRequest<User>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function getMe(): Promise<User> {
  return apiRequest<User>('/api/auth/me', {
    method: 'GET',
  })
}

export async function logout(): Promise<void> {
  await apiRequest<{ message: string }>('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  })
}


