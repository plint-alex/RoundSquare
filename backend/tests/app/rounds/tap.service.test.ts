import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TapService } from '@/app/rounds/tap.service.js';
import { RoundRepository } from '@/domain/repositories/round.repository.js';
import { RoundParticipantRepository } from '@/domain/repositories/round-participant.repository.js';
import { UserRepository } from '@/domain/repositories/user.repository.js';
import { Round } from '@/domain/rounds/round.entity.js';
import { RoundParticipant } from '@/domain/rounds/round-participant.entity.js';
import { User } from '@/domain/users/user.entity.js';
import { RoundStatus } from '@/domain/rounds/round-status.enum.js';
import { UserRole } from '@/domain/users/role.enum.js';
import { RoundNotActiveError } from '@/shared/errors/round.errors.js';

describe('TapService', () => {
  let tapService: TapService;
  let mockRoundRepository: RoundRepository;
  let mockRoundParticipantRepository: RoundParticipantRepository;
  let mockUserRepository: UserRepository;

  beforeEach(() => {
    mockRoundRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findByStatus: vi.fn(),
      findActive: vi.fn(),
      findSchedulable: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateStatus: vi.fn(),
      incrementTotalPoints: vi.fn(),
    } as unknown as RoundRepository;

    mockRoundParticipantRepository = {
      findById: vi.fn(),
      findByRoundId: vi.fn(),
      findByUserId: vi.fn(),
      findByRoundAndUser: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsertParticipant: vi.fn(),
    } as unknown as RoundParticipantRepository;

    mockUserRepository = {
      findById: vi.fn(),
      findByUsername: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    } as unknown as UserRepository;

    tapService = new TapService(
      mockRoundRepository,
      mockRoundParticipantRepository,
      mockUserRepository
    );
  });

  describe('handleTap', () => {
    const roundId = 'round-id';
    const userId = 'user-id';
    const now = new Date();
    const activeRoundStart = new Date(now.getTime() - 1000);
    const activeRoundEnd = new Date(now.getTime() + 60000);

    it('should throw error if round not found', async () => {
      vi.mocked(mockRoundRepository.findById).mockResolvedValue(null);

      await expect(tapService.handleTap(roundId, userId)).rejects.toThrow('Round not found');
    });

    it('should throw RoundNotActiveError if round is not active', async () => {
      const cooldownRound = Round.create(
        roundId,
        new Date(now.getTime() - 1000),
        new Date(now.getTime() + 30000),
        new Date(now.getTime() + 90000),
        'admin-id'
      );

      vi.mocked(mockRoundRepository.findById).mockResolvedValue(cooldownRound);

      await expect(tapService.handleTap(roundId, userId)).rejects.toThrow(RoundNotActiveError);
    });

    it('should throw error if user not found', async () => {
      const activeRound = Round.create(
        roundId,
        new Date(now.getTime() - 2000),
        activeRoundStart,
        activeRoundEnd,
        'admin-id'
      );

      vi.mocked(mockRoundRepository.findById).mockResolvedValue(activeRound);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      await expect(tapService.handleTap(roundId, userId)).rejects.toThrow('User not found');
    });

    it('should create new participant and add first tap', async () => {
      const activeRound = Round.create(
        roundId,
        new Date(now.getTime() - 2000),
        activeRoundStart,
        activeRoundEnd,
        'admin-id'
      );

      const user = User.create(userId, 'testuser', 'hash', UserRole.SURVIVOR);

      // Mock Prisma transaction
      const mockPrisma = {
        $transaction: vi.fn(async (callback: (tx: any) => Promise<any>) => {
          const mockTx = {
            roundParticipant: {
              findUnique: vi.fn().mockResolvedValue(null),
              upsert: vi.fn().mockImplementation(async (args: any) => {
                const participant = RoundParticipant.create(
                  args.create.id,
                  args.create.roundId,
                  args.create.userId
                );
                const tapped = participant.addTap();
                return {
                  id: tapped.id,
                  roundId: tapped.roundId,
                  userId: tapped.userId,
                  tapCount: tapped.tapCount,
                  score: tapped.score,
                  lastTappedAt: tapped.lastTappedAt,
                  createdAt: tapped.createdAt,
                  updatedAt: tapped.updatedAt,
                };
              }),
            },
            round: {
              update: vi.fn().mockResolvedValue({
                id: activeRound.id,
                status: 'ACTIVE',
                cooldownStartAt: activeRound.cooldownStartAt,
                startAt: activeRound.startAt,
                endAt: activeRound.endAt,
                totalPoints: 1,
                createdById: activeRound.createdById,
                createdAt: activeRound.createdAt,
                updatedAt: activeRound.updatedAt,
              }),
            },
          };
          return callback(mockTx as any);
        }),
      };

      vi.mocked(mockRoundRepository.findById).mockResolvedValue(activeRound);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      // Mock getPrismaClient
      vi.doMock('@/infra/db/client.js', () => ({
        getPrismaClient: () => mockPrisma,
      }));

      const result = await tapService.handleTap(roundId, userId);

      expect(result.playerScore).toBe(1); // First tap = 1 point
      expect(result.tapCount).toBe(1);
      expect(result.roundTotalPoints).toBe(1);
    });

    it('should increment tap count correctly - 1 point for normal taps', async () => {
      const activeRound = Round.create(
        roundId,
        new Date(now.getTime() - 2000),
        activeRoundStart,
        activeRoundEnd,
        'admin-id'
      );

      const user = User.create(userId, 'testuser', 'hash', UserRole.SURVIVOR);
      const existingParticipant = new RoundParticipant(
        'participant-id',
        roundId,
        userId,
        5, // 5 taps
        5, // 5 points
        now,
        new Date(),
        new Date()
      );

      const mockPrisma = {
        $transaction: vi.fn(async (callback: (tx: any) => Promise<any>) => {
          const mockTx = {
            roundParticipant: {
              findUnique: vi.fn().mockResolvedValue({
                id: existingParticipant.id,
                roundId: existingParticipant.roundId,
                userId: existingParticipant.userId,
                tapCount: existingParticipant.tapCount,
                score: existingParticipant.score,
                lastTappedAt: existingParticipant.lastTappedAt,
                createdAt: existingParticipant.createdAt,
                updatedAt: existingParticipant.updatedAt,
              }),
              upsert: vi.fn().mockImplementation(async (args: any) => {
                const tapped = existingParticipant.addTap();
                return {
                  id: tapped.id,
                  roundId: tapped.roundId,
                  userId: tapped.userId,
                  tapCount: tapped.tapCount,
                  score: tapped.score,
                  lastTappedAt: tapped.lastTappedAt,
                  createdAt: tapped.createdAt,
                  updatedAt: tapped.updatedAt,
                };
              }),
            },
            round: {
              update: vi.fn().mockResolvedValue({
                id: activeRound.id,
                status: 'ACTIVE',
                cooldownStartAt: activeRound.cooldownStartAt,
                startAt: activeRound.startAt,
                endAt: activeRound.endAt,
                totalPoints: 11,
                createdById: activeRound.createdById,
                createdAt: activeRound.createdAt,
                updatedAt: activeRound.updatedAt,
              }),
            },
          };
          return callback(mockTx as any);
        }),
      };

      vi.mocked(mockRoundRepository.findById).mockResolvedValue(activeRound);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      vi.doMock('@/infra/db/client.js', () => ({
        getPrismaClient: () => mockPrisma,
      }));

      const result = await tapService.handleTap(roundId, userId);

      expect(result.tapCount).toBe(6); // 5 + 1
      expect(result.playerScore).toBe(6); // 5 + 1 point
      expect(result.roundTotalPoints).toBe(11);
    });

    it('should add 10 points on 11th tap', async () => {
      const activeRound = Round.create(
        roundId,
        new Date(now.getTime() - 2000),
        activeRoundStart,
        activeRoundEnd,
        'admin-id'
      );

      const user = User.create(userId, 'testuser', 'hash', UserRole.SURVIVOR);
      const existingParticipant = new RoundParticipant(
        'participant-id',
        roundId,
        userId,
        10, // 10 taps
        10, // 10 points (1 point each)
        now,
        new Date(),
        new Date()
      );

      const mockPrisma = {
        $transaction: vi.fn(async (callback: (tx: any) => Promise<any>) => {
          const mockTx = {
            roundParticipant: {
              findUnique: vi.fn().mockResolvedValue({
                id: existingParticipant.id,
                roundId: existingParticipant.roundId,
                userId: existingParticipant.userId,
                tapCount: existingParticipant.tapCount,
                score: existingParticipant.score,
                lastTappedAt: existingParticipant.lastTappedAt,
                createdAt: existingParticipant.createdAt,
                updatedAt: existingParticipant.updatedAt,
              }),
              upsert: vi.fn().mockImplementation(async (args: any) => {
                const tapped = existingParticipant.addTap();
                return {
                  id: tapped.id,
                  roundId: tapped.roundId,
                  userId: tapped.userId,
                  tapCount: tapped.tapCount,
                  score: tapped.score,
                  lastTappedAt: tapped.lastTappedAt,
                  createdAt: tapped.createdAt,
                  updatedAt: tapped.updatedAt,
                };
              }),
            },
            round: {
              update: vi.fn().mockResolvedValue({
                id: activeRound.id,
                status: 'ACTIVE',
                cooldownStartAt: activeRound.cooldownStartAt,
                startAt: activeRound.startAt,
                endAt: activeRound.endAt,
                totalPoints: 20,
                createdById: activeRound.createdById,
                createdAt: activeRound.createdAt,
                updatedAt: activeRound.updatedAt,
              }),
            },
          };
          return callback(mockTx as any);
        }),
      };

      vi.mocked(mockRoundRepository.findById).mockResolvedValue(activeRound);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

      vi.doMock('@/infra/db/client.js', () => ({
        getPrismaClient: () => mockPrisma,
      }));

      const result = await tapService.handleTap(roundId, userId);

      expect(result.tapCount).toBe(11); // 10 + 1
      expect(result.playerScore).toBe(20); // 10 + 10 points (11th tap bonus)
      expect(result.roundTotalPoints).toBe(20);
    });

    it('should return 0 for player score if user is Никита', async () => {
      const activeRound = Round.create(
        roundId,
        new Date(now.getTime() - 2000),
        activeRoundStart,
        activeRoundEnd,
        'admin-id'
      );

      const nikitaUser = User.create(userId, 'nikita', 'hash', UserRole.NIKITA);

      const mockPrisma = {
        $transaction: vi.fn(async (callback: (tx: any) => Promise<any>) => {
          const mockTx = {
            roundParticipant: {
              findUnique: vi.fn().mockResolvedValue(null),
              upsert: vi.fn().mockImplementation(async (args: any) => {
                const participant = RoundParticipant.create(
                  args.create.id,
                  args.create.roundId,
                  args.create.userId
                );
                const tapped = participant.addTap();
                return {
                  id: tapped.id,
                  roundId: tapped.roundId,
                  userId: tapped.userId,
                  tapCount: tapped.tapCount,
                  score: tapped.score, // Actual score is stored
                  lastTappedAt: tapped.lastTappedAt,
                  createdAt: tapped.createdAt,
                  updatedAt: tapped.updatedAt,
                };
              }),
            },
            round: {
              update: vi.fn().mockResolvedValue({
                id: activeRound.id,
                status: 'ACTIVE',
                cooldownStartAt: activeRound.cooldownStartAt,
                startAt: activeRound.startAt,
                endAt: activeRound.endAt,
                totalPoints: 1, // Actual points added to round
                createdById: activeRound.createdById,
                createdAt: activeRound.createdAt,
                updatedAt: activeRound.updatedAt,
              }),
            },
          };
          return callback(mockTx as any);
        }),
      };

      vi.mocked(mockRoundRepository.findById).mockResolvedValue(activeRound);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(nikitaUser);

      vi.doMock('@/infra/db/client.js', () => ({
        getPrismaClient: () => mockPrisma,
      }));

      const result = await tapService.handleTap(roundId, userId);

      expect(result.playerScore).toBe(0); // Никита always returns 0
      expect(result.tapCount).toBe(1);
      expect(result.roundTotalPoints).toBe(1); // Round total_points is updated correctly
    });
  });
});


