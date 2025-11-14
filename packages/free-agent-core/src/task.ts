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

export interface AgentRunResult {
  success: boolean;
  logs?: string[];
  // Future: add richer info (applied patches, tests, etc.)
}

