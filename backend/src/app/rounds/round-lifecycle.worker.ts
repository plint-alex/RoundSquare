import { RoundStatusRefreshService } from './round-status-refresh.service.js';
import { getConfig } from '@/shared/config.js';
import { logger } from '@/shared/logger.js';

export class RoundLifecycleWorker {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(private readonly statusRefreshService: RoundStatusRefreshService) {}

  start(): void {
    if (this.isRunning) {
      logger.warn('Round lifecycle worker is already running');
      return;
    }

    const config = getConfig();
    const pollInterval = config.LIFECYCLE_POLL_MS;

    logger.info({ pollInterval }, 'Starting round lifecycle worker');

    this.isRunning = true;
    this.intervalId = setInterval(async () => {
      try {
        await this.statusRefreshService.refreshRoundStatuses();
      } catch (error) {
        logger.error({ error }, 'Error in round lifecycle worker');
      }
    }, pollInterval);
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping round lifecycle worker');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
  }

  isActive(): boolean {
    return this.isRunning;
  }
}


