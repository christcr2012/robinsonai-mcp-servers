/**
 * context_retrieve_code - Retrieve code context using FREE Agent's code-aware retrieval
 */

import type { ServerContext } from '../lib/context.js';

export async function contextRetrieveCodeTool(
  args: {
    targetFile?: string;
    targetFunction?: string;
    targetClass?: string;
    targetInterface?: string;
    keywords?: string[];
  },
  ctx: ServerContext
) {
  try {
    const result = await ctx.ctx.retrieveCodeContext(args);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          targetFile: result.targetFile,
          similarFiles: result.similarFiles,
          relatedTests: result.relatedTests,
          relatedTypes: result.relatedTypes,
          snippets: result.snippets.map((s: any) => ({
            file: s.file,
            reason: s.reason,
            contentPreview: s.content.substring(0, 200) + (s.content.length > 200 ? '...' : '')
          }))
        }, null, 2)
      }]
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: error.message,
          query: args
        }, null, 2)
      }]
    };
  }
}

