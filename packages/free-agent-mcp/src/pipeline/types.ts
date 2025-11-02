/**
 * Core types for the Synthesize-Execute-Critique-Refine pipeline
 * 
 * This implements a battle-tested framework for generating real, working code:
 * 1. Synthesize: Generate code + tests together
 * 2. Execute: Build in sandbox with hard quality gates
 * 3. Critique: Judge with structured verdict
 * 4. Refine: Apply fixes and repeat
 */

/**
 * Result from the Synthesize (Coder) stage
 */
export interface GenResult {
  /** Source files to write */
  files: Array<{
    path: string;
    content: string;
  }>;

  /** Test files to write */
  tests: Array<{
    path: string;
    content: string;
  }>;

  /** Naming conventions used (maps new identifiers to existing repo patterns) */
  conventions_used?: Array<{
    new: string;
    mirrors: string;
  }>;

  /** Optional notes from the model about known gaps or decisions */
  notes?: string;

  /** Cost of this generation (from LLM API) */
  cost?: number;
}

/**
 * Report from the Execute (Runner) stage
 */
export interface ExecReport {
  /** Did the code compile/build successfully? */
  compiled: boolean;

  /** Linter errors (eslint, etc.) */
  lintErrors: string[];

  /** Type checker errors (tsc, etc.) */
  typeErrors: string[];

  /** Boundary violations (layer imports) */
  boundaryErrors?: string[];

  /** Custom rule violations (repo-specific) */
  customRuleErrors?: string[];

  /** Edit constraint violations (read-only files, public renames, large diffs) */
  editViolations?: string[];
  
  /** Test results */
  test: {
    passed: number;
    failed: number;
    details: string[];
    coveragePct?: number;
  };
  
  /** Security violations */
  security: {
    violations: string[];
  };
  
  /** Last 50 lines of logs (redacted) */
  logsTail: string[];
}

/**
 * Structured verdict from the Critique (Judge) stage
 */
export interface JudgeVerdict {
  /** Overall decision */
  verdict: 'accept' | 'revise' | 'reject';
  
  /** Detailed scores (0 = fail, 1 = pass, 0..1 = partial) */
  scores: {
    /** Code compiles/builds */
    compilation: 0 | 1;

    /** Functional tests pass */
    tests_functional: number;

    /** Edge case tests pass */
    tests_edge: number;

    /** Type checking passes */
    types: 0 | 1;

    /** Style/linting passes */
    style: number;

    /** Security checks pass */
    security: 0 | 1;

    /** Convention adherence (0..1) */
    conventions?: number;
  };
  
  /** Human-readable explanations */
  explanations: {
    /** Root cause of failures */
    root_cause: string;
    
    /** Minimal fix needed */
    minimal_fix: string;
  };
  
  /** Structured fix plan for the Refine stage */
  fix_plan: Array<{
    file: string;
    operation: 'edit' | 'add' | 'remove';
    brief: string;
  }>;

  /** Cost of this judgment (from LLM API) */
  cost?: number;
}

/**
 * Configuration for the pipeline
 */
export interface PipelineConfig {
  /** Maximum refinement attempts */
  maxAttempts?: number;

  /** Minimum weighted score to accept (0..1) */
  acceptThreshold?: number;

  /** Score weights (must sum to 1.0) */
  weights?: {
    compilation: number;
    tests_functional: number;
    tests_edge: number;
    types: number;
    style: number;
    security: number;
    conventions?: number;
  };

  /** Allowed libraries/imports (security allowlist) */
  allowedLibraries?: string[];

  /** Minimum code coverage percentage */
  minCoverage?: number;

  /** Model provider to use (default: 'ollama' for FREE agent, 'openai' for PAID agent) */
  provider?: 'ollama' | 'openai' | 'claude';

  /** Specific model to use (e.g., 'gpt-4o', 'claude-3-5-sonnet-20241022', 'qwen2.5-coder:7b') */
  model?: string;
  
  /** Timeout per test (ms) */
  testTimeout?: number;
  
  /** Global timeout for all tests (ms) */
  globalTimeout?: number;

  /** Memory limit (MB) */
  memoryLimit?: number;

  /** Task specification (for inferring allowed paths) */
  spec?: string;
}

/**
 * Final result from the pipeline
 */
export interface PipelineResult {
  /** Did the pipeline succeed? */
  ok: boolean;

  /** Final files (best attempt) */
  files: Array<{
    path: string;
    content: string;
  }>;

  /** Final weighted score */
  score: number;

  /** Number of refinement attempts */
  attempts: number;

  /** Final verdict */
  verdict?: JudgeVerdict;

  /** Execution report from final attempt */
  report?: ExecReport;

  /** Total cost from all LLM calls */
  totalCost?: number;

  /** Cost breakdown by stage */
  costBreakdown?: {
    synthesize: number;
    judge: number;
    refine: number;
  };
}

/**
 * Input to the judge
 */
export interface JudgeInput {
  /** Problem specification */
  spec: string;
  
  /** Execution signals */
  signals: ExecReport;
  
  /** Summary of changes */
  patchSummary: {
    filesChanged: string[];
    diffStats: {
      additions: number;
      deletions: number;
    };
  };
  
  /** Model's self-report */
  modelNotes: string;
}

/**
 * Default pipeline configuration
 */
export const DEFAULT_PIPELINE_CONFIG: Required<PipelineConfig> = {
  maxAttempts: 5,
  acceptThreshold: 0.9,
  weights: {
    compilation: 0.15,
    tests_functional: 0.25,
    tests_edge: 0.15,
    types: 0.1,
    security: 0.1,
    style: 0.05,
    conventions: 0.2,
  },
  allowedLibraries: [
    // Node.js built-ins
    'fs', 'path', 'util', 'crypto', 'stream', 'events', 'buffer',
    // Common safe libraries
    'lodash', 'axios', 'express', 'react', 'vue', 'next',
    // Testing
    'jest', '@jest/globals', 'vitest', 'mocha', 'chai',
    // TypeScript
    'typescript', '@types/*',
  ],
  minCoverage: 80,
  testTimeout: 5000,
  globalTimeout: 30000,
  memoryLimit: 512,
  spec: '',
  provider: 'ollama',
  model: 'qwen2.5-coder:7b',
};

/**
 * Calculate weighted score from judge scores
 */
export function calculateWeightedScore(
  scores: JudgeVerdict['scores'],
  weights: PipelineConfig['weights'] = DEFAULT_PIPELINE_CONFIG.weights
): number {
  const w = weights!;
  return (
    scores.compilation * w.compilation +
    scores.tests_functional * w.tests_functional +
    scores.tests_edge * w.tests_edge +
    scores.types * w.types +
    scores.style * w.style +
    scores.security * w.security +
    (scores.conventions || 0) * (w.conventions || 0)
  );
}

/**
 * Check if verdict meets acceptance criteria
 */
export function meetsAcceptanceCriteria(
  verdict: JudgeVerdict,
  config: PipelineConfig = DEFAULT_PIPELINE_CONFIG
): boolean {
  const score = calculateWeightedScore(verdict.scores, config.weights);
  
  // Must meet threshold
  if (score < (config.acceptThreshold ?? DEFAULT_PIPELINE_CONFIG.acceptThreshold)) {
    return false;
  }
  
  // Must have no zeros on critical gates
  if (verdict.scores.compilation === 0) return false;
  if (verdict.scores.security === 0) return false;
  
  return true;
}

