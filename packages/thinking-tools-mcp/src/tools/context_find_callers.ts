/**
 * context_find_callers - Find all callers of a function
 */

import type { ServerContext } from '../lib/context.js';

export async function contextFindCallersTool(args: { functionName: string }, ctx: ServerContext) {
  const { functionName } = args;

  if (!functionName) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ error: 'functionName parameter is required' }, null, 2)
      }]
    };
  }

  try {
    const callers = await ctx.ctx.findCallers(functionName);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          functionName,
          callers: callers.map((c: any) => ({
            file: c.file,
            line: c.line,
            context: c.context
          })),
          count: callers.length
        }, null, 2)
      }]
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: error.message,
          functionName
        }, null, 2)
      }]
    };
  }
}

