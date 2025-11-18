import { v4 as uuidv4 } from 'uuid';
import { RoundRepository } from '@/domain/repositories/round.repository.js';
import { Round } from '@/domain/rounds/round.entity.js';
import { computeTimeline } from '@/domain/rounds/round-timeline.service.js';
import { getConfig } from '@/shared/config.js';

export class CreateRoundService {
  constructor(private readonly roundRepository: RoundRepository) {}

  async createRound(createdById: string, startDelaySeconds?: number): Promise<Round> {
    const config = getConfig();
    const now = new Date();

    // Use provided startDelaySeconds or fall back to config
    const cooldownDurationSeconds = startDelaySeconds ?? config.COOLDOWN_DURATION;

    // Convert durations from seconds to milliseconds
    const cooldownDurationMs = cooldownDurationSeconds * 1000;
    const roundDurationMs = config.ROUND_DURATION * 1000;

    // Compute timeline
    const timeline = computeTimeline(now, cooldownDurationMs, roundDurationMs);

    // Create round entity
    const round = Round.create(
      uuidv4(),
      timeline.cooldownStartAt,
      timeline.startAt,
      timeline.endAt,
      createdById
    );

    // Persist to database
    return this.roundRepository.create(round);
  }
}

