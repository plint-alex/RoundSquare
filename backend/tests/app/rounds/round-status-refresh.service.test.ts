import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoundStatusRefreshService } from '@/app/rounds/round-status-refresh.service.js';
import { RoundRepository } from '@/domain/repositories/round.repository.js';
import { Round } from '@/domain/rounds/round.entity.js';
import { RoundStatus } from '@/domain/rounds/round-status.enum.js';

describe('RoundStatusRefreshService', () => {
  let refreshService: RoundStatusRefreshService;
  let mockRoundRepository: RoundRepository;

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
    };

    refreshService = new RoundStatusRefreshService(mockRoundRepository);
  });

  it('should update COOLDOWN to ACTIVE when start time is reached', async () => {
    const now = new Date();
    const cooldownStart = new Date(now.getTime() - 1000);
    const startAt = new Date(now.getTime() - 500); // Just started
    const endAt = new Date(now.getTime() + 60000);

    const round = Round.create('round-id', cooldownStart, startAt, endAt, 'user-id');
    // Manually set status to COOLDOWN for test
    const cooldownRound = new Round(
      round.id,
      RoundStatus.COOLDOWN,
      round.cooldownStartAt,
      round.startAt,
      round.endAt,
      round.totalPoints,
      round.createdById,
      round.createdAt,
      round.updatedAt
    );

    vi.mocked(mockRoundRepository.findSchedulable).mockResolvedValue([cooldownRound]);
    vi.mocked(mockRoundRepository.updateStatus).mockResolvedValue(
      new Round(
        round.id,
        RoundStatus.ACTIVE,
        round.cooldownStartAt,
        round.startAt,
        round.endAt,
        round.totalPoints,
        round.createdById,
        round.createdAt,
        round.updatedAt
      )
    );

    await refreshService.refreshRoundStatuses();

    expect(mockRoundRepository.updateStatus).toHaveBeenCalledWith(
      round.id,
      RoundStatus.ACTIVE
    );
  });

  it('should update ACTIVE to COMPLETED when end time is reached', async () => {
    const now = new Date();
    const cooldownStart = new Date(now.getTime() - 100000);
    const startAt = new Date(now.getTime() - 60000);
    const endAt = new Date(now.getTime() - 1000); // Just ended

    const round = Round.create('round-id', cooldownStart, startAt, endAt, 'user-id');
    // Manually set status to ACTIVE for test
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

    vi.mocked(mockRoundRepository.findSchedulable).mockResolvedValue([activeRound]);
    vi.mocked(mockRoundRepository.updateStatus).mockResolvedValue(
      new Round(
        round.id,
        RoundStatus.COMPLETED,
        round.cooldownStartAt,
        round.startAt,
        round.endAt,
        round.totalPoints,
        round.createdById,
        round.createdAt,
        round.updatedAt
      )
    );

    await refreshService.refreshRoundStatuses();

    expect(mockRoundRepository.updateStatus).toHaveBeenCalledWith(
      round.id,
      RoundStatus.COMPLETED
    );
  });

  it('should not update if status has not changed', async () => {
    const now = new Date();
    const cooldownStart = new Date(now.getTime() - 1000);
    const startAt = new Date(now.getTime() + 30000);
    const endAt = new Date(now.getTime() + 90000);

    const round = Round.create('round-id', cooldownStart, startAt, endAt, 'user-id');
    // Status is already COOLDOWN and computed status is also COOLDOWN
    vi.mocked(mockRoundRepository.findSchedulable).mockResolvedValue([round]);

    await refreshService.refreshRoundStatuses();

    expect(mockRoundRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('should handle multiple rounds', async () => {
    const now = new Date();
    const round1 = Round.create(
      'round-1',
      new Date(now.getTime() - 1000),
      new Date(now.getTime() + 30000),
      new Date(now.getTime() + 90000),
      'user-id'
    );
    const round2 = Round.create(
      'round-2',
      new Date(now.getTime() - 100000),
      new Date(now.getTime() - 500),
      new Date(now.getTime() + 60000),
      'user-id'
    );

    const activeRound2 = new Round(
      round2.id,
      RoundStatus.COOLDOWN,
      round2.cooldownStartAt,
      round2.startAt,
      round2.endAt,
      round2.totalPoints,
      round2.createdById,
      round2.createdAt,
      round2.updatedAt
    );

    vi.mocked(mockRoundRepository.findSchedulable).mockResolvedValue([round1, activeRound2]);
    vi.mocked(mockRoundRepository.updateStatus).mockResolvedValue(activeRound2);

    await refreshService.refreshRoundStatuses();

    // Only round2 should be updated (round1 status hasn't changed)
    expect(mockRoundRepository.updateStatus).toHaveBeenCalledTimes(1);
    expect(mockRoundRepository.updateStatus).toHaveBeenCalledWith(
      round2.id,
      RoundStatus.ACTIVE
    );
  });
});


