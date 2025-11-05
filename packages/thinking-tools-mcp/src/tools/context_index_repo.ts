/**
 * Context Index Repo Tool
 * Indexes repository for semantic search
 */

import path from 'node:path';
import type { ServerContext } from '../lib/context.js';
import { indexRepo } from '../context/indexer.js';

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
    // If force flag is set, call indexRepo directly with force option
    if (args?.force) {
      await indexRepo(ctx.workspaceRoot, { force: true });
      await ctx.ctx.reloadFromDisk();
    } else {
      await ctx.ctx.ensureIndexed();
    }

    const stats = await ctx.ctx.stats();
    return {
      ok: true,
      files: stats.sources,
      chunks: stats.chunks,
      vectors: stats.vectors || stats.embeddings || 0,
      embeddings: stats.vectors || stats.embeddings || 0,
      mode: stats.mode || 'unknown',
      model: stats.model || 'unknown',
      dimensions: stats.dimensions || 0,
      totalCost: stats.totalCost || 0,
      indexedAt: stats.indexedAt || stats.updatedAt,
      // Report the actual RCE location users should inspect:
      rceIndexDir: path.join(ctx.workspaceRoot, '.robinson/context')
    };
  } catch (error: any) {
    throw new Error(`Indexing failed: ${error.message}`);
  }
}

