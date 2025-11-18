import type { ErrorResponse, ApiError } from './types'

// Use relative URLs when VITE_API_BASE_URL is not set (proxy mode)
// Otherwise use the configured API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: ErrorResponse
    try {
      errorData = await response.json()
    } catch {
      throw new Error(`Request failed with status ${response.status}`)
    }

    const error: ApiError = new Error(errorData.error.message || 'An error occurred')
    error.code = errorData.error.code
    error.status = response.status
    throw error
  }

  return response.json()
}

export interface ApiRequestOptions extends RequestInit {
  /**
   * AbortSignal for request cancellation.
   * Used by React Query to cancel requests when component unmounts or query key changes.
   */
  signal?: AbortSignal
}

/**
 * API client wrapper around fetch with:
 * - Cookie-based authentication (credentials: 'include')
 * - TypeScript typed responses
 * - Error handling and parsing
 * - AbortController support for request cancellation
 *
 * @param endpoint - API endpoint (e.g., '/api/rounds')
 * @param options - Fetch options including signal for cancellation
 * @returns Promise with typed response data
 * @throws ApiError with code, status, and message for API errors
 * @throws Error for network failures
 */
export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for session-based auth
    // signal is passed through for AbortController support
  }

  try {
    const response = await fetch(url, config)
    return handleResponse<T>(response)
  } catch (error) {
    // If request was aborted, re-throw as-is (React Query handles this)
    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }
    // If it's already an ApiError, re-throw as-is
    if (error instanceof Error && 'code' in error) {
      throw error
    }
    // Network or other errors
    throw new Error('Network error: Failed to connect to the server')
  }
}

