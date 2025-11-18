import { describe, it, expect } from 'vitest';
import { computeTimeline } from '@/domain/rounds/round-timeline.service.js';

describe('RoundTimeline Service', () => {
  it('should compute timeline correctly', () => {
    const createdAt = new Date('2025-11-17T12:00:00Z');
    const cooldownDurationMs = 30 * 1000; // 30 seconds
    const roundDurationMs = 60 * 1000; // 60 seconds

    const timeline = computeTimeline(createdAt, cooldownDurationMs, roundDurationMs);

    expect(timeline.cooldownStartAt).toEqual(createdAt);
    expect(timeline.startAt).toEqual(new Date('2025-11-17T12:00:30Z'));
    expect(timeline.endAt).toEqual(new Date('2025-11-17T12:01:30Z'));
  });

  it('should handle zero cooldown', () => {
    const createdAt = new Date('2025-11-17T12:00:00Z');
    const cooldownDurationMs = 0;
    const roundDurationMs = 60 * 1000;

    const timeline = computeTimeline(createdAt, cooldownDurationMs, roundDurationMs);

    expect(timeline.cooldownStartAt).toEqual(createdAt);
    expect(timeline.startAt).toEqual(createdAt);
    expect(timeline.endAt).toEqual(new Date('2025-11-17T12:01:00Z'));
  });

  it('should preserve UTC timezone', () => {
    const createdAt = new Date('2025-11-17T12:00:00.000Z');
    const cooldownDurationMs = 30 * 1000;
    const roundDurationMs = 60 * 1000;

    const timeline = computeTimeline(createdAt, cooldownDurationMs, roundDurationMs);

    // All dates should be in UTC
    expect(timeline.cooldownStartAt.toISOString()).toContain('Z');
    expect(timeline.startAt.toISOString()).toContain('Z');
    expect(timeline.endAt.toISOString()).toContain('Z');
  });

  it('should handle large durations', () => {
    const createdAt = new Date('2025-11-17T12:00:00Z');
    const cooldownDurationMs = 24 * 60 * 60 * 1000; // 24 hours
    const roundDurationMs = 7 * 24 * 60 * 60 * 1000; // 7 days

    const timeline = computeTimeline(createdAt, cooldownDurationMs, roundDurationMs);

    expect(timeline.startAt.getTime() - timeline.cooldownStartAt.getTime()).toBe(
      cooldownDurationMs
    );
    expect(timeline.endAt.getTime() - timeline.startAt.getTime()).toBe(roundDurationMs);
  });
});


