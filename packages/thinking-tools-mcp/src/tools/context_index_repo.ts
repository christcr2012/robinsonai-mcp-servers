/**
 * Context Index Repo Tool
 * Indexes repository for semantic search
 */

import path from 'node:path';
import type { ServerContext } from '../lib/context.js';

export const contextIndexRepoDescriptor = {
  name: 'context_index_repo',
  description: 'Index repository for semantic search. Returns indexing statistics.',
  inputSchema: {
    type: 'object',
    properties: {
      force: { type: 'boolean', description: 'Force reindex even if already indexed' },
    },
  },
};

export async function contextIndexRepoTool(args: any, ctx: ServerContext) {
  try {
    await ctx.ctx.ensureIndexed();
    const stats = await ctx.ctx.stats();
    return {
      ok: true,
      files: stats.sources,
      chunks: stats.chunks,
      vectors: stats.vectors,
      embeddings: stats.vectors,
      mode: stats.mode,
      model: stats.model,
      dimensions: stats.dimensions,
      totalCost: stats.totalCost,
      indexedAt: stats.indexedAt,
      // Report the actual RCE location users should inspect:
      rceIndexDir: path.join(ctx.workspaceRoot, '.rce_index')
    };
  } catch (error: any) {
    throw new Error(`Indexing failed: ${error.message}`);
  }
}

