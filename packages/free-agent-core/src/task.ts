/**
 * Shared task types for Agent Core
 * Used by both Free Agent MCP and Paid Agent MCP
 */

export type AgentKind = 'feature' | 'bugfix' | 'refactor' | 'research';
export type AgentTier = 'free' | 'paid';

export interface AgentTaskConstraints {
  allowWebEvidence?: boolean;
  maxContextSnippets?: number;
  maxWebResults?: number;
}

export interface AgentTask {
  repo: string;
  task: string;
  kind: AgentKind;
  tier?: AgentTier;
  quality?: 'fast' | 'balanced' | 'best' | 'auto';
  constraints?: AgentTaskConstraints;
}

/**
 * Error details for failed agent runs
 */
export interface AgentRunError {
  message: string;
  stack?: string;
  type?: string;
  context?: Record<string, unknown>;
}

/**
 * Comprehensive result type for agent task execution
 * Used by both Free Agent and Paid Agent
 */
export interface AgentRunResult {
  status: 'success' | 'failed';
  output?: string;                  // final answer / code / plan
  logs?: string[];                  // high-level steps / actions (NOT raw hidden CoT)
  timingMs?: number;
  model?: string;
  taskDescription?: string;
  meta?: Record<string, unknown>;   // free-form metadata (tools used, token counts, etc.)
  error?: AgentRunError;            // present only when status === "failed"

  // Legacy field for backward compatibility
  success?: boolean;
}

