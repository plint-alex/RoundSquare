import { RoundRepository } from '@/domain/repositories/round.repository.js';
import { RoundStatus } from '@/domain/rounds/round-status.enum.js';
import { logger } from '@/shared/logger.js';

export class RoundStatusRefreshService {
  constructor(private readonly roundRepository: RoundRepository) {}

  async refreshRoundStatuses(): Promise<void> {
    const now = new Date();
    const schedulableRounds = await this.roundRepository.findSchedulable();

    for (const round of schedulableRounds) {
      const computedStatus = round.computeStatus(now);

      // Only update if status has changed
      if (computedStatus !== round.status) {
        try {
          await this.roundRepository.updateStatus(round.id, computedStatus);
          logger.info(
            {
              roundId: round.id,
              oldStatus: round.status,
              newStatus: computedStatus,
            },
            'Round status updated'
          );
        } catch (error) {
          logger.error(
            {
              roundId: round.id,
              error,
            },
            'Failed to update round status'
          );
        }
      }
    }
  }
}


