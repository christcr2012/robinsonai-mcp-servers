/**
 * Generator types for Free Agent MCP
 * Mirrors types from free-agent-core for local use
 */

export interface GenRequest {
  repo: string;
  task: string;
  quality?: "fast" | "safe" | "balanced" | "best" | "auto";
  kind?: "feature" | "bugfix" | "refactor" | "research";
  tier?: "free" | "paid";
  patternContract?: any;
  examples?: any[];
  targets?: any[];
}

export interface GenResult {
  diff: string;
  meta?: Record<string, any>;
}

export interface Generator {
  generate(req: GenRequest): Promise<GenResult>;
}

export interface GeneratorFactory {
  (deps?: Record<string, any>): Generator;
}

