import { FastifyPluginAsync, FastifyError } from 'fastify';
import { CreateRoundService } from '@/app/rounds/create-round.service.js';
import { TapService } from '@/app/rounds/tap.service.js';
import { RoundRepository } from '@/domain/repositories/round.repository.js';
import { RoundParticipantRepository } from '@/domain/repositories/round-participant.repository.js';
import { UserRepository } from '@/domain/repositories/user.repository.js';
import { mapRoundToListDto, mapRoundToDetailDto } from '../dto/round.dto.js';
import { RoundStatus } from '@/domain/rounds/round-status.enum.js';
import { AuthenticationRequiredError } from '@/shared/errors/auth.errors.js';
import { RoundNotActiveError } from '@/shared/errors/round.errors.js';
import { getConfig } from '@/shared/config.js';

export interface RoundRoutesOptions {
  createRoundService: CreateRoundService;
  tapService: TapService;
  roundRepository: RoundRepository;
  roundParticipantRepository: RoundParticipantRepository;
  userRepository: UserRepository;
}

export const roundRoutes: FastifyPluginAsync<RoundRoutesOptions> = async (fastify, options) => {
  const {
    createRoundService,
    tapService,
    roundRepository,
    roundParticipantRepository,
    userRepository,
  } = options;

  // Error handler for rounds routes
  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof AuthenticationRequiredError) {
      reply.status(401).send({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: error.message,
        },
      });
      return;
    }

    if (error instanceof RoundNotActiveError) {
      reply.status(409).send({
        error: {
          code: 'ROUND_NOT_ACTIVE',
          message: error.message,
        },
      });
      return;
    }

    // Let Fastify handle other errors
    reply.send(error);
  });

  // GET /api/rounds - List all rounds
  fastify.get<{
    Querystring: { status?: string; pagination?: string };
  }>('/api/rounds', async (request) => {
    const rounds = await roundRepository.findAll();
    const now = new Date();

    // Filter by status if provided
    let filteredRounds = rounds;
    if (request.query.status) {
      const statusFilter = request.query.status.toUpperCase();
      if (Object.values(RoundStatus).includes(statusFilter as RoundStatus)) {
        filteredRounds = rounds.filter(
          (round) => round.computeStatus(now) === statusFilter
        );
      }
    }

    // Pagination flag is accepted but ignored for now (future-proof)
    // const usePagination = request.query.pagination === 'true';

    return filteredRounds.map((round) => mapRoundToListDto(round, now));
  });

  // GET /api/rounds/:id - Get round details
  fastify.get<{
    Params: { id: string };
    Querystring: { limit?: string };
  }>('/api/rounds/:id', async (request, reply) => {
    const { id } = request.params;
    const round = await roundRepository.findById(id);

    if (!round) {
      reply.code(404);
      throw new Error('Round not found');
    }

    // Parse and validate limit query parameter
    let leaderboardLimit = 10; // default
    if (request.query.limit) {
      const parsedLimit = parseInt(request.query.limit, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        leaderboardLimit = Math.min(parsedLimit, 50); // max 50
      }
    }

    const now = new Date();
    const status = round.computeStatus(now);

    // Load data in parallel for performance
    const [currentUserParticipant, leaderboardData, allParticipants] = await Promise.all([
      // Load current user's participant record if authenticated
      request.user
        ? roundParticipantRepository.findByRoundAndUser(id, request.user.id)
        : Promise.resolve(null),
      // Load top N participants with usernames
      roundParticipantRepository.findTopByRoundId(id, leaderboardLimit),
      // Load all participants for winner calculation (only if completed)
      status === RoundStatus.COMPLETED
        ? roundParticipantRepository.findByRoundId(id)
        : Promise.resolve([]),
    ]);

    // Find winner if round is completed
    let winner: { userId: string; username: string; score: number } | undefined;
    if (status === RoundStatus.COMPLETED && allParticipants.length > 0) {
      // Sort by score descending, get highest
      const sortedParticipants = [...allParticipants].sort((a, b) => b.score - a.score);
      const winnerParticipant = sortedParticipants[0];

      if (winnerParticipant.score > 0) {
        const winnerUser = await userRepository.findById(winnerParticipant.userId);
        if (winnerUser) {
          winner = {
            userId: winnerUser.id,
            username: winnerUser.username,
            score: winnerParticipant.score,
          };
        }
      }
    }

    return mapRoundToDetailDto(round, {
      winner,
      currentUserParticipant: currentUserParticipant || undefined,
      currentUser: request.user || undefined,
      leaderboardParticipants: leaderboardData,
      now,
    });
  });

  // POST /api/rounds - Create new round (admin only)
  fastify.post<{
    Body: { startDelaySeconds?: number };
  }>(
    '/api/rounds',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            startDelaySeconds: { type: 'number', minimum: 0 },
          },
        },
      },
    },
    async (request, reply) => {
      // Enhanced logging for debugging
      if (options.userRepository) {
        const config = getConfig();
        if (config.NODE_ENV === 'development') {
          const cookieName = config.AUTH_COOKIE_NAME;
          const sessionCookie = request.cookies?.[cookieName];
          fastify.log.warn({
            url: request.url,
            method: request.method,
            hasUser: !!request.user,
            userId: request.user?.id,
            username: request.user?.username,
            cookieKeys: Object.keys(request.cookies || {}),
            sessionCookieValue: sessionCookie ? sessionCookie.substring(0, 50) + '...' : 'MISSING',
            sessionCookieExists: !!sessionCookie,
            cookieHeader: request.headers.cookie ? request.headers.cookie.substring(0, 200) + '...' : 'missing',
          }, '🚨🚨🚨 POST /api/rounds - Route Handler Auth Check');
        }
      }

      if (!request.user) {
        throw new AuthenticationRequiredError();
      }

      if (!request.user.isAdmin()) {
        reply.code(403);
        throw new Error('Only admins can create rounds');
      }

      const { startDelaySeconds } = request.body || {};
      const round = await createRoundService.createRound(request.user.id, startDelaySeconds);
      const now = new Date();

      reply.status(201);
      return mapRoundToListDto(round, now);
    }
  );

  // POST /api/rounds/:id/tap - Tap endpoint
  fastify.post<{
    Params: { id: string };
    Body: { tapCount: number; score: number };
  }>(
    '/api/rounds/:id/tap',
    {
      schema: {
        body: {
          type: 'object',
          required: ['tapCount', 'score'],
          properties: {
            tapCount: { type: 'number', minimum: 0 },
            score: { type: 'number', minimum: 0 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      if (!request.user) {
        throw new AuthenticationRequiredError();
      }

      const { id: roundId } = request.params;
      const { tapCount, score } = request.body;
      const result = await tapService.updateTapCount(roundId, request.user.id, tapCount, score);

      reply.status(200);
      return result;
    }
  );
};

