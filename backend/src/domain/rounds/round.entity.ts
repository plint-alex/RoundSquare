import { RoundStatus } from './round-status.enum.js';

export class Round {
  constructor(
    public readonly id: string,
    public readonly status: RoundStatus,
    public readonly cooldownStartAt: Date,
    public readonly startAt: Date,
    public readonly endAt: Date,
    public readonly totalPoints: number,
    public readonly createdById: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    id: string,
    cooldownStartAt: Date,
    startAt: Date,
    endAt: Date,
    createdById: string
  ): Round {
    const now = new Date();
    return new Round(
      id,
      RoundStatus.COOLDOWN,
      cooldownStartAt,
      startAt,
      endAt,
      0,
      createdById,
      now,
      now
    );
  }

  isActive(now: Date = new Date()): boolean {
    return this.status === RoundStatus.ACTIVE && now >= this.startAt && now < this.endAt;
  }

  isCooldown(now: Date = new Date()): boolean {
    return this.status === RoundStatus.COOLDOWN && now >= this.cooldownStartAt && now < this.startAt;
  }

  isCompleted(now: Date = new Date()): boolean {
    return this.status === RoundStatus.COMPLETED || now >= this.endAt;
  }

  /**
   * Computes the current status based on timestamps.
   * Status is computed from timestamps, not stored state, for consistency.
   */
  computeStatus(now: Date = new Date()): RoundStatus {
    if (now >= this.endAt) {
      return RoundStatus.COMPLETED;
    }
    if (now >= this.startAt) {
      return RoundStatus.ACTIVE;
    }
    if (now >= this.cooldownStartAt) {
      return RoundStatus.COOLDOWN;
    }
    // Before cooldown starts, still consider it COOLDOWN
    return RoundStatus.COOLDOWN;
  }

  /**
   * Gets the time until the round starts, in seconds.
   * Returns null if the round has already started.
   */
  getTimeUntilStart(now: Date = new Date()): number | null {
    if (now >= this.startAt) {
      return null;
    }
    return Math.max(0, Math.floor((this.startAt.getTime() - now.getTime()) / 1000));
  }

  /**
   * Gets the time remaining in the round, in seconds.
   * Returns null if the round has not started yet or is already completed.
   */
  getTimeRemaining(now: Date = new Date()): number | null {
    if (now < this.startAt) {
      return null; // Round hasn't started yet
    }
    if (now >= this.endAt) {
      return null; // Round is completed
    }
    return Math.max(0, Math.floor((this.endAt.getTime() - now.getTime()) / 1000));
  }
}

