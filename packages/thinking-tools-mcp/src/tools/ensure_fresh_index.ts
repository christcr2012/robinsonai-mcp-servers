import type { ServerContext } from '../lib/context.js';
import { indexRepo } from '../context/indexer.js';

export const ensureFreshIndexDescriptor = {
  name: 'ensure_fresh_index',
  description: 'Incrementally update the index (changed-only) respecting TTL and caps. Call this before any context/thinking tool to ensure fresh results.',
  inputSchema: {
    type: 'object' as const,
    additionalProperties: false,
    properties: {
      force: {
        type: 'boolean' as const,
        description: 'Force update even if within TTL window'
      }
    }
  }
};

export async function ensureFreshIndexTool(args: { force?: boolean }, ctx: ServerContext) {
  try {
    const res = await indexRepo(ctx.workspaceRoot, { quick: true, force: args.force });
    
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          ok: res.ok,
          skipped: res.skipped,
          reason: res.reason,
          chunks: res.chunks,
          embeddings: res.embeddings,
          files: res.files,
          changed: res.changed,
          removed: res.removed,
          tookMs: res.tookMs
        }, null, 2)
      }]
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text' as const,
        text: `Error ensuring fresh index: ${error.message}`
      }],
      isError: true
    };
  }
}

