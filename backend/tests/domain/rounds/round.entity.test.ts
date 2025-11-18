import { describe, it, expect } from 'vitest';
import { Round } from '@/domain/rounds/round.entity.js';
import { RoundStatus } from '@/domain/rounds/round-status.enum.js';

describe('Round Entity', () => {
  const now = new Date();
  const cooldownStart = new Date(now.getTime() - 1000);
  const startAt = new Date(now.getTime() + 30000);
  const endAt = new Date(startAt.getTime() + 60000);

  it('should create a round with COOLDOWN status', () => {
    const round = Round.create('1', cooldownStart, startAt, endAt, 'user1');

    expect(round.id).toBe('1');
    expect(round.status).toBe(RoundStatus.COOLDOWN);
    expect(round.cooldownStartAt).toEqual(cooldownStart);
    expect(round.startAt).toEqual(startAt);
    expect(round.endAt).toEqual(endAt);
    expect(round.totalPoints).toBe(0);
    expect(round.createdById).toBe('user1');
  });

  it('should correctly identify cooldown status', () => {
    const round = Round.create('1', cooldownStart, startAt, endAt, 'user1');
    const duringCooldown = new Date(now.getTime() + 10000);

    expect(round.isCooldown(duringCooldown)).toBe(true);
    expect(round.isActive(duringCooldown)).toBe(false);
    expect(round.isCompleted(duringCooldown)).toBe(false);
  });

  it('should correctly identify active status', () => {
    const round = Round.create('1', cooldownStart, startAt, endAt, 'user1');
    const duringActive = new Date(startAt.getTime() + 10000);

    // Manually set status to ACTIVE for this test
    const activeRound = new Round(
      round.id,
      RoundStatus.ACTIVE,
      round.cooldownStartAt,
      round.startAt,
      round.endAt,
      round.totalPoints,
      round.createdById,
      round.createdAt,
      round.updatedAt
    );

    expect(activeRound.isActive(duringActive)).toBe(true);
    expect(activeRound.isCooldown(duringActive)).toBe(false);
    expect(activeRound.isCompleted(duringActive)).toBe(false);
  });

  it('should correctly identify completed status', () => {
    const round = Round.create('1', cooldownStart, startAt, endAt, 'user1');
    const afterEnd = new Date(endAt.getTime() + 1000);

    expect(round.isCompleted(afterEnd)).toBe(true);
    expect(round.isActive(afterEnd)).toBe(false);
    expect(round.isCooldown(afterEnd)).toBe(false);
  });

  describe('computeStatus', () => {
    it('should compute COOLDOWN status before start', () => {
      const round = Round.create('1', cooldownStart, startAt, endAt, 'user1');
      const beforeStart = new Date(startAt.getTime() - 1000);

      expect(round.computeStatus(beforeStart)).toBe(RoundStatus.COOLDOWN);
    });

    it('should compute ACTIVE status during round', () => {
      const round = Round.create('1', cooldownStart, startAt, endAt, 'user1');
      const duringRound = new Date(startAt.getTime() + 10000);

      expect(round.computeStatus(duringRound)).toBe(RoundStatus.ACTIVE);
    });

    it('should compute COMPLETED status after end', () => {
      const round = Round.create('1', cooldownStart, startAt, endAt, 'user1');
      const afterEnd = new Date(endAt.getTime() + 1000);

      expect(round.computeStatus(afterEnd)).toBe(RoundStatus.COMPLETED);
    });
  });

  describe('getTimeUntilStart', () => {
    it('should return seconds until start', () => {
      const round = Round.create('1', cooldownStart, startAt, endAt, 'user1');
      const now = new Date(startAt.getTime() - 15000); // 15 seconds before start

      expect(round.getTimeUntilStart(now)).toBe(15);
    });

    it('should return null if round has started', () => {
      const round = Round.create('1', cooldownStart, startAt, endAt, 'user1');
      const now = new Date(startAt.getTime() + 1000);

      expect(round.getTimeUntilStart(now)).toBeNull();
    });

    it('should return 0 if exactly at start time', () => {
      const round = Round.create('1', cooldownStart, startAt, endAt, 'user1');

      expect(round.getTimeUntilStart(startAt)).toBe(0);
    });
  });

  describe('getTimeRemaining', () => {
    it('should return null before round starts', () => {
      const round = Round.create('1', cooldownStart, startAt, endAt, 'user1');
      const now = new Date(startAt.getTime() - 1000);

      expect(round.getTimeRemaining(now)).toBeNull();
    });

    it('should return seconds remaining during round', () => {
      const round = Round.create('1', cooldownStart, startAt, endAt, 'user1');
      const now = new Date(startAt.getTime() + 30000); // 30 seconds after start, 30 seconds remaining

      expect(round.getTimeRemaining(now)).toBe(30);
    });

    it('should return null after round ends', () => {
      const round = Round.create('1', cooldownStart, startAt, endAt, 'user1');
      const now = new Date(endAt.getTime() + 1000);

      expect(round.getTimeRemaining(now)).toBeNull();
    });

    it('should return 0 if exactly at end time', () => {
      const round = Round.create('1', cooldownStart, startAt, endAt, 'user1');

      expect(round.getTimeRemaining(endAt)).toBe(0);
    });
  });
});

