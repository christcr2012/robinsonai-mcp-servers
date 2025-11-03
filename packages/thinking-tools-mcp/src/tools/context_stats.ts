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

  // Hard error if sources > 0 but chunks == 0 (indexing broken)
  if (stats.sources > 0 && stats.chunks === 0) {
    throw new Error(`ERROR: ${stats.sources} sources indexed but 0 chunks created. Indexing is broken.`);
  }

  return {
    ok: true,
    chunks: stats.chunks,
    embeddings: stats.vectors,
    sources: stats.sources,
    mode: stats.mode,
    model: stats.model,
    dimensions: stats.dimensions,
    totalCost: stats.totalCost,
    updatedAt: stats.indexedAt,
    rceIndexDir: path.join(ctx.workspaceRoot, '.rce_index')
  };
}

