import { FastifyPluginAsync, FastifyError } from 'fastify';
import { LoginService } from '@/app/auth/login.service.js';
import { UserRepository } from '@/domain/repositories/user.repository.js';
import { getConfig } from '@/shared/config.js';
import {
  AuthenticationRequiredError,
  InvalidCredentialsError,
} from '@/shared/errors/auth.errors.js';

export interface AuthRoutesOptions {
  loginService: LoginService;
  userRepository: UserRepository;
}

export const authRoutes: FastifyPluginAsync<AuthRoutesOptions> = async (fastify, options) => {
  const { loginService, userRepository } = options;
  const config = getConfig();

  // Error handler for auth errors
  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof InvalidCredentialsError) {
      reply.status(400).send({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: error.message,
        },
      });
      return;
    }

    if (error instanceof AuthenticationRequiredError) {
      reply.status(401).send({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: error.message,
        },
      });
      return;
    }

    // Let Fastify handle other errors
    reply.send(error);
  });

  // POST /api/auth/login
  fastify.post<{
    Body: { username: string; password: string };
  }>(
    '/api/auth/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', minLength: 1 },
            password: { type: 'string', minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { username, password } = request.body;

        const result = await loginService.login(username, password);

      // Set httpOnly cookie with JWT
      reply.setCookie(config.AUTH_COOKIE_NAME, result.token, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: config.NODE_ENV === 'production' ? 'strict' : 'lax', // Use 'lax' in dev for proxy compatibility
        path: '/',
        maxAge: config.AUTH_COOKIE_MAX_AGE / 1000, // Convert to seconds
      });

        // Return user info without password hash
        return {
          id: result.user.id,
          username: result.user.username,
          role: result.user.role,
        };
      } catch (error) {
        // Re-throw to be handled by error handler
        throw error;
      }
    }
  );

  // GET /api/auth/me
  fastify.get('/api/auth/me', async (request, reply) => {
    if (!request.user) {
      throw new AuthenticationRequiredError();
    }

    // Return user info without password hash
    return {
      id: request.user.id,
      username: request.user.username,
      role: request.user.role,
    };
  });

  // POST /api/auth/logout
  fastify.post('/api/auth/logout', async (request, reply) => {
    // Clear the httpOnly cookie by setting it with an expired date
    reply.clearCookie(config.AUTH_COOKIE_NAME, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: config.NODE_ENV === 'production' ? 'strict' : 'lax', // Use 'lax' in dev for proxy compatibility
      path: '/',
    });

    return { message: 'Logged out successfully' };
  });
};

