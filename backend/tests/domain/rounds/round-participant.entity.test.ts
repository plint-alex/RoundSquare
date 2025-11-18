import { describe, it, expect } from 'vitest';
import { RoundParticipant } from '@/domain/rounds/round-participant.entity.js';

describe('RoundParticipant Entity', () => {
  it('should create a participant with zero taps and score', () => {
    const participant = RoundParticipant.create('1', 'round1', 'user1');

    expect(participant.id).toBe('1');
    expect(participant.roundId).toBe('round1');
    expect(participant.userId).toBe('user1');
    expect(participant.tapCount).toBe(0);
    expect(participant.score).toBe(0);
    expect(participant.lastTappedAt).toBeNull();
  });

  it('should add tap and increment score by 1 for regular taps', () => {
    let participant = RoundParticipant.create('1', 'round1', 'user1');

    // First 10 taps should give 1 point each
    for (let i = 1; i <= 10; i++) {
      participant = participant.addTap();
      expect(participant.tapCount).toBe(i);
      expect(participant.score).toBe(i);
      expect(participant.lastTappedAt).toBeInstanceOf(Date);
    }
  });

  it('should add 10 points on the 11th tap', () => {
    let participant = RoundParticipant.create('1', 'round1', 'user1');

    // Add 10 taps (score = 10)
    for (let i = 0; i < 10; i++) {
      participant = participant.addTap();
    }

    expect(participant.tapCount).toBe(10);
    expect(participant.score).toBe(10);

    // 11th tap should give 10 points
    participant = participant.addTap();
    expect(participant.tapCount).toBe(11);
    expect(participant.score).toBe(20); // 10 + 10
  });

  it('should correctly calculate score for multiple 11-tap cycles', () => {
    let participant = RoundParticipant.create('1', 'round1', 'user1');

    // 22 taps = 2 cycles of 11
    for (let i = 0; i < 22; i++) {
      participant = participant.addTap();
    }

    // 20 regular taps (20 points) + 2 bonus taps (20 points) = 40 points
    expect(participant.tapCount).toBe(22);
    expect(participant.score).toBe(40);
  });
});


