/**
 * Context Enhancer
 * Wraps thinking tools to add optional context search capability
 */

import { ServerContext } from './context.js';

export interface ContextEnhancedInput {
  useContext?: boolean;
  contextQuery?: string;
  [key: string]: any;
}

export interface ContextEnhancedOutput {
  contextEvidence?: Array<{
    content: string;
    source: string;
    score?: number;
    uri?: string;
  }>;
  [key: string]: any;
}

/**
 * Enhance a thinking tool with context search capability
 * 
 * @param toolFn - Original tool function (sync or async)
 * @param defaultQuery - Function to generate search query from input
 * @returns Enhanced tool function that accepts ServerContext
 */
export function withContext<TInput extends ContextEnhancedInput, TOutput>(
  toolFn: (input: TInput) => TOutput | Promise<TOutput>,
  defaultQuery?: (input: TInput) => string
) {
  return async (input: TInput, ctx?: ServerContext): Promise<TOutput & ContextEnhancedOutput> => {
    // Call original tool
    const result = await Promise.resolve(toolFn(input));
    
    // If context not requested or not available, return original result
    if (!input.useContext || !ctx) {
      return result as TOutput & ContextEnhancedOutput;
    }
    
    // Generate search query
    const query = input.contextQuery || (defaultQuery ? defaultQuery(input) : '');
    if (!query) {
      return result as TOutput & ContextEnhancedOutput;
    }
    
    try {
      // Search for relevant context
      const hits = await ctx.blendedSearch(query, 8);
      
      // Format evidence
      const contextEvidence = hits.map((hit: any) => ({
        content: hit.content || hit.snippet || hit.text || '',
        source: hit.source || hit.file || 'unknown',
        score: hit.score || hit.rank,
        uri: hit.uri || hit.path,
      }));
      
      // Return enhanced result
      return {
        ...result,
        contextEvidence,
      } as TOutput & ContextEnhancedOutput;
    } catch (e) {
      console.error('[context-enhancer] Search failed:', e);
      return result as TOutput & ContextEnhancedOutput;
    }
  };
}

/**
 * Add context evidence summary to tool output
 */
export function formatWithContext(output: any, contextEvidence?: any[]): string {
  const base = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
  
  if (!contextEvidence || contextEvidence.length === 0) {
    return base;
  }
  
  const evidenceSummary = `\n\n## Context Evidence (${contextEvidence.length} items)\n\n` +
    contextEvidence.map((ev, i) => 
      `${i + 1}. **${ev.source}** (score: ${ev.score?.toFixed(2) || 'N/A'})\n   ${ev.content.slice(0, 150)}...`
    ).join('\n\n');
  
  return base + evidenceSummary;
}

