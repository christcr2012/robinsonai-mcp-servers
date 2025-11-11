/**
 * Tool Bridge for Free Agent
 * 
 * Provides safe access to:
 * - Robinson's Toolkit (toolkit_call)
 * - Thinking Tools (thinking_tool_call)
 * - Whitelisted documentation (safe_web_doc_search)
 * 
 * Generated code can call these functions to access external tools
 * without needing to know MCP details or make direct HTTP calls.
 */

import type { ExecReport } from '../pipeline/types.js';

/**
 * Toolkit call result
 */
export type ToolkitResult = {
  ok: boolean;
  data?: any;
  error?: string;
  cost?: number;
};

/**
 * Thinking tool result
 */
export type ThinkingToolResult = {
  ok: boolean;
  result?: string;
  error?: string;
};

/**
 * Documentation search result
 */
export type DocSearchResult = {
  ok: boolean;
  docs?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  error?: string;
};

/**
 * Call a Robinson's Toolkit tool
 * 
 * Example:
 * ```typescript
 * const result = await tryToolkitCall('github_create_repo', {
 *   owner: 'myorg',
 *   repo: 'myrepo',
 *   description: 'My repository'
 * });
 * ```
 */
export async function tryToolkitCall(
  toolName: string,
  args: Record<string, any>
): Promise<ToolkitResult> {
  try {
    // This is a placeholder that will be injected by the runtime
    // In actual execution, this connects to Robinson's Toolkit MCP
    const result = await (globalThis as any).__toolkit_call?.(toolName, args);
    
    if (!result) {
      return {
        ok: false,
        error: `Toolkit not available or tool '${toolName}' not found`
      };
    }
    
    return {
      ok: true,
      data: result.data || result,
      cost: result.cost
    };
  } catch (error) {
    return {
      ok: false,
      error: `Toolkit call failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Call a Thinking Tools framework
 * 
 * Example:
 * ```typescript
 * const result = await tryThinkingTool('framework_swot', {
 *   subject: 'My new feature',
 *   context: 'We want to add real-time notifications'
 * });
 * ```
 */
export async function tryThinkingTool(
  toolName: string,
  args: Record<string, any>
): Promise<ThinkingToolResult> {
  try {
    // This is a placeholder that will be injected by the runtime
    // In actual execution, this connects to Thinking Tools MCP
    const result = await (globalThis as any).__thinking_tool_call?.(toolName, args);
    
    if (!result) {
      return {
        ok: false,
        error: `Thinking tool not available or tool '${toolName}' not found`
      };
    }
    
    return {
      ok: true,
      result: result.result || result
    };
  } catch (error) {
    return {
      ok: false,
      error: `Thinking tool call failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Search whitelisted documentation
 * 
 * Searches official docs for libraries, frameworks, and APIs.
 * Results are cached and safe (no arbitrary web access).
 * 
 * Example:
 * ```typescript
 * const result = await docsSearch('React hooks API');
 * if (result.ok) {
 *   result.docs?.forEach(doc => {
 *     console.log(`${doc.title}: ${doc.url}`);
 *     console.log(doc.snippet);
 *   });
 * }
 * ```
 */
export async function docsSearch(query: string): Promise<DocSearchResult> {
  try {
    // This is a placeholder that will be injected by the runtime
    // In actual execution, this searches whitelisted documentation
    const result = await (globalThis as any).__safe_web_doc_search?.(query);
    
    if (!result) {
      return {
        ok: false,
        error: `Documentation search not available`
      };
    }
    
    return {
      ok: true,
      docs: result.docs || result
    };
  } catch (error) {
    return {
      ok: false,
      error: `Documentation search failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Convenience function: Search docs and return first result
 */
export async function getDocSnippet(query: string): Promise<string | null> {
  const result = await docsSearch(query);
  if (result.ok && result.docs && result.docs.length > 0) {
    return result.docs[0].snippet;
  }
  return null;
}

/**
 * Convenience function: Call toolkit and check success
 */
export async function requireToolkitCall(
  toolName: string,
  args: Record<string, any>
): Promise<any> {
  const result = await tryToolkitCall(toolName, args);
  if (!result.ok) {
    throw new Error(`Toolkit call failed: ${result.error}`);
  }
  return result.data;
}

/**
 * Convenience function: Call thinking tool and check success
 */
export async function requireThinkingTool(
  toolName: string,
  args: Record<string, any>
): Promise<string> {
  const result = await tryThinkingTool(toolName, args);
  if (!result.ok) {
    throw new Error(`Thinking tool failed: ${result.error}`);
  }
  return result.result || '';
}

/**
 * Export all bridge functions for use in generated code
 */
export const toolBridge = {
  tryToolkitCall,
  tryThinkingTool,
  docsSearch,
  getDocSnippet,
  requireToolkitCall,
  requireThinkingTool
};

