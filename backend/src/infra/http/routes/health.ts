import { FastifyPluginAsync } from 'fastify';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getConfig } from '@/shared/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let startTime: number | null = null;
let packageVersion: string = 'unknown';

// Try to read package.json from project root (works in both dev and production)
try {
  // In dev: src/infra/http/routes -> ../../../
  // In prod: dist/infra/http/routes -> ../../../
  const packageJsonPath = join(__dirname, '../../../package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  packageVersion = packageJson.version || 'unknown';
} catch {
  // Fallback: try from process.cwd()
  try {
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    packageVersion = packageJson.version || 'unknown';
  } catch {
    // Ignore if package.json not found
  }
}

export const healthPlugin: FastifyPluginAsync = async (fastify) => {
  if (startTime === null) {
    startTime = Date.now();
  }

  fastify.get('/healthz', async () => {
    const config = getConfig();
    const uptime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

    return {
      status: 'ok',
      version: packageVersion,
      uptime,
      environment: config.NODE_ENV,
      timestamp: new Date().toISOString(),
    };
  });
};

