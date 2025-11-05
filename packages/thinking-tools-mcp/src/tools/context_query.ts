/**
 * Context Query Tool
 * Query indexed code semantically
 */

import type { ServerContext } from '../lib/context.js';

export const contextQueryDescriptor = {
  name: 'context_query',
  description: 'Query indexed code semantically. Returns ranked search results.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      top_k: { type: 'number', description: 'Number of results to return (default: 12)' },
    },
    required: ['query'],
  },
};

export async function contextQueryTool(args: any, ctx: ServerContext) {
  try {
    // Ensure index is built before searching
    await ctx.ctx.waitForIndex();

    const hits = await ctx.ctx.search(args.query, args.top_k || 12);
    if (!hits || !Array.isArray(hits)) {
      return { hits: [], message: 'No search results found' };
    }
    return {
      hits: hits.map((h: any) => ({
        score: h.score,
        path: h.uri || h.path || 'unknown',
        title: h.title || 'Untitled',
        snippet: h.snippet || h.content || '',
        method: h._method,
        provider: h._provider
      }))
    };
  } catch (error: any) {
    return {
      hits: [],
      error: `Search failed: ${error?.message || String(error)}`
    };
  }
}

