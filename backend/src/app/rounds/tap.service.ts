import { v4 as uuidv4 } from 'uuid';
import { getPrismaClient } from '@/infra/db/client.js';
import { RoundRepository } from '@/domain/repositories/round.repository.js';
import { RoundNotActiveError } from '@/shared/errors/round.errors.js';
import { RoundStatus } from '@/domain/rounds/round-status.enum.js';
import { RoundParticipant } from '@/domain/rounds/round-participant.entity.js';
import { mapPrismaRoundParticipantToDomain } from '@/infra/db/mappers/round-participant.mapper.js';
import { TapResultDto } from './dto/tap-result.dto.js';

export class TapService {
  constructor(private readonly roundRepository: RoundRepository) {}

  async updateTapCount(
    roundId: string,
    userId: string,
    tapCount: number,
    score: number
  ): Promise<TapResultDto> {
    const prisma = getPrismaClient();

    // Use transaction for atomicity - all operations must succeed or rollback
    return prisma.$transaction(async (tx: any) => {
      // Get round and validate it exists and is active
      const round = await this.roundRepository.findById(roundId);
      if (!round) {
        throw new Error('Round not found');
      }

      const now = new Date();
      const computedStatus = round.computeStatus(now);
      if (computedStatus !== RoundStatus.ACTIVE) {
        throw new RoundNotActiveError(`Round is not active. Current status: ${computedStatus}`);
      }

      // Find existing participant within transaction
      const existingParticipantData = await tx.roundParticipant.findUnique({
        where: {
          roundId_userId: {
            roundId,
            userId,
          },
        },
      });

      const existingParticipant = existingParticipantData
        ? mapPrismaRoundParticipantToDomain(existingParticipantData)
        : null;

      // Validate tapCount is monotonic (can only increase)
      if (existingParticipant && tapCount < existingParticipant.tapCount) {
        throw new Error(
          `Tap count cannot decrease. Current: ${existingParticipant.tapCount}, provided: ${tapCount}`
        );
      }

      // Calculate score difference for round totalPoints increment
      const oldScore = existingParticipant?.score || 0;
      const pointsAdded = score - oldScore;

      let newParticipant: RoundParticipant;

      if (existingParticipant) {
        newParticipant = existingParticipant.setTapCount(tapCount, score);
      } else {
        // Create new participant
        const participant = RoundParticipant.create(uuidv4(), roundId, userId);
        newParticipant = participant.setTapCount(tapCount, score);
      }

      // Use upsert within transaction to atomically update participant
      await tx.roundParticipant.upsert({
        where: {
          roundId_userId: {
            roundId,
            userId,
          },
        },
        create: {
          id: newParticipant.id,
          roundId: newParticipant.roundId,
          userId: newParticipant.userId,
          tapCount: newParticipant.tapCount,
          score: newParticipant.score,
          lastTappedAt: newParticipant.lastTappedAt,
        },
        update: {
          tapCount: newParticipant.tapCount,
          score: newParticipant.score,
          lastTappedAt: newParticipant.lastTappedAt,
        },
      });

      // Atomically increment round total_points within transaction
      if (pointsAdded > 0) {
        await tx.round.update({
          where: { id: roundId },
          data: {
            totalPoints: {
              increment: pointsAdded,
            },
          },
        });
      }

      return {
        tapCount: newParticipant.tapCount,
        score: newParticipant.score,
      };
    });
  }
}

