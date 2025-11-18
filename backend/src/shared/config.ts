import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ROUND_DURATION: z.coerce.number().int().positive(),
  COOLDOWN_DURATION: z.coerce.number().int().positive(),
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  AUTH_COOKIE_NAME: z.string().default('session'),
  AUTH_COOKIE_MAX_AGE: z.coerce.number().int().positive().default(86400000), // 24 hours in milliseconds
  LIFECYCLE_POLL_MS: z.coerce.number().int().positive().default(1000), // 1 second in milliseconds
});

export type Config = z.infer<typeof envSchema>;

let config: Config | null = null;

export function loadConfig(): Config {
  if (config) {
    return config;
  }

  const rawEnv = {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    ROUND_DURATION: process.env.ROUND_DURATION,
    COOLDOWN_DURATION: process.env.COOLDOWN_DURATION,
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_COOKIE_NAME: process.env.AUTH_COOKIE_NAME,
    AUTH_COOKIE_MAX_AGE: process.env.AUTH_COOKIE_MAX_AGE,
    LIFECYCLE_POLL_MS: process.env.LIFECYCLE_POLL_MS,
  };

  try {
    config = envSchema.parse(rawEnv);
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid environment configuration: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      );
    }
    throw error;
  }
}

export function getConfig(): Config {
  if (!config) {
    return loadConfig();
  }
  return config;
}

// For testing purposes - reset cached config
export function resetConfig(): void {
  config = null;
}

