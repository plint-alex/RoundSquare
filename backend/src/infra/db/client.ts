import { PrismaClient } from '@prisma/client';
import { logger } from '@/shared/logger.js';

let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
    });

    prisma.$on('error' as never, (e: unknown) => {
      logger.error({ error: e }, 'Prisma error');
    });

    prisma.$on('warn' as never, (e: unknown) => {
      logger.warn({ warning: e }, 'Prisma warning');
    });
  }

  return prisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}


