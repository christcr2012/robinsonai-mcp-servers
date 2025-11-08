/**
 * Context7 Enhanced Integration for Thinking Tools MCP
 *
 * This provides Context7 API access with additional features:
 * 1. Direct Context7 API calls (same as Robinson's Toolkit)
 * 2. Automatic import to evidence store (for use in thinking tools)
 * 3. Shared caching (benefits both Thinking Tools and Robinson's Toolkit)
 *
 * Works "in concert" with Robinson's Toolkit MCP:
 * - Robinson's Toolkit = Raw API access
 * - Thinking Tools = API access + evidence integration + caching
 */

import axios, { AxiosInstance } from 'axios';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { ServerContext } from '../lib/context.js';
import { ctxImportEvidenceTool } from './ctx_import_evidence.js';

// Shared cache directory (accessible by both MCP servers)
const SHARED_CACHE_DIR = '.context7_cache';

// Singleton axios client
let context7Client: AxiosInstance | null = null;

function getContext7Client(): AxiosInstance {
  if (!context7Client) {
    const apiKey = process.env.CONTEXT7_API_KEY || '';
    context7Client = axios.create({
      baseURL: 'https://api.context7.com',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
      },
      timeout: 30000,
    });
  }
  return context7Client;
}

/**
 * Get or create shared cache
 */
async function getSharedCache(ctx: ServerContext, cacheKey: string): Promise<any | null> {
  try {
    const cacheDir = path.join(ctx.workspaceRoot, SHARED_CACHE_DIR);
    const cachePath = path.join(cacheDir, `${cacheKey}.json`);
    const cacheData = await fs.readFile(cachePath, 'utf8');
    const cache = JSON.parse(cacheData);

    // Check if cache is still valid (24 hours)
    const age = Date.now() - cache.timestamp;
    if (age < 24 * 60 * 60 * 1000) {
      return cache.data;
    }
  } catch {
    // Cache miss or expired
  }
  return null;
}

/**
 * Save to shared cache
 */
async function saveToSharedCache(ctx: ServerContext, cacheKey: string, data: any): Promise<void> {
  try {
    const cacheDir = path.join(ctx.workspaceRoot, SHARED_CACHE_DIR);
    await fs.mkdir(cacheDir, { recursive: true });
    const cachePath = path.join(cacheDir, `${cacheKey}.json`);
    await fs.writeFile(cachePath, JSON.stringify({
      timestamp: Date.now(),
      data,
    }, null, 2), 'utf8');
  } catch (error) {
    // Silent fail - caching is optional
    console.error('Failed to save to shared cache:', error);
  }
}

/**
 * Import Context7 results into evidence store
 */
async function importToEvidence(
  results: any,
  source: string,
  ctx: ServerContext
): Promise<void> {
  try {
    const items = normalizeContext7Results(results, source);
    if (items.length > 0) {
      await ctxImportEvidenceTool(
        {
          items,
          group: `context7/${source}`,
          upsert: true,
        },
        ctx
      );
    }
  } catch (error) {
    // Silent fail - evidence import is optional
    console.error('Failed to import Context7 results to evidence:', error);
  }
}

/**
 * Normalize Context7 API results for evidence import
 */
function normalizeContext7Results(results: any, source: string): any[] {
  if (!results || !results.data) return [];

  const data = results.data;
  const items: any[] = [];

  // Handle different response formats
  if (Array.isArray(data)) {
    items.push(...data.map((item: any) => ({
      source: `context7/${source}`,
      title: item.title || item.name || item.library || '',
      snippet: item.snippet || item.description || item.summary || '',
      uri: item.url || item.link || '',
      score: item.score || item.relevance || 1.0,
      tags: item.tags || [source],
      raw: item,
    })));
  } else if (data.results && Array.isArray(data.results)) {
    items.push(...data.results.map((item: any) => ({
      source: `context7/${source}`,
      title: item.title || item.name || item.library || '',
      snippet: item.snippet || item.description || item.summary || '',
      uri: item.url || item.link || '',
      score: item.score || item.relevance || 1.0,
      tags: item.tags || [source],
      raw: item,
    })));
  } else {
    // Single result
    items.push({
      source: `context7/${source}`,
      title: data.title || data.name || data.library || '',
      snippet: data.snippet || data.description || data.summary || JSON.stringify(data),
      uri: data.url || data.link || '',
      score: 1.0,
      tags: [source],
      raw: data,
    });
  }

  return items;
}

/**
 * Enhanced Context7 API calls with caching and evidence import
 */

export async function bridgedContext7ResolveLibraryId(
  args: any,
  ctx: ServerContext
): Promise<any> {
  const cacheKey = `resolve_${args.library || args.libraryName}`;

  try {
    // Check shared cache first
    const cached = await getSharedCache(ctx, cacheKey);
    if (cached) {
      await importToEvidence({ data: cached }, 'resolve', ctx);
      return {
        content: [{
          type: 'text',
          text: `[CACHED] ${JSON.stringify(cached, null, 2)}`,
        }],
      };
    }

    // Make API call
    const client = getContext7Client();
    const response = await client.post('/v1/resolve', {
      libraryName: args.library || args.libraryName,
    });

    // Save to shared cache
    await saveToSharedCache(ctx, cacheKey, response.data);

    // Import to evidence store
    await importToEvidence(response, 'resolve', ctx);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response.data, null, 2),
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Error resolving library: ${error.message}`,
      }],
      isError: true,
    };
  }
}

export async function bridgedContext7GetLibraryDocs(
  args: any,
  ctx: ServerContext
): Promise<any> {
  const cacheKey = `docs_${args.library || args.context7CompatibleLibraryID}_${args.topic || 'general'}`;

  try {
    // Check shared cache
    const cached = await getSharedCache(ctx, cacheKey);
    if (cached) {
      await importToEvidence({ data: cached }, 'docs', ctx);
      return {
        content: [{
          type: 'text',
          text: `[CACHED] ${JSON.stringify(cached, null, 2)}`,
        }],
      };
    }

    // Make API call
    const client = getContext7Client();
    const response = await client.post('/v1/docs', {
      libraryId: args.library || args.context7CompatibleLibraryID,
      topic: args.topic,
      tokens: args.tokens || 5000,
    });

    // Save to cache and evidence
    await saveToSharedCache(ctx, cacheKey, response.data);
    await importToEvidence(response, 'docs', ctx);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response.data, null, 2),
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Error fetching docs: ${error.message}`,
      }],
      isError: true,
    };
  }
}

export async function bridgedContext7SearchLibraries(
  args: any,
  ctx: ServerContext
): Promise<any> {
  const cacheKey = `search_${args.query.replace(/[^a-z0-9]/gi, '_')}`;

  try {
    // Check shared cache
    const cached = await getSharedCache(ctx, cacheKey);
    if (cached) {
      await importToEvidence({ data: cached }, 'search', ctx);
      return {
        content: [{
          type: 'text',
          text: `[CACHED] ${JSON.stringify(cached, null, 2)}`,
        }],
      };
    }

    // Make API call
    const client = getContext7Client();
    const response = await client.post('/v1/search', {
      query: args.query,
      limit: args.limit || 10,
    });

    // Save to cache and evidence
    await saveToSharedCache(ctx, cacheKey, response.data);
    await importToEvidence(response, 'search', ctx);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response.data, null, 2),
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Error searching libraries: ${error.message}`,
      }],
      isError: true,
    };
  }
}

export async function bridgedContext7CompareVersions(
  args: any,
  ctx: ServerContext
): Promise<any> {
  const cacheKey = `compare_${args.library || args.libraryId}_${args.from || args.fromVersion}_${args.to || args.toVersion}`;

  try {
    // Check shared cache
    const cached = await getSharedCache(ctx, cacheKey);
    if (cached) {
      await importToEvidence({ data: cached }, 'compare', ctx);
      return {
        content: [{
          type: 'text',
          text: `[CACHED] ${JSON.stringify(cached, null, 2)}`,
        }],
      };
    }

    // Make API call
    const client = getContext7Client();
    const response = await client.post('/v1/compare', {
      libraryId: args.library || args.libraryId,
      fromVersion: args.from || args.fromVersion,
      toVersion: args.to || args.toVersion,
    });

    // Save to cache and evidence
    await saveToSharedCache(ctx, cacheKey, response.data);
    await importToEvidence(response, 'compare', ctx);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response.data, null, 2),
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Error comparing versions: ${error.message}`,
      }],
      isError: true,
    };
  }
}

export async function bridgedContext7GetExamples(
  args: any,
  ctx: ServerContext
): Promise<any> {
  const cacheKey = `examples_${args.library || args.libraryId}_${args.topic || args.useCase || 'general'}`;

  try {
    // Check shared cache
    const cached = await getSharedCache(ctx, cacheKey);
    if (cached) {
      await importToEvidence({ data: cached }, 'examples', ctx);
      return {
        content: [{
          type: 'text',
          text: `[CACHED] ${JSON.stringify(cached, null, 2)}`,
        }],
      };
    }

    // Make API call
    const client = getContext7Client();
    const response = await client.post('/v1/examples', {
      libraryId: args.library || args.libraryId,
      useCase: args.topic || args.useCase,
      language: args.language || 'javascript',
    });

    // Save to cache and evidence
    await saveToSharedCache(ctx, cacheKey, response.data);
    await importToEvidence(response, 'examples', ctx);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response.data, null, 2),
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Error fetching examples: ${error.message}`,
      }],
      isError: true,
    };
  }
}

export async function bridgedContext7GetMigrationGuide(
  args: any,
  ctx: ServerContext
): Promise<any> {
  const cacheKey = `migration_${args.library || args.libraryId}_${args.from || args.fromVersion}_${args.to || args.toVersion}`;

  try {
    // Check shared cache
    const cached = await getSharedCache(ctx, cacheKey);
    if (cached) {
      await importToEvidence({ data: cached }, 'migration', ctx);
      return {
        content: [{
          type: 'text',
          text: `[CACHED] ${JSON.stringify(cached, null, 2)}`,
        }],
      };
    }

    // Make API call
    const client = getContext7Client();
    const response = await client.post('/v1/migration', {
      libraryId: args.library || args.libraryId,
      fromVersion: args.from || args.fromVersion,
      toVersion: args.to || args.toVersion,
    });

    // Save to cache and evidence
    await saveToSharedCache(ctx, cacheKey, response.data);
    await importToEvidence(response, 'migration', ctx);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response.data, null, 2),
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Error fetching migration guide: ${error.message}`,
      }],
      isError: true,
    };
  }
}

