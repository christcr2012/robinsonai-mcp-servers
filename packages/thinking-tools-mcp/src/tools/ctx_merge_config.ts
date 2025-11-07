/**
 * Context Merge Config Tool
 * Configure ranking mode for blending local and imported evidence
 */

import type { ServerContext } from '../lib/context.js';

type RankingMode = 'local' | 'imported' | 'blend';

/**
 * Merge config tool implementation
 */
export async function ctxMergeConfigTool(
  args: { mode?: RankingMode },
  ctx: ServerContext
) {
  const mode =
    (args.mode ?? process.env.CTX_RANKING ?? 'blend') as RankingMode;

  ctx.setRankingMode(mode);

  return {
    content: [
      {
        type: 'text',
        text: `Ranking mode set to "${mode}". This controls how local context is blended with imported evidence.`,
      },
    ],
  };
}

/**
 * Tool descriptor for registration
 */
export const ctxMergeConfigDescriptor = {
  name: 'evidence_merge_config',
  description:
    'Set ranking mode: local (only local context), imported (only external evidence), or blend (combine both). Controls how context is combined in thinking tools.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      mode: {
        type: 'string',
        enum: ['local', 'imported', 'blend'],
        description:
          'Ranking mode: local (only local), imported (only external), blend (combine)',
      },
    },
  }
};

