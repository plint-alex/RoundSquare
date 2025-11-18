import { describe, it, expect, beforeEach } from 'vitest';
import { generateToken, verifyToken } from '@/infra/auth/jwt.service.js';
import { UserRole } from '@/domain/users/role.enum.js';
import { resetConfig } from '@/shared/config.js';

describe('JWT Service', () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = 'test-secret-key-minimum-32-characters-long';
    process.env.AUTH_COOKIE_MAX_AGE = '3600000'; // 1 hour
    process.env.ROUND_DURATION = '60';
    process.env.COOLDOWN_DURATION = '30';
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    resetConfig();
  });

  it('should generate a valid token', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const role = UserRole.ADMIN;

    const token = generateToken(userId, role);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
  });

  it('should verify a valid token', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const role = UserRole.SURVIVOR;

    const token = generateToken(userId, role);
    const decoded = verifyToken(token);

    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(userId);
    expect(decoded?.role).toBe(role);
    expect(decoded?.iat).toBeDefined();
    expect(decoded?.exp).toBeDefined();
  });

  it('should return null for invalid token', () => {
    const invalidToken = 'invalid.token.here';
    const decoded = verifyToken(invalidToken);

    expect(decoded).toBeNull();
  });

  it('should return null for token signed with different secret', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const role = UserRole.ADMIN;

    // Generate token with current secret
    const token = generateToken(userId, role);

    // Change secret
    process.env.AUTH_SECRET = 'different-secret-key-minimum-32-characters';
    resetConfig();

    // Token should be invalid now
    const decoded = verifyToken(token);
    expect(decoded).toBeNull();
  });

  it('should include correct role in token', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';

    const adminToken = generateToken(userId, UserRole.ADMIN);
    const survivorToken = generateToken(userId, UserRole.SURVIVOR);
    const nikitaToken = generateToken(userId, UserRole.NIKITA);

    expect(verifyToken(adminToken)?.role).toBe(UserRole.ADMIN);
    expect(verifyToken(survivorToken)?.role).toBe(UserRole.SURVIVOR);
    expect(verifyToken(nikitaToken)?.role).toBe(UserRole.NIKITA);
  });
});


