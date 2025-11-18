import jwt from 'jsonwebtoken';
import { getConfig } from '@/shared/config.js';
import { UserRole } from '@/domain/users/role.enum.js';

export interface TokenPayload {
  userId: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/**
 * Generates a JWT token for a user.
 */
export function generateToken(userId: string, role: UserRole): string {
  const config = getConfig();
  const expiresIn = Math.floor(config.AUTH_COOKIE_MAX_AGE / 1000); // Convert to seconds

  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    userId,
    role,
  };

  return jwt.sign(payload, config.AUTH_SECRET, {
    expiresIn,
    algorithm: 'HS256',
  });
}

/**
 * Verifies and decodes a JWT token.
 * Returns null if token is invalid or expired.
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const config = getConfig();
    const decoded = jwt.verify(token, config.AUTH_SECRET, {
      algorithms: ['HS256'],
    }) as TokenPayload;

    return decoded;
  } catch (error) {
    // Token is invalid, expired, or malformed
    return null;
  }
}


