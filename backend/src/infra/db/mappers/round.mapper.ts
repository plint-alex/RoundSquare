import { Round as PrismaRound, RoundStatus as PrismaRoundStatus } from '@prisma/client';
import { Round } from '@/domain/rounds/round.entity.js';
import { RoundStatus } from '@/domain/rounds/round-status.enum.js';

function mapPrismaStatusToDomain(status: PrismaRoundStatus): RoundStatus {
  switch (status) {
    case PrismaRoundStatus.COOLDOWN:
      return RoundStatus.COOLDOWN;
    case PrismaRoundStatus.ACTIVE:
      return RoundStatus.ACTIVE;
    case PrismaRoundStatus.COMPLETED:
      return RoundStatus.COMPLETED;
    default:
      throw new Error(`Unknown round status: ${status}`);
  }
}

export function mapPrismaRoundToDomain(prismaRound: PrismaRound): Round {
  return new Round(
    prismaRound.id,
    mapPrismaStatusToDomain(prismaRound.status),
    prismaRound.cooldownStartAt,
    prismaRound.startAt,
    prismaRound.endAt,
    prismaRound.totalPoints,
    prismaRound.createdById,
    prismaRound.createdAt,
    prismaRound.updatedAt
  );
}


