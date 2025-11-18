import { describe, it, expect } from 'vitest';
import { Round } from '@/domain/rounds/round.entity.js';
import { RoundParticipant } from '@/domain/rounds/round-participant.entity.js';
import { User } from '@/domain/users/user.entity.js';
import { UserRole } from '@/domain/users/role.enum.js';
import { RoundStatus } from '@/domain/rounds/round-status.enum.js';
import { mapRoundToDetailDto, mapParticipantToDto } from '@/infra/http/dto/round.dto.js';

describe('Round DTO Mappers', () => {
  describe('mapParticipantToDto', () => {
    it('should map participant to DTO with username', () => {
      const participant = RoundParticipant.create('participant-id', 'round-id', 'user-id');
      const participantWithTaps = new RoundParticipant(
        participant.id,
        participant.roundId,
        participant.userId,
        10,
        19,
        new Date(),
        participant.createdAt,
        participant.updatedAt
      );

      const dto = mapParticipantToDto(participantWithTaps, 'testuser');

      expect(dto.userId).toBe('user-id');
      expect(dto.username).toBe('testuser');
      expect(dto.score).toBe(19);
      expect(dto.tapCount).toBe(10);
    });
  });

  describe('mapRoundToDetailDto', () => {
    const createTestRound = (): Round => {
      const now = new Date();
      return new Round(
        'round-id',
        RoundStatus.ACTIVE,
        now,
        new Date(now.getTime() + 30000),
        new Date(now.getTime() + 90000),
        100,
        'creator-id',
        now,
        now
      );
    };

    it('should map round without optional fields', () => {
      const round = createTestRound();
      const dto = mapRoundToDetailDto(round);

      expect(dto.id).toBe('round-id');
      expect(dto.status).toBe(RoundStatus.ACTIVE);
      expect(dto.winner).toBeUndefined();
      expect(dto.myStats).toBeUndefined();
      expect(dto.leaderboard).toBeUndefined();
    });

    it('should include winner if provided', () => {
      const round = createTestRound();
      const dto = mapRoundToDetailDto(round, {
        winner: {
          userId: 'winner-id',
          username: 'winner',
          score: 100,
        },
      });

      expect(dto.winner).toBeDefined();
      expect(dto.winner?.userId).toBe('winner-id');
      expect(dto.winner?.username).toBe('winner');
      expect(dto.winner?.score).toBe(100);
    });

    it('should include personal stats for regular user', () => {
      const round = createTestRound();
      const participant = new RoundParticipant(
        'participant-id',
        'round-id',
        'user-id',
        10,
        19,
        new Date(),
        new Date(),
        new Date()
      );
      const user = User.create('user-id', 'testuser', 'hash', UserRole.SURVIVOR);

      const dto = mapRoundToDetailDto(round, {
        currentUserParticipant: participant,
        currentUser: user,
      });

      expect(dto.myStats).toBeDefined();
      expect(dto.myStats?.tapCount).toBe(10);
      expect(dto.myStats?.score).toBe(19); // Actual score for regular user
    });

    it('should return 0 for personal score if user is Никита', () => {
      const round = createTestRound();
      const participant = new RoundParticipant(
        'participant-id',
        'round-id',
        'user-id',
        10,
        19,
        new Date(),
        new Date(),
        new Date()
      );
      const nikita = User.create('user-id', 'nikita', 'hash', UserRole.NIKITA);

      const dto = mapRoundToDetailDto(round, {
        currentUserParticipant: participant,
        currentUser: nikita,
      });

      expect(dto.myStats).toBeDefined();
      expect(dto.myStats?.tapCount).toBe(10);
      expect(dto.myStats?.score).toBe(0); // Никита rule: returns 0
    });

    it('should not include personal stats if participant not provided', () => {
      const round = createTestRound();
      const user = User.create('user-id', 'testuser', 'hash', UserRole.SURVIVOR);

      const dto = mapRoundToDetailDto(round, {
        currentUser: user,
      });

      expect(dto.myStats).toBeUndefined();
    });

    it('should include leaderboard if provided', () => {
      const round = createTestRound();
      const participant1 = new RoundParticipant(
        'participant-1',
        'round-id',
        'user-1',
        10,
        100,
        new Date(),
        new Date(),
        new Date()
      );
      const participant2 = new RoundParticipant(
        'participant-2',
        'round-id',
        'user-2',
        5,
        50,
        new Date(),
        new Date(),
        new Date()
      );

      const dto = mapRoundToDetailDto(round, {
        leaderboardParticipants: [
          { participant: participant1, username: 'user1' },
          { participant: participant2, username: 'user2' },
        ],
      });

      expect(dto.leaderboard).toBeDefined();
      expect(dto.leaderboard?.length).toBe(2);
      expect(dto.leaderboard?.[0].userId).toBe('user-1');
      expect(dto.leaderboard?.[0].username).toBe('user1');
      expect(dto.leaderboard?.[0].score).toBe(100);
      expect(dto.leaderboard?.[0].tapCount).toBe(10);
      expect(dto.leaderboard?.[1].userId).toBe('user-2');
      expect(dto.leaderboard?.[1].username).toBe('user2');
      expect(dto.leaderboard?.[1].score).toBe(50);
      expect(dto.leaderboard?.[1].tapCount).toBe(5);
    });

    it('should include all fields together', () => {
      const round = createTestRound();
      const participant = new RoundParticipant(
        'participant-id',
        'round-id',
        'user-id',
        5,
        5,
        new Date(),
        new Date(),
        new Date()
      );
      const user = User.create('user-id', 'testuser', 'hash', UserRole.SURVIVOR);
      const leaderboardParticipant = new RoundParticipant(
        'leaderboard-1',
        'round-id',
        'leader-1',
        10,
        100,
        new Date(),
        new Date(),
        new Date()
      );

      const dto = mapRoundToDetailDto(round, {
        winner: {
          userId: 'winner-id',
          username: 'winner',
          score: 200,
        },
        currentUserParticipant: participant,
        currentUser: user,
        leaderboardParticipants: [
          { participant: leaderboardParticipant, username: 'leader1' },
        ],
      });

      expect(dto.winner).toBeDefined();
      expect(dto.myStats).toBeDefined();
      expect(dto.leaderboard).toBeDefined();
      expect(dto.leaderboard?.length).toBe(1);
    });
  });
});


