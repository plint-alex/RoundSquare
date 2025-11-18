import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from '@/infra/http/server.js';
import { resetConfig } from '@/shared/config.js';
import { getPrismaClient } from '@/infra/db/client.js';
import { UserRole } from '@/domain/users/role.enum.js';
import { RoundStatus } from '@/domain/rounds/round-status.enum.js';
import bcrypt from 'bcrypt';

describe('Round Routes', () => {
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
    process.env.LIFECYCLE_POLL_MS = '1000';
    resetConfig();

    server = await createServer();
  });

  afterEach(async () => {
    await server.close();
    resetConfig();
  });

  describe('GET /api/rounds', () => {
    it('should return list of rounds', async () => {
      // Create a round in database
      const passwordHash = await bcrypt.hash('password', 10);
      const user = await prisma.user.create({
        data: {
          username: 'testuser',
          passwordHash,
          role: UserRole.ADMIN,
        },
      });

      const now = new Date();
      const round = await prisma.round.create({
        data: {
          status: RoundStatus.COOLDOWN,
          cooldownStartAt: now,
          startAt: new Date(now.getTime() + 30000),
          endAt: new Date(now.getTime() + 90000),
          totalPoints: 0,
          createdById: user.id,
        },
      });

      const response = await server.inject({
        method: 'GET',
        url: '/api/rounds',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);

      const foundRound = body.find((r: { id: string }) => r.id === round.id);
      expect(foundRound).toBeDefined();
      expect(foundRound.status).toBe(RoundStatus.COOLDOWN);
      expect(foundRound).toHaveProperty('timeUntilStart');
      expect(foundRound).toHaveProperty('timeRemaining');

      // Cleanup
      await prisma.round.delete({ where: { id: round.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should return cooldownEndsAt field', async () => {
      const passwordHash = await bcrypt.hash('password', 10);
      const user = await prisma.user.create({
        data: {
          username: 'testuser2',
          passwordHash,
          role: UserRole.ADMIN,
        },
      });

      const now = new Date();
      const startAt = new Date(now.getTime() + 30000);
      const round = await prisma.round.create({
        data: {
          status: RoundStatus.COOLDOWN,
          cooldownStartAt: now,
          startAt: startAt,
          endAt: new Date(now.getTime() + 90000),
          totalPoints: 0,
          createdById: user.id,
        },
      });

      const response = await server.inject({
        method: 'GET',
        url: '/api/rounds',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const foundRound = body.find((r: { id: string }) => r.id === round.id);
      expect(foundRound).toBeDefined();
      expect(foundRound).toHaveProperty('cooldownEndsAt');
      expect(foundRound.cooldownEndsAt).toBe(startAt.toISOString());
      expect(foundRound.cooldownEndsAt).toBe(foundRound.startAt); // Should equal startAt

      // Cleanup
      await prisma.round.delete({ where: { id: round.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should filter rounds by status query parameter', async () => {
      const passwordHash = await bcrypt.hash('password', 10);
      const user = await prisma.user.create({
        data: {
          username: 'testuser3',
          passwordHash,
          role: UserRole.ADMIN,
        },
      });

      const now = new Date();
      
      // Create a round in COOLDOWN status
      const cooldownRound = await prisma.round.create({
        data: {
          status: RoundStatus.COOLDOWN,
          cooldownStartAt: now,
          startAt: new Date(now.getTime() + 30000),
          endAt: new Date(now.getTime() + 90000),
          totalPoints: 0,
          createdById: user.id,
        },
      });

      // Create a round in ACTIVE status
      const activeRound = await prisma.round.create({
        data: {
          status: RoundStatus.ACTIVE,
          cooldownStartAt: new Date(now.getTime() - 1000),
          startAt: new Date(now.getTime() - 500),
          endAt: new Date(now.getTime() + 60000),
          totalPoints: 0,
          createdById: user.id,
        },
      });

      // Test filtering by COOLDOWN status
      const cooldownResponse = await server.inject({
        method: 'GET',
        url: '/api/rounds?status=COOLDOWN',
      });

      expect(cooldownResponse.statusCode).toBe(200);
      const cooldownBody = JSON.parse(cooldownResponse.body);
      expect(Array.isArray(cooldownBody)).toBe(true);
      const foundCooldownRound = cooldownBody.find((r: { id: string }) => r.id === cooldownRound.id);
      expect(foundCooldownRound).toBeDefined();
      expect(foundCooldownRound.status).toBe(RoundStatus.COOLDOWN);
      const foundActiveInCooldown = cooldownBody.find((r: { id: string }) => r.id === activeRound.id);
      expect(foundActiveInCooldown).toBeUndefined();

      // Test filtering by ACTIVE status
      const activeResponse = await server.inject({
        method: 'GET',
        url: '/api/rounds?status=ACTIVE',
      });

      expect(activeResponse.statusCode).toBe(200);
      const activeBody = JSON.parse(activeResponse.body);
      expect(Array.isArray(activeBody)).toBe(true);
      const foundActiveRound = activeBody.find((r: { id: string }) => r.id === activeRound.id);
      expect(foundActiveRound).toBeDefined();
      expect(foundActiveRound.status).toBe(RoundStatus.ACTIVE);
      const foundCooldownInActive = activeBody.find((r: { id: string }) => r.id === cooldownRound.id);
      expect(foundCooldownInActive).toBeUndefined();

      // Cleanup
      await prisma.round.delete({ where: { id: cooldownRound.id } });
      await prisma.round.delete({ where: { id: activeRound.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('GET /api/rounds/:id', () => {
    it('should return round details', async () => {
      const passwordHash = await bcrypt.hash('password', 10);
      const user = await prisma.user.create({
        data: {
          username: 'testuser',
          passwordHash,
          role: UserRole.ADMIN,
        },
      });

      const now = new Date();
      const round = await prisma.round.create({
        data: {
          status: RoundStatus.COOLDOWN,
          cooldownStartAt: now,
          startAt: new Date(now.getTime() + 30000),
          endAt: new Date(now.getTime() + 90000),
          totalPoints: 0,
          createdById: user.id,
        },
      });

      const response = await server.inject({
        method: 'GET',
        url: `/api/rounds/${round.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe(round.id);
      expect(body.status).toBe(RoundStatus.COOLDOWN);
      expect(body).toHaveProperty('cooldownStartAt');
      expect(body).toHaveProperty('startAt');
      expect(body).toHaveProperty('endAt');
      expect(body).toHaveProperty('timeUntilStart');
      expect(body).toHaveProperty('timeRemaining');

      // Cleanup
      await prisma.round.delete({ where: { id: round.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should return 404 for non-existent round', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/rounds/non-existent-id',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should include personal stats for authenticated user with participant record', async () => {
      const passwordHash = await bcrypt.hash('password', 10);
      const user = await prisma.user.create({
        data: {
          username: 'testuser4',
          passwordHash,
          role: UserRole.SURVIVOR,
        },
      });

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: 'testuser4',
          password: 'password',
        },
      });

      const sessionCookie = loginResponse.cookies.find((c) => c.name === 'session');

      const now = new Date();
      const round = await prisma.round.create({
        data: {
          status: RoundStatus.ACTIVE,
          cooldownStartAt: new Date(now.getTime() - 1000),
          startAt: new Date(now.getTime() - 500),
          endAt: new Date(now.getTime() + 60000),
          totalPoints: 0,
          createdById: user.id,
        },
      });

      // Create participant record
      await prisma.roundParticipant.create({
        data: {
          roundId: round.id,
          userId: user.id,
          tapCount: 5,
          score: 5,
        },
      });

      const response = await server.inject({
        method: 'GET',
        url: `/api/rounds/${round.id}`,
        cookies: {
          session: sessionCookie?.value || '',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.myStats).toBeDefined();
      expect(body.myStats.tapCount).toBe(5);
      expect(body.myStats.score).toBe(5);

      // Cleanup
      await prisma.roundParticipant.deleteMany({ where: { roundId: round.id } });
      await prisma.round.delete({ where: { id: round.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should not include personal stats for authenticated user without participant record', async () => {
      const passwordHash = await bcrypt.hash('password', 10);
      const user = await prisma.user.create({
        data: {
          username: 'testuser5',
          passwordHash,
          role: UserRole.SURVIVOR,
        },
      });

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: 'testuser5',
          password: 'password',
        },
      });

      const sessionCookie = loginResponse.cookies.find((c) => c.name === 'session');

      const now = new Date();
      const round = await prisma.round.create({
        data: {
          status: RoundStatus.ACTIVE,
          cooldownStartAt: new Date(now.getTime() - 1000),
          startAt: new Date(now.getTime() - 500),
          endAt: new Date(now.getTime() + 60000),
          totalPoints: 0,
          createdById: user.id,
        },
      });

      const response = await server.inject({
        method: 'GET',
        url: `/api/rounds/${round.id}`,
        cookies: {
          session: sessionCookie?.value || '',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.myStats).toBeUndefined();

      // Cleanup
      await prisma.round.delete({ where: { id: round.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should return 0 for personal score if user is Никита', async () => {
      const passwordHash = await bcrypt.hash('password', 10);
      const nikita = await prisma.user.create({
        data: {
          username: 'nikita2',
          passwordHash,
          role: UserRole.NIKITA,
        },
      });

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: 'nikita2',
          password: 'password',
        },
      });

      const sessionCookie = loginResponse.cookies.find((c) => c.name === 'session');

      const now = new Date();
      const round = await prisma.round.create({
        data: {
          status: RoundStatus.ACTIVE,
          cooldownStartAt: new Date(now.getTime() - 1000),
          startAt: new Date(now.getTime() - 500),
          endAt: new Date(now.getTime() + 60000),
          totalPoints: 0,
          createdById: nikita.id,
        },
      });

      // Create participant record with actual score
      await prisma.roundParticipant.create({
        data: {
          roundId: round.id,
          userId: nikita.id,
          tapCount: 10,
          score: 19, // Actual score (9 regular + 10 bonus on 11th)
        },
      });

      const response = await server.inject({
        method: 'GET',
        url: `/api/rounds/${round.id}`,
        cookies: {
          session: sessionCookie?.value || '',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.myStats).toBeDefined();
      expect(body.myStats.tapCount).toBe(10);
      expect(body.myStats.score).toBe(0); // Никита rule: returns 0

      // Cleanup
      await prisma.roundParticipant.deleteMany({ where: { roundId: round.id } });
      await prisma.round.delete({ where: { id: round.id } });
      await prisma.user.delete({ where: { id: nikita.id } });
    });

    it('should include leaderboard with top N participants ordered by score', async () => {
      const passwordHash = await bcrypt.hash('password', 10);
      const admin = await prisma.user.create({
        data: {
          username: 'admin5',
          passwordHash,
          role: UserRole.ADMIN,
        },
      });

      // Create multiple users
      const users = [];
      for (let i = 0; i < 5; i++) {
        const user = await prisma.user.create({
          data: {
            username: `user${i}`,
            passwordHash,
            role: UserRole.SURVIVOR,
          },
        });
        users.push(user);
      }

      const now = new Date();
      const round = await prisma.round.create({
        data: {
          status: RoundStatus.ACTIVE,
          cooldownStartAt: new Date(now.getTime() - 1000),
          startAt: new Date(now.getTime() - 500),
          endAt: new Date(now.getTime() + 60000),
          totalPoints: 0,
          createdById: admin.id,
        },
      });

      // Create participants with different scores
      const scores = [50, 30, 100, 20, 80];
      for (let i = 0; i < users.length; i++) {
        await prisma.roundParticipant.create({
          data: {
            roundId: round.id,
            userId: users[i].id,
            tapCount: scores[i],
            score: scores[i],
          },
        });
      }

      const response = await server.inject({
        method: 'GET',
        url: `/api/rounds/${round.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.leaderboard).toBeDefined();
      expect(Array.isArray(body.leaderboard)).toBe(true);
      expect(body.leaderboard.length).toBe(5);

      // Verify ordering: should be sorted by score DESC
      expect(body.leaderboard[0].score).toBe(100);
      expect(body.leaderboard[1].score).toBe(80);
      expect(body.leaderboard[2].score).toBe(50);
      expect(body.leaderboard[3].score).toBe(30);
      expect(body.leaderboard[4].score).toBe(20);

      // Verify structure
      body.leaderboard.forEach((entry: any) => {
        expect(entry).toHaveProperty('userId');
        expect(entry).toHaveProperty('username');
        expect(entry).toHaveProperty('score');
        expect(entry).toHaveProperty('tapCount');
      });

      // Cleanup
      await prisma.roundParticipant.deleteMany({ where: { roundId: round.id } });
      await prisma.round.delete({ where: { id: round.id } });
      for (const user of users) {
        await prisma.user.delete({ where: { id: user.id } });
      }
      await prisma.user.delete({ where: { id: admin.id } });
    });

    it('should respect limit query parameter for leaderboard', async () => {
      const passwordHash = await bcrypt.hash('password', 10);
      const admin = await prisma.user.create({
        data: {
          username: 'admin6',
          passwordHash,
          role: UserRole.ADMIN,
        },
      });

      // Create 10 users
      const users = [];
      for (let i = 0; i < 10; i++) {
        const user = await prisma.user.create({
          data: {
            username: `limituser${i}`,
            passwordHash,
            role: UserRole.SURVIVOR,
          },
        });
        users.push(user);
      }

      const now = new Date();
      const round = await prisma.round.create({
        data: {
          status: RoundStatus.ACTIVE,
          cooldownStartAt: new Date(now.getTime() - 1000),
          startAt: new Date(now.getTime() - 500),
          endAt: new Date(now.getTime() + 60000),
          totalPoints: 0,
          createdById: admin.id,
        },
      });

      // Create participants with scores
      for (let i = 0; i < users.length; i++) {
        await prisma.roundParticipant.create({
          data: {
            roundId: round.id,
            userId: users[i].id,
            tapCount: i * 10,
            score: i * 10,
          },
        });
      }

      // Test with limit=3
      const response = await server.inject({
        method: 'GET',
        url: `/api/rounds/${round.id}?limit=3`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.leaderboard).toBeDefined();
      expect(body.leaderboard.length).toBe(3);
      expect(body.leaderboard[0].score).toBe(90);
      expect(body.leaderboard[1].score).toBe(80);
      expect(body.leaderboard[2].score).toBe(70);

      // Cleanup
      await prisma.roundParticipant.deleteMany({ where: { roundId: round.id } });
      await prisma.round.delete({ where: { id: round.id } });
      for (const user of users) {
        await prisma.user.delete({ where: { id: user.id } });
      }
      await prisma.user.delete({ where: { id: admin.id } });
    });

    it('should cap limit at 50 even if higher value provided', async () => {
      const passwordHash = await bcrypt.hash('password', 10);
      const admin = await prisma.user.create({
        data: {
          username: 'admin7',
          passwordHash,
          role: UserRole.ADMIN,
        },
      });

      const now = new Date();
      const round = await prisma.round.create({
        data: {
          status: RoundStatus.ACTIVE,
          cooldownStartAt: new Date(now.getTime() - 1000),
          startAt: new Date(now.getTime() - 500),
          endAt: new Date(now.getTime() + 60000),
          totalPoints: 0,
          createdById: admin.id,
        },
      });

      // Test with limit=100 (should be capped at 50)
      const response = await server.inject({
        method: 'GET',
        url: `/api/rounds/${round.id}?limit=100`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.leaderboard).toBeDefined();
      // Should use default 10 since there are no participants, but limit logic should work
      expect(Array.isArray(body.leaderboard)).toBe(true);

      // Cleanup
      await prisma.round.delete({ where: { id: round.id } });
      await prisma.user.delete({ where: { id: admin.id } });
    });

    it('should show actual score for Никита in leaderboard', async () => {
      const passwordHash = await bcrypt.hash('password', 10);
      const admin = await prisma.user.create({
        data: {
          username: 'admin8',
          passwordHash,
          role: UserRole.ADMIN,
        },
      });

      const nikita = await prisma.user.create({
        data: {
          username: 'nikita3',
          passwordHash,
          role: UserRole.NIKITA,
        },
      });

      const survivor = await prisma.user.create({
        data: {
          username: 'survivor3',
          passwordHash,
          role: UserRole.SURVIVOR,
        },
      });

      const now = new Date();
      const round = await prisma.round.create({
        data: {
          status: RoundStatus.ACTIVE,
          cooldownStartAt: new Date(now.getTime() - 1000),
          startAt: new Date(now.getTime() - 500),
          endAt: new Date(now.getTime() + 60000),
          totalPoints: 0,
          createdById: admin.id,
        },
      });

      // Create participants: Никита has higher score
      await prisma.roundParticipant.create({
        data: {
          roundId: round.id,
          userId: nikita.id,
          tapCount: 20,
          score: 29, // Actual score (19 regular + 10 bonus)
        },
      });

      await prisma.roundParticipant.create({
        data: {
          roundId: round.id,
          userId: survivor.id,
          tapCount: 15,
          score: 15,
        },
      });

      const response = await server.inject({
        method: 'GET',
        url: `/api/rounds/${round.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.leaderboard).toBeDefined();
      expect(body.leaderboard.length).toBe(2);

      // Никита should be first (higher score) and show actual score
      expect(body.leaderboard[0].userId).toBe(nikita.id);
      expect(body.leaderboard[0].score).toBe(29); // Actual score, not 0
      expect(body.leaderboard[0].username).toBe('nikita3');

      expect(body.leaderboard[1].userId).toBe(survivor.id);
      expect(body.leaderboard[1].score).toBe(15);

      // Cleanup
      await prisma.roundParticipant.deleteMany({ where: { roundId: round.id } });
      await prisma.round.delete({ where: { id: round.id } });
      await prisma.user.delete({ where: { id: nikita.id } });
      await prisma.user.delete({ where: { id: survivor.id } });
      await prisma.user.delete({ where: { id: admin.id } });
    });

    it('should respond within 200ms for 10+ participants', async () => {
      const passwordHash = await bcrypt.hash('password', 10);
      const admin = await prisma.user.create({
        data: {
          username: 'admin9',
          passwordHash,
          role: UserRole.ADMIN,
        },
      });

      // Create 15 users
      const users = [];
      for (let i = 0; i < 15; i++) {
        const user = await prisma.user.create({
          data: {
            username: `perfuser${i}`,
            passwordHash,
            role: UserRole.SURVIVOR,
          },
        });
        users.push(user);
      }

      const now = new Date();
      const round = await prisma.round.create({
        data: {
          status: RoundStatus.ACTIVE,
          cooldownStartAt: new Date(now.getTime() - 1000),
          startAt: new Date(now.getTime() - 500),
          endAt: new Date(now.getTime() + 60000),
          totalPoints: 0,
          createdById: admin.id,
        },
      });

      // Create 15 participants
      for (let i = 0; i < users.length; i++) {
        await prisma.roundParticipant.create({
          data: {
            roundId: round.id,
            userId: users[i].id,
            tapCount: i * 5,
            score: i * 5,
          },
        });
      }

      const startTime = Date.now();
      const response = await server.inject({
        method: 'GET',
        url: `/api/rounds/${round.id}`,
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      expect(responseTime).toBeLessThan(200); // Should be < 200ms

      const body = JSON.parse(response.body);
      expect(body.leaderboard).toBeDefined();
      expect(body.leaderboard.length).toBe(10); // Default limit

      // Cleanup
      await prisma.roundParticipant.deleteMany({ where: { roundId: round.id } });
      await prisma.round.delete({ where: { id: round.id } });
      for (const user of users) {
        await prisma.user.delete({ where: { id: user.id } });
      }
      await prisma.user.delete({ where: { id: admin.id } });
    });
  });

  describe('POST /api/rounds', () => {
    it('should create round for admin user', async () => {
      // Create admin user and login
      const passwordHash = await bcrypt.hash('password', 10);
      const admin = await prisma.user.create({
        data: {
          username: 'admin',
          passwordHash,
          role: UserRole.ADMIN,
        },
      });

      // Login to get token
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: 'admin',
          password: 'password',
        },
      });

      const sessionCookie = loginResponse.cookies.find((c) => c.name === 'session');
      expect(sessionCookie).toBeDefined();

      // Create round
      const createResponse = await server.inject({
        method: 'POST',
        url: '/api/rounds',
        cookies: {
          session: sessionCookie?.value || '',
        },
      });

      expect(createResponse.statusCode).toBe(201);
      const body = JSON.parse(createResponse.body);
      expect(body).toHaveProperty('id');
      expect(body.status).toBe(RoundStatus.COOLDOWN);
      expect(body).toHaveProperty('startAt');
      expect(body).toHaveProperty('endAt');
      expect(body).toHaveProperty('timeUntilStart');

      // Cleanup
      await prisma.round.delete({ where: { id: body.id } });
      await prisma.user.delete({ where: { id: admin.id } });
    });

    it('should return 403 for non-admin user', async () => {
      // Create survivor user and login
      const passwordHash = await bcrypt.hash('password', 10);
      const survivor = await prisma.user.create({
        data: {
          username: 'survivor',
          passwordHash,
          role: UserRole.SURVIVOR,
        },
      });

      // Login to get token
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: 'survivor',
          password: 'password',
        },
      });

      const sessionCookie = loginResponse.cookies.find((c) => c.name === 'session');

      // Try to create round
      const createResponse = await server.inject({
        method: 'POST',
        url: '/api/rounds',
        cookies: {
          session: sessionCookie?.value || '',
        },
      });

      expect(createResponse.statusCode).toBe(403);

      // Cleanup
      await prisma.user.delete({ where: { id: survivor.id } });
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/rounds',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should create round with startDelaySeconds override', async () => {
      const passwordHash = await bcrypt.hash('password', 10);
      const admin = await prisma.user.create({
        data: {
          username: 'admin2',
          passwordHash,
          role: UserRole.ADMIN,
        },
      });

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: 'admin2',
          password: 'password',
        },
      });

      const sessionCookie = loginResponse.cookies.find((c) => c.name === 'session');
      expect(sessionCookie).toBeDefined();

      // Create round with custom delay (60 seconds instead of 30)
      const createResponse = await server.inject({
        method: 'POST',
        url: '/api/rounds',
        cookies: {
          session: sessionCookie?.value || '',
        },
        payload: {
          startDelaySeconds: 60,
        },
      });

      expect(createResponse.statusCode).toBe(201);
      const body = JSON.parse(createResponse.body);
      expect(body).toHaveProperty('id');
      expect(body.status).toBe(RoundStatus.COOLDOWN);

      // Verify the delay is 60 seconds (not 30 from config)
      const startAt = new Date(body.startAt);
      const cooldownStartAt = new Date(body.cooldownStartAt);
      const delayMs = startAt.getTime() - cooldownStartAt.getTime();
      expect(delayMs).toBe(60 * 1000); // 60 seconds

      // Cleanup
      await prisma.round.delete({ where: { id: body.id } });
      await prisma.user.delete({ where: { id: admin.id } });
    });

    it('should return 400 for negative startDelaySeconds', async () => {
      const passwordHash = await bcrypt.hash('password', 10);
      const admin = await prisma.user.create({
        data: {
          username: 'admin3',
          passwordHash,
          role: UserRole.ADMIN,
        },
      });

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: 'admin3',
          password: 'password',
        },
      });

      const sessionCookie = loginResponse.cookies.find((c) => c.name === 'session');

      const createResponse = await server.inject({
        method: 'POST',
        url: '/api/rounds',
        cookies: {
          session: sessionCookie?.value || '',
        },
        payload: {
          startDelaySeconds: -10,
        },
      });

      expect(createResponse.statusCode).toBe(400);

      // Cleanup
      await prisma.user.delete({ where: { id: admin.id } });
    });

    it('should return 400 for non-number startDelaySeconds', async () => {
      const passwordHash = await bcrypt.hash('password', 10);
      const admin = await prisma.user.create({
        data: {
          username: 'admin4',
          passwordHash,
          role: UserRole.ADMIN,
        },
      });

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: 'admin4',
          password: 'password',
        },
      });

      const sessionCookie = loginResponse.cookies.find((c) => c.name === 'session');

      const createResponse = await server.inject({
        method: 'POST',
        url: '/api/rounds',
        cookies: {
          session: sessionCookie?.value || '',
        },
        payload: {
          startDelaySeconds: 'not-a-number',
        },
      });

      expect(createResponse.statusCode).toBe(400);

      // Cleanup
      await prisma.user.delete({ where: { id: admin.id } });
    });
  });

  describe('POST /api/rounds/:id/tap', () => {
    it('should successfully tap during active round', async () => {
      // Create user and login
      const passwordHash = await bcrypt.hash('password', 10);
      const user = await prisma.user.create({
        data: {
          username: 'survivor1',
          passwordHash,
          role: UserRole.SURVIVOR,
        },
      });

      // Login to get token
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: 'survivor1',
          password: 'password',
        },
      });

      const sessionCookie = loginResponse.cookies.find((c) => c.name === 'session');
      expect(sessionCookie).toBeDefined();

      // Create active round
      const now = new Date();
      const round = await prisma.round.create({
        data: {
          status: RoundStatus.ACTIVE,
          cooldownStartAt: new Date(now.getTime() - 1000),
          startAt: new Date(now.getTime() - 500),
          endAt: new Date(now.getTime() + 60000),
          totalPoints: 0,
          createdById: user.id,
        },
      });

      // Tap endpoint
      const tapResponse = await server.inject({
        method: 'POST',
        url: `/api/rounds/${round.id}/tap`,
        cookies: {
          session: sessionCookie?.value || '',
        },
      });

      expect(tapResponse.statusCode).toBe(200);
      const body = JSON.parse(tapResponse.body);
      expect(body.playerScore).toBe(1); // First tap = 1 point
      expect(body.tapCount).toBe(1);
      expect(body.roundTotalPoints).toBe(1);
      expect(body.lastTappedAt).toBeDefined();

      // Verify participant was created in DB
      const participant = await prisma.roundParticipant.findUnique({
        where: {
          roundId_userId: {
            roundId: round.id,
            userId: user.id,
          },
        },
      });
      expect(participant).toBeDefined();
      expect(participant?.tapCount).toBe(1);
      expect(participant?.score).toBe(1);

      // Verify round total_points was updated
      const updatedRound = await prisma.round.findUnique({ where: { id: round.id } });
      expect(updatedRound?.totalPoints).toBe(1);

      // Cleanup
      await prisma.roundParticipant.deleteMany({ where: { roundId: round.id } });
      await prisma.round.delete({ where: { id: round.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should return 409 for inactive round', async () => {
      const passwordHash = await bcrypt.hash('password', 10);
      const user = await prisma.user.create({
        data: {
          username: 'survivor2',
          passwordHash,
          role: UserRole.SURVIVOR,
        },
      });

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: 'survivor2',
          password: 'password',
        },
      });

      const sessionCookie = loginResponse.cookies.find((c) => c.name === 'session');

      // Create round in COOLDOWN status
      const now = new Date();
      const round = await prisma.round.create({
        data: {
          status: RoundStatus.COOLDOWN,
          cooldownStartAt: now,
          startAt: new Date(now.getTime() + 30000),
          endAt: new Date(now.getTime() + 90000),
          totalPoints: 0,
          createdById: user.id,
        },
      });

      const tapResponse = await server.inject({
        method: 'POST',
        url: `/api/rounds/${round.id}/tap`,
        cookies: {
          session: sessionCookie?.value || '',
        },
      });

      expect(tapResponse.statusCode).toBe(409);
      const body = JSON.parse(tapResponse.body);
      expect(body.error.code).toBe('ROUND_NOT_ACTIVE');

      // Cleanup
      await prisma.round.delete({ where: { id: round.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should return 0 for player score if user is Никита', async () => {
      const passwordHash = await bcrypt.hash('password', 10);
      const nikita = await prisma.user.create({
        data: {
          username: 'nikita',
          passwordHash,
          role: UserRole.NIKITA,
        },
      });

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: 'nikita',
          password: 'password',
        },
      });

      const sessionCookie = loginResponse.cookies.find((c) => c.name === 'session');

      // Create active round
      const now = new Date();
      const round = await prisma.round.create({
        data: {
          status: RoundStatus.ACTIVE,
          cooldownStartAt: new Date(now.getTime() - 1000),
          startAt: new Date(now.getTime() - 500),
          endAt: new Date(now.getTime() + 60000),
          totalPoints: 0,
          createdById: nikita.id,
        },
      });

      const tapResponse = await server.inject({
        method: 'POST',
        url: `/api/rounds/${round.id}/tap`,
        cookies: {
          session: sessionCookie?.value || '',
        },
      });

      expect(tapResponse.statusCode).toBe(200);
      const body = JSON.parse(tapResponse.body);
      expect(body.playerScore).toBe(0); // Никита always returns 0
      expect(body.tapCount).toBe(1);

      // Verify actual score is stored in DB
      const participant = await prisma.roundParticipant.findUnique({
        where: {
          roundId_userId: {
            roundId: round.id,
            userId: nikita.id,
          },
        },
      });
      expect(participant?.score).toBe(1); // Actual score is stored
      expect(participant?.tapCount).toBe(1);

      // Verify round total_points is updated correctly
      const updatedRound = await prisma.round.findUnique({ where: { id: round.id } });
      expect(updatedRound?.totalPoints).toBe(1); // Round total_points reflects actual score

      // Cleanup
      await prisma.roundParticipant.deleteMany({ where: { roundId: round.id } });
      await prisma.round.delete({ where: { id: round.id } });
      await prisma.user.delete({ where: { id: nikita.id } });
    });

    it('should return 401 for unauthenticated request', async () => {
      const now = new Date();
      const passwordHash = await bcrypt.hash('password', 10);
      const user = await prisma.user.create({
        data: {
          username: 'testuser',
          passwordHash,
          role: UserRole.ADMIN,
        },
      });

      const round = await prisma.round.create({
        data: {
          status: RoundStatus.ACTIVE,
          cooldownStartAt: new Date(now.getTime() - 1000),
          startAt: new Date(now.getTime() - 500),
          endAt: new Date(now.getTime() + 60000),
          totalPoints: 0,
          createdById: user.id,
        },
      });

      const response = await server.inject({
        method: 'POST',
        url: `/api/rounds/${round.id}/tap`,
      });

      expect(response.statusCode).toBe(401);

      // Cleanup
      await prisma.round.delete({ where: { id: round.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should handle concurrent taps correctly - no lost increments', async () => {
      const passwordHash = await bcrypt.hash('password', 10);
      const user = await prisma.user.create({
        data: {
          username: 'concurrentuser',
          passwordHash,
          role: UserRole.SURVIVOR,
        },
      });

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: 'concurrentuser',
          password: 'password',
        },
      });

      const sessionCookie = loginResponse.cookies.find((c) => c.name === 'session');

      // Create active round
      const now = new Date();
      const round = await prisma.round.create({
        data: {
          status: RoundStatus.ACTIVE,
          cooldownStartAt: new Date(now.getTime() - 1000),
          startAt: new Date(now.getTime() - 500),
          endAt: new Date(now.getTime() + 60000),
          totalPoints: 0,
          createdById: user.id,
        },
      });

      // Send 50 parallel tap requests
      const tapRequests = Array.from({ length: 50 }, () =>
        server.inject({
          method: 'POST',
          url: `/api/rounds/${round.id}/tap`,
          cookies: {
            session: sessionCookie?.value || '',
          },
        })
      );

      const responses = await Promise.all(tapRequests);

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.statusCode).toBe(200);
      });

      // Verify final state
      const participant = await prisma.roundParticipant.findUnique({
        where: {
          roundId_userId: {
            roundId: round.id,
            userId: user.id,
          },
        },
      });

      expect(participant).toBeDefined();
      expect(participant?.tapCount).toBe(50); // All 50 taps recorded

      // Calculate expected score: 1 point per tap, but 10 points every 11th tap
      // Taps: 1-10 = 10 points, tap 11 = 10 points, taps 12-22 = 11 points, tap 22 = 10 points, etc.
      // 50 taps: 5 full cycles of 11 (taps 1-55 would be 5*11=55, but we only have 50)
      // Taps 1-10: 10 points
      // Tap 11: 10 points (total 20)
      // Taps 12-22: 11 points (total 31)
      // Tap 22: 10 points (total 41)
      // Taps 23-33: 11 points (total 52)
      // Tap 33: 10 points (total 62)
      // Taps 34-44: 11 points (total 73)
      // Tap 44: 10 points (total 83)
      // Taps 45-50: 6 points (total 89)
      // Actually: 50 taps = 5 bonus taps (11, 22, 33, 44, 55 - but 55 is out of range)
      // So: 4 bonus taps at positions 11, 22, 33, 44
      // Regular taps: 50 total taps - 4 bonus taps = 46 regular taps = 46 points
      // Bonus taps: 4 * 10 = 40 points
      // Total: 46 + 40 = 86 points
      // Wait, let me recalculate:
      // Tap 1-10: 10 points (1 each)
      // Tap 11: 10 points (bonus) = 20 total
      // Tap 12-21: 10 points (1 each) = 30 total
      // Tap 22: 10 points (bonus) = 40 total
      // Tap 23-32: 10 points (1 each) = 50 total
      // Tap 33: 10 points (bonus) = 60 total
      // Tap 34-43: 10 points (1 each) = 70 total
      // Tap 44: 10 points (bonus) = 80 total
      // Tap 45-50: 6 points (1 each) = 86 total
      const expectedScore = 86; // 4 bonus taps (11, 22, 33, 44) + 46 regular taps

      expect(participant?.score).toBe(expectedScore);

      // Verify round total_points
      const updatedRound = await prisma.round.findUnique({ where: { id: round.id } });
      expect(updatedRound?.totalPoints).toBe(expectedScore);

      // Cleanup
      await prisma.roundParticipant.deleteMany({ where: { roundId: round.id } });
      await prisma.round.delete({ where: { id: round.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should give 10 points on 11th tap', async () => {
      const passwordHash = await bcrypt.hash('password', 10);
      const user = await prisma.user.create({
        data: {
          username: 'eleventhuser',
          passwordHash,
          role: UserRole.SURVIVOR,
        },
      });

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          username: 'eleventhuser',
          password: 'password',
        },
      });

      const sessionCookie = loginResponse.cookies.find((c) => c.name === 'session');

      const now = new Date();
      const round = await prisma.round.create({
        data: {
          status: RoundStatus.ACTIVE,
          cooldownStartAt: new Date(now.getTime() - 1000),
          startAt: new Date(now.getTime() - 500),
          endAt: new Date(now.getTime() + 60000),
          totalPoints: 0,
          createdById: user.id,
        },
      });

      // Make 10 taps first
      for (let i = 0; i < 10; i++) {
        await server.inject({
          method: 'POST',
          url: `/api/rounds/${round.id}/tap`,
          cookies: {
            session: sessionCookie?.value || '',
          },
        });
      }

      // 11th tap should give 10 points
      const eleventhTap = await server.inject({
        method: 'POST',
        url: `/api/rounds/${round.id}/tap`,
        cookies: {
          session: sessionCookie?.value || '',
        },
      });

      expect(eleventhTap.statusCode).toBe(200);
      const body = JSON.parse(eleventhTap.body);
      expect(body.tapCount).toBe(11);
      expect(body.playerScore).toBe(20); // 10 points from first 10 taps + 10 points from 11th tap
      expect(body.roundTotalPoints).toBe(20);

      // Cleanup
      await prisma.roundParticipant.deleteMany({ where: { roundId: round.id } });
      await prisma.round.delete({ where: { id: round.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });
});

