import Fastify, { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import { getConfig } from '@/shared/config.js';
import { logger } from '@/shared/logger.js';
import { healthPlugin } from './routes/health.js';
import { authPlugin } from './plugins/auth.plugin.js';
import { authRoutes } from './routes/auth.js';
import { disconnectPrisma } from '../db/client.js';
import { PrismaUserRepository } from '../db/repositories/prisma-user.repository.js';
import { PrismaRoundRepository } from '../db/repositories/prisma-round.repository.js';
import { PrismaRoundParticipantRepository } from '../db/repositories/prisma-round-participant.repository.js';
import { LoginService } from '@/app/auth/login.service.js';
import { CreateRoundService } from '@/app/rounds/create-round.service.js';
import { TapService } from '@/app/rounds/tap.service.js';
import { roundRoutes } from './routes/rounds.js';

export async function createServer(): Promise<FastifyInstance> {
  const config = getConfig();

  const server = Fastify({
    logger: logger as any,
    bodyLimit: 1048576, // 1MB
  });

  // Register cookie plugin
  await server.register(cookie);

  // Initialize repositories and services
  const userRepository = new PrismaUserRepository();
  const roundRepository = new PrismaRoundRepository();
  const roundParticipantRepository = new PrismaRoundParticipantRepository();
  const loginService = new LoginService(userRepository);
  const createRoundService = new CreateRoundService(roundRepository);
  const tapService = new TapService(roundRepository);

  // Register auth plugin - hooks will be registered inside
  await server.register(authPlugin, {
    userRepository,
  });
  
  // IMPORTANT: Also register the auth hook directly at root level to ensure it applies to all routes
  // This is needed because Fastify plugin encapsulation can prevent hooks from applying to routes in other plugins
  const { registerAuthHook } = await import('./plugins/auth.plugin.js');
  registerAuthHook(server, userRepository);

  // Register auth routes
  await server.register(authRoutes, {
    loginService,
    userRepository,
  });

  // Register round routes
  await server.register(roundRoutes, {
    createRoundService,
    tapService,
    roundRepository,
    roundParticipantRepository,
    userRepository,
  });

  // Register health route
  await server.register(healthPlugin);

  return server;
}

export async function shutdownServer(server: FastifyInstance): Promise<void> {
  await server.close();
  await disconnectPrisma();
}

