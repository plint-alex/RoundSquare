import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { getConfig } from '@/shared/config.js';
import { verifyToken } from '@/infra/auth/jwt.service.js';
import { UserRepository } from '@/domain/repositories/user.repository.js';
import { User } from '@/domain/users/user.entity.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: User;
  }
}

export interface AuthPluginOptions {
  userRepository: UserRepository;
}

// Extract hook logic into a reusable function
function createAuthHook(userRepository: UserRepository) {
  const config = getConfig();
  
  return async (request: FastifyRequest) => {
    // ALWAYS log to verify hook is running
    if (config.NODE_ENV === 'development' && request.url.includes('/api/rounds') && request.method === 'POST') {
      request.server.log.error('🔥🔥🔥 AUTH PLUGIN HOOK IS RUNNING!');
    }
    
    const cookieName = config.AUTH_COOKIE_NAME;
    let token: string | undefined;
    
    // First, try to get from parsed cookies (from @fastify/cookie plugin)
    if (request.cookies && request.cookies[cookieName]) {
      token = request.cookies[cookieName];
    }
    
    // Always also check raw cookie header as fallback/primary source
    // This ensures it works even if cookie plugin doesn't parse correctly
    if (!token && request.headers.cookie) {
      const cookieHeader = request.headers.cookie;
      // Parse cookies from header - handle multiple cookies separated by semicolons
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const trimmed = cookie.trim();
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex).trim();
          const value = trimmed.substring(eqIndex + 1).trim();
          // Don't decode JWT tokens - they may contain special characters
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);
      token = cookies[cookieName];
    }

    // Enhanced logging for debugging - ALWAYS log for POST /api/rounds
    if (config.NODE_ENV === 'development' && request.url.includes('/api/rounds') && request.method === 'POST') {
      const cookieKeys = request.cookies ? Object.keys(request.cookies) : [];
      const cookieValues = request.cookies ? Object.keys(request.cookies).reduce((acc, key) => {
        acc[key] = request.cookies![key] ? request.cookies![key].substring(0, 30) + '...' : 'empty';
        return acc;
      }, {} as Record<string, string>) : {};
      const hasCookieHeader = !!request.headers.cookie;
      const cookieHeaderPreview = request.headers.cookie 
        ? (request.headers.cookie.length > 300 
          ? request.headers.cookie.substring(0, 300) + '...' 
          : request.headers.cookie)
        : 'missing';
      
      request.server.log.warn({
        url: request.url,
        method: request.method,
        parsedCookies: cookieKeys,
        cookieValues,
        cookieName,
        hasToken: !!token,
        tokenValue: token ? token.substring(0, 50) + '...' : 'NONE',
        hasCookieHeader,
        cookieHeaderPreview,
        cookiesObject: request.cookies,
      }, `🔍🔍🔍 AUTH PLUGIN CHECK for POST /api/rounds`);
    }

    if (!token) {
      request.user = undefined;
      return;
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      if (config.NODE_ENV === 'development') {
        request.server.log.warn({ 
          tokenPreview: token.substring(0, 50) + '...',
          tokenLength: token.length,
          url: request.url 
        }, '❌ Token verification failed');
      }
      request.user = undefined;
      return;
    }

    // Load user from repository
    const user = await userRepository.findById(decoded.userId);

    if (!user) {
      if (config.NODE_ENV === 'development') {
        request.server.log.warn({ userId: decoded.userId, url: request.url }, '❌ User not found in database');
      }
      request.user = undefined;
      return;
    }

    if (config.NODE_ENV === 'development' && request.url.includes('/api/rounds') && request.method === 'POST') {
      request.server.log.info({ 
        userId: user.id, 
        username: user.username, 
        role: user.role 
      }, '✅ Authentication successful');
    }

    request.user = user;
  };
}

// Export function to register hook at root level
export function registerAuthHook(fastify: any, userRepository: UserRepository): void {
  // Decorate request with user
  fastify.decorateRequest('user', undefined);
  
  // Register the hook at root level
  fastify.addHook('preHandler', createAuthHook(userRepository));
}

export const authPlugin: FastifyPluginAsync<AuthPluginOptions> = async (fastify, options) => {
  const { userRepository } = options;

  // Decorate request with user
  fastify.decorateRequest('user', undefined);

  // Add hook to authenticate requests
  // Use 'preHandler' instead of 'onRequest' to ensure cookies are parsed first
  fastify.addHook('preHandler', createAuthHook(userRepository));
};


