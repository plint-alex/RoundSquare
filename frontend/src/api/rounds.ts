import { apiRequest } from './client'
import type { RoundListDto, RoundDetailDto, TapResultDto } from './types'

export async function getRounds(status?: string): Promise<RoundListDto[]> {
  const endpoint = status
    ? `/api/rounds?status=${encodeURIComponent(status)}`
    : '/api/rounds'
  return apiRequest<RoundListDto[]>(endpoint, {
    method: 'GET',
  })
}

export async function getRoundById(id: string, limit?: number): Promise<RoundDetailDto> {
  const endpoint = limit
    ? `/api/rounds/${encodeURIComponent(id)}?limit=${limit}`
    : `/api/rounds/${encodeURIComponent(id)}`
  return apiRequest<RoundDetailDto>(endpoint, {
    method: 'GET',
  })
}

export async function tapRound(
  roundId: string,
  tapCount: number,
  score: number
): Promise<TapResultDto> {
  return apiRequest<TapResultDto>(`/api/rounds/${encodeURIComponent(roundId)}/tap`, {
    method: 'POST',
    body: JSON.stringify({ tapCount, score }),
  })
}

export interface CreateRoundRequest {
  startDelaySeconds?: number
}

export async function createRound(data?: CreateRoundRequest): Promise<RoundListDto> {
  return apiRequest<RoundListDto>('/api/rounds', {
    method: 'POST',
    body: JSON.stringify(data || {}),
  })
}

