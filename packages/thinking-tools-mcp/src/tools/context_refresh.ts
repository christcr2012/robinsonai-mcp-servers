import type { ServerContext } from '../lib/context.js';

export const contextRefreshDescriptor = {
  name: 'context_refresh',
  description: 'Manually trigger background index refresh. Use this after major code changes or when you want to ensure the index is up-to-date. This is a non-blocking operation that schedules refresh in the background.',
  inputSchema: {
    type: 'object' as const,
    additionalProperties: false,
    properties: {
      force: {
        type: 'boolean' as const,
        description: 'Force full re-index even if index is fresh (default: false)',
        default: false
      },
      wait: {
        type: 'boolean' as const,
        description: 'Wait for refresh to complete before returning (default: false)',
        default: false
      }
    }
  }
};

export async function contextRefreshTool(args: { force?: boolean; wait?: boolean }, ctx: ServerContext) {
  try {
    const force = args.force ?? false;
    const wait = args.wait ?? false;

    // Trigger refresh
    const refreshPromise = ctx.ctx.triggerRefresh(force);

    if (wait) {
      // Wait for refresh to complete
      await refreshPromise;
      const stats = await ctx.ctx.stats();
      
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            ok: true,
            status: 'completed',
            force,
            chunks: stats.chunks,
            embeddings: stats.embeddings,
            sources: stats.sources,
            updatedAt: stats.updatedAt
          }, null, 2)
        }]
      };
    } else {
      // Return immediately, refresh runs in background
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            ok: true,
            status: 'scheduled',
            force,
            message: 'Background refresh scheduled. Use context_stats to check progress.'
          }, null, 2)
        }]
      };
    }
  } catch (error: any) {
    return {
      content: [{
        type: 'text' as const,
        text: `Error triggering refresh: ${error.message}`
      }],
      isError: true
    };
  }
}

