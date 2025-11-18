import { QueryClient } from '@tanstack/react-query'

/**
 * Query client configuration for React Query
 * - Default stale-time per endpoint type
 * - refetchOnWindowFocus: false (avoid unnecessary refetches)
 * - Error handling configuration
 * - Retry logic
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default stale time: 5 seconds (data considered fresh for 5s)
      staleTime: 5 * 1000,
      // Don't refetch on window focus (avoid unnecessary requests)
      refetchOnWindowFocus: false,
      // Retry failed requests up to 2 times
      retry: 2,
      // Retry delay increases exponentially (1s, 2s, 4s)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Keep failed queries in cache for 5 minutes
      gcTime: 5 * 60 * 1000,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      // Retry delay: 1 second
      retryDelay: 1000,
    },
  },
})


