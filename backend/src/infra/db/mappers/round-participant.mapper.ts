import { RoundParticipant as PrismaRoundParticipant } from '@prisma/client';
import { RoundParticipant } from '@/domain/rounds/round-participant.entity.js';

export function mapPrismaRoundParticipantToDomain(
  prismaParticipant: PrismaRoundParticipant
): RoundParticipant {
  return new RoundParticipant(
    prismaParticipant.id,
    prismaParticipant.roundId,
    prismaParticipant.userId,
    prismaParticipant.tapCount,
    prismaParticipant.score,
    prismaParticipant.lastTappedAt,
    prismaParticipant.createdAt,
    prismaParticipant.updatedAt
  );
}


