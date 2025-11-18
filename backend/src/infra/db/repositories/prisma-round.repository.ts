import { RoundStatus as PrismaRoundStatus } from '@prisma/client';
import { getPrismaClient } from '../client.js';
import { RoundRepository } from '@/domain/repositories/round.repository.js';
import { Round } from '@/domain/rounds/round.entity.js';
import { RoundStatus } from '@/domain/rounds/round-status.enum.js';
import { mapPrismaRoundToDomain } from '../mappers/round.mapper.js';

function mapDomainStatusToPrisma(status: RoundStatus): PrismaRoundStatus {
  switch (status) {
    case RoundStatus.COOLDOWN:
      return PrismaRoundStatus.COOLDOWN;
    case RoundStatus.ACTIVE:
      return PrismaRoundStatus.ACTIVE;
    case RoundStatus.COMPLETED:
      return PrismaRoundStatus.COMPLETED;
  }
}

export class PrismaRoundRepository implements RoundRepository {
  async findById(id: string): Promise<Round | null> {
    const prisma = getPrismaClient();
    const round = await prisma.round.findUnique({ where: { id } });
    return round ? mapPrismaRoundToDomain(round) : null;
  }

  async findAll(): Promise<Round[]> {
    const prisma = getPrismaClient();
    const rounds = await prisma.round.findMany({
      orderBy: { startAt: 'desc' },
    });
    return rounds.map(mapPrismaRoundToDomain);
  }

  async findByStatus(status: RoundStatus): Promise<Round[]> {
    const prisma = getPrismaClient();
    const rounds = await prisma.round.findMany({
      where: { status: mapDomainStatusToPrisma(status) },
      orderBy: { startAt: 'desc' },
    });
    return rounds.map(mapPrismaRoundToDomain);
  }

  async findActive(): Promise<Round[]> {
    return this.findByStatus(RoundStatus.ACTIVE);
  }

  async findSchedulable(): Promise<Round[]> {
    const prisma = getPrismaClient();
    // Find rounds that are not completed (COOLDOWN or ACTIVE)
    const rounds = await prisma.round.findMany({
      where: {
        status: {
          in: [PrismaRoundStatus.COOLDOWN, PrismaRoundStatus.ACTIVE],
        },
      },
      orderBy: { startAt: 'asc' },
    });
    return rounds.map(mapPrismaRoundToDomain);
  }

  async create(round: Round): Promise<Round> {
    const prisma = getPrismaClient();
    const created = await prisma.round.create({
      data: {
        id: round.id,
        status: mapDomainStatusToPrisma(round.status),
        cooldownStartAt: round.cooldownStartAt,
        startAt: round.startAt,
        endAt: round.endAt,
        totalPoints: round.totalPoints,
        createdById: round.createdById,
      },
    });
    return mapPrismaRoundToDomain(created);
  }

  async update(round: Round): Promise<Round> {
    const prisma = getPrismaClient();
    const updated = await prisma.round.update({
      where: { id: round.id },
      data: {
        status: mapDomainStatusToPrisma(round.status),
        cooldownStartAt: round.cooldownStartAt,
        startAt: round.startAt,
        endAt: round.endAt,
        totalPoints: round.totalPoints,
      },
    });
    return mapPrismaRoundToDomain(updated);
  }

  async updateStatus(id: string, status: RoundStatus): Promise<Round> {
    const prisma = getPrismaClient();
    // Atomic update with WHERE clause to ensure idempotency
    const updated = await prisma.round.update({
      where: { id },
      data: {
        status: mapDomainStatusToPrisma(status),
      },
    });
    return mapPrismaRoundToDomain(updated);
  }

  async incrementTotalPoints(roundId: string, points: number): Promise<void> {
    const prisma = getPrismaClient();
    // Use Prisma increment operator for atomic update
    await prisma.round.update({
      where: { id: roundId },
      data: {
        totalPoints: {
          increment: points,
        },
      },
    });
  }
}

