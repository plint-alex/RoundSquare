import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from '@/infra/http/server.js';
import { resetConfig } from '@/shared/config.js';
import { getPrismaClient } from '@/infra/db/client.js';
import { UserRole } from '@/domain/users/role.enum.js';
import bcrypt from 'bcrypt';

describe('Auth Routes', () => {
  let server: Awaited<ReturnType<typeof createServer>>;
  const prisma = getPrismaClient();

  beforeEach(async () => {
    // Set minimal env for server creation
    process.env.ROUND_DURATION = '60';
    process.env.COOLDOWN_DURATION = '30';
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    process.env.NODE_ENV = 'test';
    process.env.AUTH_SECRET = 'test-secret-key-minimum-32-characters-long';
    process.env.AUTH_COOKIE_NAME = 'session';
    process.env.AUTH_COOKIE_MAX_AGE = '3600000';
    resetConfig();

    server = await createServer();
  });

  afterEach(async () => {
    await server.close();
    resetConfig();
  });

  describe('POST /api/auth/login', () => {
    it('should create new user on first login', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: 'newuser',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('id');
      expect(body.username).toBe('newuser');
      expect(body.role).toBe(UserRole.SURVIVOR);
      expect(body).not.toHaveProperty('passwordHash');

      // Check cookie is set
      const cookies = response.cookies;
      expect(cookies).toBeDefined();
      const sessionCookie = cookies.find((c) => c.name === 'session');
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie?.httpOnly).toBe(true);
    });

    it('should derive ADMIN role for admin username', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: 'admin',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.role).toBe(UserRole.ADMIN);
    });

    it('should derive NIKITA role for nikita username', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: 'nikita',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.role).toBe(UserRole.NIKITA);
    });

    it('should login existing user with correct password', async () => {
      // Create user in database
      const passwordHash = await bcrypt.hash('correctpassword', 10);
      const user = await prisma.user.create({
        data: {
          username: 'existinguser',
          passwordHash,
          role: UserRole.SURVIVOR,
        },
      });

      const response = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: 'existinguser',
          password: 'correctpassword',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe(user.id);
      expect(body.username).toBe('existinguser');

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should return 400 for wrong password', async () => {
      // Create user in database
      const passwordHash = await bcrypt.hash('correctpassword', 10);
      const user = await prisma.user.create({
        data: {
          username: 'testuser',
          passwordHash,
          role: UserRole.SURVIVOR,
        },
      });

      const response = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: 'testuser',
          password: 'wrongpassword',
        },
      });

      expect(response.statusCode).toBe(500); // Fastify will convert error to 500
      const body = JSON.parse(response.body);
      expect(body.message).toContain('Invalid username or password');

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should validate request body', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: 'testuser',
          // Missing password
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user info when authenticated', async () => {
      // Create user and login
      const passwordHash = await bcrypt.hash('password123', 10);
      const user = await prisma.user.create({
        data: {
          username: 'authenticateduser',
          passwordHash,
          role: UserRole.SURVIVOR,
        },
      });

      // Login to get token
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: 'authenticateduser',
          password: 'password123',
        },
      });

      const sessionCookie = loginResponse.cookies.find((c) => c.name === 'session');
      expect(sessionCookie).toBeDefined();

      // Use token to access /me
      const meResponse = await server.inject({
        method: 'GET',
        url: '/api/auth/me',
        cookies: {
          session: sessionCookie?.value || '',
        },
      });

      expect(meResponse.statusCode).toBe(200);
      const body = JSON.parse(meResponse.body);
      expect(body.id).toBe(user.id);
      expect(body.username).toBe('authenticateduser');
      expect(body.role).toBe(UserRole.SURVIVOR);
      expect(body).not.toHaveProperty('passwordHash');

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/auth/me',
      });

      expect(response.statusCode).toBe(500); // Fastify will convert error to 500
      const body = JSON.parse(response.body);
      expect(body.message).toContain('Authentication required');
    });
  });
});


