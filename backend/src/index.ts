import 'dotenv/config';
import { createServer, shutdownServer } from './infra/http/server.js';
import { loadConfig } from './shared/config.js';
import { logger } from './shared/logger.js';
import { RoundStatusRefreshService } from './app/rounds/round-status-refresh.service.js';
import { RoundLifecycleWorker } from './app/rounds/round-lifecycle.worker.js';
import { PrismaRoundRepository } from './infra/db/repositories/prisma-round.repository.js';

async function start() {
  try {
    const config = loadConfig();
    const server = await createServer();

    // Initialize and start round lifecycle worker
    const roundRepository = new PrismaRoundRepository();
    const statusRefreshService = new RoundStatusRefreshService(roundRepository);
    const lifecycleWorker = new RoundLifecycleWorker(statusRefreshService);
    lifecycleWorker.start();

    // Stop worker on shutdown
    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Shutting down...');
      lifecycleWorker.stop();
      await shutdownServer(server);
      logger.info('Shutdown complete');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    await server.listen({ port: config.PORT, host: '0.0.0.0' });
    logger.info({ port: config.PORT }, 'Server started successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

start();

