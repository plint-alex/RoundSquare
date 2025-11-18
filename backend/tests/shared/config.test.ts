import { describe, it, expect, beforeEach } from 'vitest';
import { loadConfig, resetConfig } from '@/shared/config.js';

describe('Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    resetConfig();
  });

  it('should load valid configuration', () => {
    process.env.PORT = '3000';
    process.env.NODE_ENV = 'development';
    process.env.ROUND_DURATION = '60';
    process.env.COOLDOWN_DURATION = '30';
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    process.env.AUTH_SECRET = 'test-secret-key-minimum-32-characters-long';

    const config = loadConfig();

    expect(config.PORT).toBe(3000);
    expect(config.NODE_ENV).toBe('development');
    expect(config.ROUND_DURATION).toBe(60);
    expect(config.COOLDOWN_DURATION).toBe(30);
    expect(config.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/db');
  });

  it('should use default PORT when not provided', () => {
    delete process.env.PORT;
    process.env.NODE_ENV = 'development';
    process.env.ROUND_DURATION = '60';
    process.env.COOLDOWN_DURATION = '30';
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    process.env.AUTH_SECRET = 'test-secret-key-minimum-32-characters-long';

    const config = loadConfig();

    expect(config.PORT).toBe(3000);
  });

  it('should throw error for missing required fields', () => {
    delete process.env.ROUND_DURATION;
    process.env.NODE_ENV = 'development';
    process.env.COOLDOWN_DURATION = '30';
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    process.env.AUTH_SECRET = 'test-secret-key-minimum-32-characters-long';

    expect(() => loadConfig()).toThrow('Invalid environment configuration');
  });

  it('should throw error for invalid NODE_ENV', () => {
    process.env.PORT = '3000';
    process.env.NODE_ENV = 'invalid';
    process.env.ROUND_DURATION = '60';
    process.env.COOLDOWN_DURATION = '30';
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    process.env.AUTH_SECRET = 'test-secret-key-minimum-32-characters-long';

    expect(() => loadConfig()).toThrow('Invalid environment configuration');
  });

  it('should coerce string numbers to integers', () => {
    process.env.PORT = '8080';
    process.env.NODE_ENV = 'production';
    process.env.ROUND_DURATION = '120';
    process.env.COOLDOWN_DURATION = '45';
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    process.env.AUTH_SECRET = 'test-secret-key-minimum-32-characters-long';

    const config = loadConfig();

    expect(config.PORT).toBe(8080);
    expect(config.ROUND_DURATION).toBe(120);
    expect(config.COOLDOWN_DURATION).toBe(45);
  });
});

