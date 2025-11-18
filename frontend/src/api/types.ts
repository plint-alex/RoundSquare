export type UserRole = 'ADMIN' | 'SURVIVOR' | 'NIKITA'

export type RoundStatus = 'COOLDOWN' | 'ACTIVE' | 'COMPLETED'

export interface User {
  id: string
  username: string
  role: UserRole
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RoundListDto {
  id: string
  status: RoundStatus
  cooldownStartAt: string
  cooldownEndsAt: string
  startAt: string
  endAt: string
  totalPoints: number
  timeUntilStart: number | null
  timeRemaining: number | null
}

export interface RoundParticipantDto {
  userId: string
  username: string
  score: number
  tapCount: number
}

export interface RoundDetailDto extends RoundListDto {
  winner?: {
    userId: string
    username: string
    score: number
  }
  myStats?: {
    tapCount: number
    score: number
  }
  leaderboard?: RoundParticipantDto[]
}

export interface TapResultDto {
  tapCount: number
  score: number
}

export interface ErrorResponse {
  error: {
    code: string
    message: string
  }
}

export interface ApiError extends Error {
  code?: string
  status?: number
}

