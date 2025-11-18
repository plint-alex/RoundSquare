import { getPrismaClient } from '../client.js';
import { RoundParticipantRepository } from '@/domain/repositories/round-participant.repository.js';
import { RoundParticipant } from '@/domain/rounds/round-participant.entity.js';
import { mapPrismaRoundParticipantToDomain } from '../mappers/round-participant.mapper.js';

export class PrismaRoundParticipantRepository implements RoundParticipantRepository {
  async findById(id: string): Promise<RoundParticipant | null> {
    const prisma = getPrismaClient();
    const participant = await prisma.roundParticipant.findUnique({ where: { id } });
    return participant ? mapPrismaRoundParticipantToDomain(participant) : null;
  }

  async findByRoundId(roundId: string): Promise<RoundParticipant[]> {
    const prisma = getPrismaClient();
    const participants = await prisma.roundParticipant.findMany({
      where: { roundId },
      orderBy: { score: 'desc' },
    });
    return participants.map(mapPrismaRoundParticipantToDomain);
  }

  async findByUserId(userId: string): Promise<RoundParticipant[]> {
    const prisma = getPrismaClient();
    const participants = await prisma.roundParticipant.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return participants.map(mapPrismaRoundParticipantToDomain);
  }

  async findByRoundAndUser(roundId: string, userId: string): Promise<RoundParticipant | null> {
    const prisma = getPrismaClient();
    const participant = await prisma.roundParticipant.findUnique({
      where: {
        roundId_userId: {
          roundId,
          userId,
        },
      },
    });
    return participant ? mapPrismaRoundParticipantToDomain(participant) : null;
  }

  async findTopByRoundId(
    roundId: string,
    limit: number
  ): Promise<Array<{ participant: RoundParticipant; username: string }>> {
    const prisma = getPrismaClient();
    const participants = await prisma.roundParticipant.findMany({
      where: { roundId },
      orderBy: { score: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    return participants.map((p) => ({
      participant: mapPrismaRoundParticipantToDomain(p),
      username: p.user.username,
    }));
  }

  async create(participant: RoundParticipant): Promise<RoundParticipant> {
    const prisma = getPrismaClient();
    const created = await prisma.roundParticipant.create({
      data: {
        id: participant.id,
        roundId: participant.roundId,
        userId: participant.userId,
        tapCount: participant.tapCount,
        score: participant.score,
        lastTappedAt: participant.lastTappedAt,
      },
    });
    return mapPrismaRoundParticipantToDomain(created);
  }

  async update(participant: RoundParticipant): Promise<RoundParticipant> {
    const prisma = getPrismaClient();
    const updated = await prisma.roundParticipant.update({
      where: { id: participant.id },
      data: {
        tapCount: participant.tapCount,
        score: participant.score,
        lastTappedAt: participant.lastTappedAt,
      },
    });
    return mapPrismaRoundParticipantToDomain(updated);
  }

  async upsertParticipant(
    roundId: string,
    userId: string,
    tapFn: (participant: RoundParticipant | null) => RoundParticipant
  ): Promise<RoundParticipant> {
    const prisma = getPrismaClient();
    
    // First, try to find existing participant
    const existing = await this.findByRoundAndUser(roundId, userId);
    
    // Calculate new participant state using the provided function
    const newParticipant = tapFn(existing);
    
    // Use upsert with ON CONFLICT UPDATE
    const upserted = await prisma.roundParticipant.upsert({
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
    
    return mapPrismaRoundParticipantToDomain(upserted);
  }
}

