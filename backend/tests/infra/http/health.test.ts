import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from '@/infra/http/server.js';
import { resetConfig } from '@/shared/config.js';

describe('Health Endpoint', () => {
  let server: Awaited<ReturnType<typeof createServer>>;

  beforeEach(async () => {
    // Set minimal env for server creation
    process.env.ROUND_DURATION = '60';
    process.env.COOLDOWN_DURATION = '30';
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    process.env.NODE_ENV = 'test';
    resetConfig();

    server = await createServer();
  });

  afterEach(async () => {
    await server.close();
    resetConfig();
  });

  it('should return 200 with health information', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/healthz',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('uptime');
    expect(body).toHaveProperty('environment', 'test');
    expect(body).toHaveProperty('timestamp');
    expect(typeof body.uptime).toBe('number');
    expect(body.uptime).toBeGreaterThanOrEqual(0);
  });

  it('should include valid ISO timestamp', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/healthz',
    });

    const body = JSON.parse(response.body);
    expect(() => new Date(body.timestamp)).not.toThrow();
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });
});

