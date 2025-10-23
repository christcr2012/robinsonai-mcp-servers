/**
 * RAD Crawler Configuration
 */

import { Config } from './types.js';

export function loadConfig(): Config {
  const config: Config = {
    neonDatabaseUrl: process.env.NEON_DATABASE_URL || '',
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
    defaultEmbedModel: process.env.RAD_DEFAULT_EMBED_MODEL || 'bge-small',
    maxPages: parseInt(process.env.RAD_MAX_PAGES || '200', 10),
    maxDepth: parseInt(process.env.RAD_MAX_DEPTH || '3', 10),
    ratePerDomainPerMin: parseInt(process.env.RAD_RATE_PER_DOMAIN_PER_MIN || '10', 10),
    allowlist: parseList(process.env.RAD_ALLOWLIST || ''),
    denylist: parseList(process.env.RAD_DENYLIST || 'accounts.*,*/logout,*/login'),
    respectRobotsTxt: process.env.RAD_RESPECT_ROBOTS !== 'false',
    chunkSize: parseInt(process.env.RAD_CHUNK_SIZE || '1024', 10),
    chunkOverlap: parseInt(process.env.RAD_CHUNK_OVERLAP || '150', 10),
    embeddingDimension: parseInt(process.env.RAD_EMBEDDING_DIM || '768', 10),
  };

  // Validate required config (only if RAD is being used)
  // TEMPORARILY DISABLED - RAD worker is disabled
  // if (!config.neonDatabaseUrl) {
  //   throw new Error('NEON_DATABASE_URL is required');
  // }

  return config;
}

function parseList(value: string): string[] {
  return value
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

// Lazy load config - don't throw error if NEON_DATABASE_URL is missing
export const config = loadConfig();

