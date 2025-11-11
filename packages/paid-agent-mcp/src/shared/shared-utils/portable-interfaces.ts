/**
 * Portable Interfaces - Project-agnostic APIs
 * 
 * Minimal interfaces that keep the agent portable across repos.
 * Swap adapters per language; keep Judge/Fixer generic.
 */

import type { Capabilities } from './repo-probe.js';
import type { PortableProjectBrief } from './portable-brief-builder.js';
import type { ExecReport } from './language-adapters.js';

/**
 * Repo Probe - Auto-discover repo capabilities
 */
export interface RepoProbe {
  detect(root: string): Promise<Capabilities>;
}

/**
 * Brief Builder - Build project brief from capabilities
 */
export interface BriefBuilder {
  build(root: string, caps: Capabilities): Promise<PortableProjectBrief>;
}

/**
 * Code Snippet for retrieval
 */
export interface Snippet {
  path: string;
  content: string;
  type: 'target' | 'neighbor' | 'test' | 'schema';
}

/**
 * Retriever - Get relevant code snippets
 */
export interface Retriever {
  neighbors(
    root: string,
    target?: string,
    symbols?: string[]
  ): Promise<Snippet[]>;
}

/**
 * Tool Adapter - Run language-specific tools
 */
export interface ToolAdapter {
  run(root: string): Promise<ExecReport>;
}

/**
 * Judge Input
 */
export interface JudgeInput {
  spec: string;
  brief: PortableProjectBrief;
  signals: ExecReport;
  context?: string;
}

/**
 * Judge Verdict
 */
export interface Verdict {
  verdict: 'accept' | 'revise' | 'reject';
  scores: {
    compilation: 0 | 1;
    tests_functional: number;
    tests_edge: number;
    types: 0 | 1;
    style: number;
    boundaries: number;
    schema: number;
  };
  explanations: {
    root_cause: string;
    minimal_fix: string;
  };
  fix_plan: Array<{
    file: string;
    operation: 'edit' | 'add' | 'delete';
    brief: string;
  }>;
}

/**
 * Judge - Evaluate code quality
 */
export interface Judge {
  decide(input: JudgeInput): Promise<Verdict>;
}

/**
 * Fix Plan from Judge
 */
export interface FixPlan {
  file: string;
  operation: 'edit' | 'add' | 'delete';
  brief: string;
}

/**
 * Patch from Fixer
 */
export interface Patch {
  files: Array<{ path: string; content: string }>;
  tests: Array<{ path: string; content: string }>;
  notes: string;
}

/**
 * Fixer - Apply fixes based on judge's plan
 */
export interface Fixer {
  apply(
    plan: FixPlan[],
    diagnostics: ExecReport,
    brief: PortableProjectBrief
  ): Promise<Patch>;
}

/**
 * Portable Pipeline Config
 */
export interface PortablePipelineConfig {
  maxAttempts: number;
  acceptThreshold: number;
  minCoverage: number;
  spec: string;
}

/**
 * Pipeline Result
 */
export interface PipelineResult {
  success: boolean;
  files: Array<{ path: string; content: string }>;
  tests: Array<{ path: string; content: string }>;
  verdict: Verdict;
  attempts: number;
}

/**
 * Default heuristics for portable code generation
 */
export const DEFAULT_HEURISTICS = {
  /**
   * Casing: choose casing by majority usage per identifier role
   */
  inferCasing(identifiers: string[], role: 'var' | 'type' | 'const'): string {
    // Count casing styles
    let camelCase = 0;
    let snakeCase = 0;
    let pascalCase = 0;
    let upperSnake = 0;
    
    for (const id of identifiers) {
      if (/^[a-z][a-zA-Z0-9]*$/.test(id)) camelCase++;
      if (/^[a-z_][a-z0-9_]*$/.test(id)) snakeCase++;
      if (/^[A-Z][a-zA-Z0-9]*$/.test(id)) pascalCase++;
      if (/^[A-Z_][A-Z0-9_]*$/.test(id)) upperSnake++;
    }
    
    const max = Math.max(camelCase, snakeCase, pascalCase, upperSnake);
    
    if (max === camelCase) return 'camelCase';
    if (max === snakeCase) return 'snake_case';
    if (max === pascalCase) return 'PascalCase';
    if (max === upperSnake) return 'UPPER_SNAKE_CASE';
    
    // Defaults by role
    if (role === 'var') return 'camelCase';
    if (role === 'type') return 'PascalCase';
    if (role === 'const') return 'UPPER_SNAKE_CASE';
    
    return 'camelCase';
  },
  
  /**
   * Imports: favor relative within folder, else repo's common alias
   */
  inferImportStyle(brief: PortableProjectBrief, targetPath: string, importPath: string): string {
    // If same folder, use relative
    const targetDir = targetPath.split('/').slice(0, -1).join('/');
    const importDir = importPath.split('/').slice(0, -1).join('/');
    
    if (targetDir === importDir) {
      return `./${importPath.split('/').pop()}`;
    }
    
    // If alias exists, use it
    if (brief.imports.usesAliases && brief.imports.exampleAlias) {
      return `${brief.imports.exampleAlias}${importPath}`;
    }
    
    // Otherwise, use relative
    return importPath;
  },
  
  /**
   * File naming: mirror closest neighbor name
   */
  inferFileName(neighbors: string[], baseName: string): string {
    if (neighbors.length === 0) return baseName;
    
    // Get naming pattern from neighbors
    const patterns = neighbors.map(n => {
      const name = n.split('/').pop()!.split('.')[0];
      if (/^[a-z][a-z0-9-]*$/.test(name)) return 'kebab-case';
      if (/^[a-z][a-zA-Z0-9]*$/.test(name)) return 'camelCase';
      if (/^[A-Z][a-zA-Z0-9]*$/.test(name)) return 'PascalCase';
      return 'kebab-case';
    });
    
    // Use most common pattern
    const counts = new Map<string, number>();
    for (const pattern of patterns) {
      counts.set(pattern, (counts.get(pattern) || 0) + 1);
    }
    
    const mostCommon = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'kebab-case';
    
    // Convert baseName to pattern
    if (mostCommon === 'kebab-case') {
      return baseName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
    }
    if (mostCommon === 'camelCase') {
      return baseName.charAt(0).toLowerCase() + baseName.slice(1);
    }
    if (mostCommon === 'PascalCase') {
      return baseName.charAt(0).toUpperCase() + baseName.slice(1);
    }
    
    return baseName;
  },
  
  /**
   * Tests: mirror nearest test file pattern
   */
  inferTestPattern(testFiles: string[]): string {
    if (testFiles.length === 0) return '*.test.ts';
    
    // Detect pattern from existing tests
    const patterns = testFiles.map(f => {
      const name = f.split('/').pop()!;
      if (name.endsWith('.spec.ts')) return '*.spec.ts';
      if (name.endsWith('.test.ts')) return '*.test.ts';
      if (name.startsWith('test_')) return 'test_*.py';
      if (name.endsWith('_test.go')) return '*_test.go';
      return '*.test.ts';
    });
    
    // Use most common
    const counts = new Map<string, number>();
    for (const pattern of patterns) {
      counts.set(pattern, (counts.get(pattern) || 0) + 1);
    }
    
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '*.test.ts';
  },
  
  /**
   * Layers: don't allow new edges that invert the most common direction
   */
  checkLayerViolation(
    brief: PortableProjectBrief,
    fromLayer: string,
    toLayer: string
  ): boolean {
    // Find layer definitions
    const fromLayerDef = brief.layers.find(l => l.name === fromLayer);
    const toLayerDef = brief.layers.find(l => l.name === toLayer);
    
    if (!fromLayerDef || !toLayerDef) return false;
    
    // Check if import is allowed
    if (fromLayerDef.allowedImports) {
      return !fromLayerDef.allowedImports.includes(toLayer);
    }
    
    return false;
  },
};

/**
 * Portable prompts (stack-agnostic)
 */
export const PORTABLE_PROMPTS = {
  /**
   * Coder prompt (prepend brief)
   */
  coder(brief: PortableProjectBrief, spec: string, examples: string): string {
    return `Generate minimal changes that satisfy the task and match the Project Conventions below.

PROJECT CONVENTIONS (detected from this repo):
- Variables: ${brief.naming.var}
- Types: ${brief.naming.type}
- Constants: ${brief.naming.const}
- Import aliases: ${brief.imports.usesAliases ? `Yes (e.g., ${brief.imports.exampleAlias})` : 'No'}
- Test framework: ${brief.tests.framework}
- Layers: ${brief.layers.map(l => l.name).join(', ')}

GLOSSARY (use existing names when possible):
${brief.glossary.slice(0, 20).join(', ')}

EXAMPLES FROM THIS REPO (mirror these patterns):
${examples}

TASK:
${spec}

INSTRUCTIONS:
1. Use existing names from the Glossary when possible
2. Respect import layering (${brief.layers.map(l => l.name).join(' → ')})
3. Match naming conventions exactly
4. Output JSON with files, tests, and conventions_used

Return ONLY valid JSON in this format:
{
  "files": [{"path": "...", "content": "..."}],
  "tests": [{"path": "...", "content": "..."}],
  "conventions_used": [{"new": "customerPlanId", "mirrors": ["customerId", "planId"]}]
}`;
  },
  
  /**
   * Judge prompt
   */
  judge(brief: PortableProjectBrief, spec: string, signals: ExecReport): string {
    return `Using the Project Brief and build/test/type/lint/boundary/schema signals, decide accept/revise/reject.

PROJECT BRIEF:
${JSON.stringify(brief, null, 2)}

TASK:
${spec}

SIGNALS:
${JSON.stringify(signals, null, 2)}

RULES:
- Any lint/type/boundary/schema error → revise
- Tests must pass
- Coverage must be ≥ 70%

Provide a minimal fix plan with specific file edits.`;
  },
  
  /**
   * Fixer prompt
   */
  fixer(brief: PortableProjectBrief, plan: FixPlan[], diagnostics: ExecReport): string {
    return `Apply only the minimal edits required by diagnostics and the judge's fix plan.

PROJECT BRIEF:
${JSON.stringify(brief, null, 2)}

FIX PLAN:
${plan.map((f, i) => `${i + 1}. ${f.operation} ${f.file}: ${f.brief}`).join('\n')}

DIAGNOSTICS:
${JSON.stringify(diagnostics, null, 2)}

INSTRUCTIONS:
1. Keep names and imports aligned with the brief and neighboring files
2. Do not rename public symbols unless required by errors
3. Make minimal changes only

Return ONLY valid JSON with files and tests.`;
  },
};

