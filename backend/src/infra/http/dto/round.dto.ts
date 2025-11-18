import { Round } from '@/domain/rounds/round.entity.js';
import { RoundParticipant } from '@/domain/rounds/round-participant.entity.js';
import { User } from '@/domain/users/user.entity.js';

export interface RoundListDto {
  id: string;
  status: string;
  cooldownStartAt: string;
  cooldownEndsAt: string;
  startAt: string;
  endAt: string;
  totalPoints: number;
  timeUntilStart: number | null;
  timeRemaining: number | null;
}

export interface RoundDetailDto extends RoundListDto {
  winner?: {
    userId: string;
    username: string;
    score: number;
  };
  myStats?: {
    tapCount: number;
    score: number;
  };
  leaderboard?: RoundParticipantDto[];
}

export interface RoundParticipantDto {
  userId: string;
  username: string;
  score: number;
  tapCount: number;
}

/**
 * Maps a Round domain entity to RoundListDto.
 */
export function mapRoundToListDto(round: Round, now: Date = new Date()): RoundListDto {
  return {
    id: round.id,
    status: round.computeStatus(now),
    cooldownStartAt: round.cooldownStartAt.toISOString(),
    cooldownEndsAt: round.startAt.toISOString(), // Cooldown ends when round starts
    startAt: round.startAt.toISOString(),
    endAt: round.endAt.toISOString(),
    totalPoints: round.totalPoints,
    timeUntilStart: round.getTimeUntilStart(now),
    timeRemaining: round.getTimeRemaining(now),
  };
}

/**
 * Maps a RoundParticipant to RoundParticipantDto.
 */
export function mapParticipantToDto(
  participant: RoundParticipant,
  username: string
): RoundParticipantDto {
  return {
    userId: participant.userId,
    username,
    score: participant.score,
    tapCount: participant.tapCount,
  };
}

/**
 * Maps a Round domain entity to RoundDetailDto.
 * Optionally includes winner information, personal stats, and leaderboard.
 */
export function mapRoundToDetailDto(
  round: Round,
  options: {
    winner?: { userId: string; username: string; score: number };
    currentUserParticipant?: RoundParticipant;
    currentUser?: User;
    leaderboardParticipants?: Array<{ participant: RoundParticipant; username: string }>;
    now?: Date;
  } = {}
): RoundDetailDto {
  const {
    winner,
    currentUserParticipant,
    currentUser,
    leaderboardParticipants,
    now = new Date(),
  } = options;

  const baseDto = mapRoundToListDto(round, now);

  // Map personal stats with Никита rule
  let myStats: { tapCount: number; score: number } | undefined;
  if (currentUserParticipant) {
    const score = currentUser?.isNikita() ? 0 : currentUserParticipant.score;
    myStats = {
      tapCount: currentUserParticipant.tapCount,
      score,
    };
  }

  // Map leaderboard
  const leaderboard = leaderboardParticipants?.map(({ participant, username }) =>
    mapParticipantToDto(participant, username)
  );

  return {
    ...baseDto,
    winner: winner
      ? {
          userId: winner.userId,
          username: winner.username,
          score: winner.score,
        }
      : undefined,
    myStats,
    leaderboard,
  };
}

