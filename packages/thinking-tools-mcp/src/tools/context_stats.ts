/**
 * Context Stats Tool
 * Get context engine statistics
 */

import path from 'node:path';
import type { ServerContext } from '../lib/context.js';

export const contextStatsDescriptor = {
  name: 'context_stats',
  description: 'Get context engine statistics. Returns chunk count, embeddings, sources, and configuration.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export async function contextStatsTool(args: any, ctx: ServerContext) {
  const stats = await ctx.ctx.stats();

  // Calculate total sources (handle both object and number)
  const totalSources = typeof stats.sources === 'object'
    ? Object.values(stats.sources).reduce((a, b) => a + b, 0)
    : stats.sources;

  // Hard error if sources > 0 but chunks == 0 (indexing broken)
  if (totalSources > 0 && stats.chunks === 0) {
    throw new Error(`ERROR: ${totalSources} sources indexed but 0 chunks created. Indexing is broken.`);
  }

  return {
    ok: true,
    chunks: stats.chunks,
    embeddings: stats.vectors || stats.embeddings || 0,
    sources: stats.sources,
    mode: stats.mode || 'unknown',
    model: stats.model || 'unknown',
    dimensions: stats.dimensions || 0,
    totalCost: stats.totalCost || 0,
    updatedAt: stats.indexedAt || stats.updatedAt,
    rceIndexDir: path.join(ctx.workspaceRoot, '.robinson/context')
  };
}

