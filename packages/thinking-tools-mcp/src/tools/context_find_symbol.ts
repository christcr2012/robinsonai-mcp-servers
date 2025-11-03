/**
 * context_find_symbol - Find symbol definition in codebase
 */

import type { ServerContext } from '../lib/context.js';

export async function contextFindSymbolTool(args: { symbolName: string }, ctx: ServerContext) {
  const { symbolName } = args;

  if (!symbolName) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ error: 'symbolName parameter is required' }, null, 2)
      }]
    };
  }

  try {
    const symbol = await ctx.ctx.findSymbol(symbolName);

    if (!symbol) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            found: false,
            symbolName,
            message: 'Symbol not found. Make sure symbol index is built (run context_index_repo).'
          }, null, 2)
        }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          found: true,
          symbol: {
            name: symbol.name,
            type: symbol.type,
            file: symbol.file,
            line: symbol.line,
            isPublic: symbol.isPublic
          }
        }, null, 2)
      }]
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: error.message,
          symbolName
        }, null, 2)
      }]
    };
  }
}

