import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateRoundService } from '@/app/rounds/create-round.service.js';
import { RoundRepository } from '@/domain/repositories/round.repository.js';
import { Round } from '@/domain/rounds/round.entity.js';
import { RoundStatus } from '@/domain/rounds/round-status.enum.js';
import { resetConfig } from '@/shared/config.js';

describe('CreateRoundService', () => {
  let createRoundService: CreateRoundService;
  let mockRoundRepository: RoundRepository;

  beforeEach(() => {
    process.env.ROUND_DURATION = '60';
    process.env.COOLDOWN_DURATION = '30';
    resetConfig();

    mockRoundRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findByStatus: vi.fn(),
      findActive: vi.fn(),
      findSchedulable: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateStatus: vi.fn(),
    };

    createRoundService = new CreateRoundService(mockRoundRepository);
  });

  it('should create a round with computed timestamps', async () => {
    const createdById = 'user-id';
    const mockRound = Round.create(
      'round-id',
      new Date('2025-11-17T12:00:00Z'),
      new Date('2025-11-17T12:00:30Z'),
      new Date('2025-11-17T12:01:30Z'),
      createdById
    );

    vi.mocked(mockRoundRepository.create).mockResolvedValue(mockRound);

    const result = await createRoundService.createRound(createdById);

    expect(mockRoundRepository.create).toHaveBeenCalled();
    const createdRound = vi.mocked(mockRoundRepository.create).mock.calls[0][0];
    expect(createdRound.status).toBe(RoundStatus.COOLDOWN);
    expect(createdRound.createdById).toBe(createdById);
    expect(createdRound.totalPoints).toBe(0);

    // Verify timeline computation
    const cooldownDiff = createdRound.startAt.getTime() - createdRound.cooldownStartAt.getTime();
    const roundDiff = createdRound.endAt.getTime() - createdRound.startAt.getTime();
    expect(cooldownDiff).toBe(30 * 1000); // 30 seconds
    expect(roundDiff).toBe(60 * 1000); // 60 seconds
  });

  it('should use config values for durations', async () => {
    process.env.ROUND_DURATION = '120';
    process.env.COOLDOWN_DURATION = '45';
    resetConfig();

    const createdById = 'user-id';
    const mockRound = Round.create(
      'round-id',
      new Date(),
      new Date(),
      new Date(),
      createdById
    );

    vi.mocked(mockRoundRepository.create).mockResolvedValue(mockRound);

    await createRoundService.createRound(createdById);

    const createdRound = vi.mocked(mockRoundRepository.create).mock.calls[0][0];
    const cooldownDiff = createdRound.startAt.getTime() - createdRound.cooldownStartAt.getTime();
    const roundDiff = createdRound.endAt.getTime() - createdRound.startAt.getTime();
    expect(cooldownDiff).toBe(45 * 1000); // 45 seconds
    expect(roundDiff).toBe(120 * 1000); // 120 seconds
  });

  it('should use startDelaySeconds override when provided', async () => {
    const createdById = 'user-id';
    const mockRound = Round.create(
      'round-id',
      new Date('2025-11-17T12:00:00Z'),
      new Date('2025-11-17T12:01:00Z'), // 60 seconds delay
      new Date('2025-11-17T12:02:00Z'),
      createdById
    );

    vi.mocked(mockRoundRepository.create).mockResolvedValue(mockRound);

    const result = await createRoundService.createRound(createdById, 60);

    expect(mockRoundRepository.create).toHaveBeenCalled();
    const createdRound = vi.mocked(mockRoundRepository.create).mock.calls[0][0];
    
    // Verify timeline uses override (60 seconds) instead of config (30 seconds)
    const cooldownDiff = createdRound.startAt.getTime() - createdRound.cooldownStartAt.getTime();
    const roundDiff = createdRound.endAt.getTime() - createdRound.startAt.getTime();
    expect(cooldownDiff).toBe(60 * 1000); // 60 seconds (override)
    expect(roundDiff).toBe(60 * 1000); // 60 seconds (from config)
  });

  it('should use config default when startDelaySeconds is not provided', async () => {
    const createdById = 'user-id';
    const mockRound = Round.create(
      'round-id',
      new Date('2025-11-17T12:00:00Z'),
      new Date('2025-11-17T12:00:30Z'),
      new Date('2025-11-17T12:01:30Z'),
      createdById
    );

    vi.mocked(mockRoundRepository.create).mockResolvedValue(mockRound);

    const result = await createRoundService.createRound(createdById);

    expect(mockRoundRepository.create).toHaveBeenCalled();
    const createdRound = vi.mocked(mockRoundRepository.create).mock.calls[0][0];
    
    // Verify timeline uses config default (30 seconds)
    const cooldownDiff = createdRound.startAt.getTime() - createdRound.cooldownStartAt.getTime();
    const roundDiff = createdRound.endAt.getTime() - createdRound.startAt.getTime();
    expect(cooldownDiff).toBe(30 * 1000); // 30 seconds (from config)
    expect(roundDiff).toBe(60 * 1000); // 60 seconds (from config)
  });
});

