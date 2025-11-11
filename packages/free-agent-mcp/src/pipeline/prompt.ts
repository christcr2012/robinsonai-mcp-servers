/**
 * Prompt building with house rules and context injection
 * 
 * Enforces repository conventions and best practices:
 * - Naming conventions (camelCase, PascalCase, etc.)
 * - No placeholder code or TODOs
 * - Reuse existing utilities and types
 * - Correct import paths
 * - Real APIs only
 */

import type { ProjectBrief } from '../utils/project-brief.js';

export type PromptInput = {
  task: string;
  brief: ProjectBrief;
  glossary: Array<{ symbol: string; file: string; summary?: string }>;
  nearby?: Array<{ path: string; content: string }>;
  previousVerdict?: any;
};

/**
 * Generate house rules based on project conventions
 */
export function makeHouseRules(brief: ProjectBrief): string[] {
  const naming = brief.naming || {};
  const namingRules = [
    `Variables: ${naming.variables || 'camelCase'}`,
    `Types: ${naming.types || 'PascalCase'}`,
    `Constants: ${naming.constants || 'UPPER_SNAKE_CASE'}`,
    `Files: ${naming.files || 'kebab-case.ts'}`
  ];

  return [
    '✅ Write complete, production-ready code. No placeholders, no TODOs, no stubs.',
    `✅ Follow naming conventions: ${namingRules.join('; ')}`,
    '✅ Respect repository layers and architecture. Do not bypass folder boundaries.',
    '✅ Prefer existing symbols/types from the glossary over inventing new ones.',
    '✅ Use correct import paths. Do not duplicate helpers already in the repo.',
    '✅ Use ONLY real, documented APIs. Never invent or hallucinate methods.',
    '✅ Mirror existing patterns from the repo. Consistency over creativity.',
    '✅ If external APIs are required, use official clients or documented REST endpoints.',
    '✅ Write tests that are independent, deterministic, and cover edge cases.',
    '',
    '## TOOL INTEGRATION (Use These for External Work)',
    '✅ For deployments/databases/external APIs: Use tryToolkitCall() from tool bridge',
    '✅ For authoritative API syntax: Call docsSearch() first, then follow official docs',
    '✅ For complex analysis: Use tryThinkingTool() for frameworks like SWOT, root cause',
    '✅ Never write shell scripts or guess API signatures - use the tool bridge instead'
  ];
}

/**
 * Build enhanced prompt with context injection
 */
export function buildPromptWithContext(input: PromptInput): string {
  const rules = makeHouseRules(input.brief);
  
  // Format glossary (top 50 symbols)
  const glossaryText = input.glossary
    .slice(0, 50)
    .map(g => `  • ${g.symbol} → ${g.file}${g.summary ? ` — ${g.summary}` : ''}`)
    .join('\n');
  
  // Format nearby examples
  const contextList = (input.nearby ?? [])
    .map(f => `### ${f.path}\n${codeFence(f.content)}`)
    .join('\n\n');
  
  // Build the full prompt
  const sections = [
    '# Code Generation Task',
    '',
    'You are a precise code generator for THIS SPECIFIC REPOSITORY.',
    'Your code must be production-ready, follow all house rules, and reuse existing patterns.',
    '',
    '## HOUSE RULES (MANDATORY)',
    rules.map(r => `${r}`).join('\n'),
    '',
    '## AVAILABLE TOOLS (Import from "tool-bridge")',
    '```typescript',
    '// For external work (deployments, databases, APIs):',
    'import { tryToolkitCall, docsSearch, tryThinkingTool } from "./tool-bridge";',
    '',
    '// Examples:',
    '// const result = await tryToolkitCall("github_create_repo", { owner, repo });',
    '// const docs = await docsSearch("React hooks API");',
    '// const analysis = await tryThinkingTool("framework_swot", { subject });',
    '```',
    '',
    '## REPOSITORY GLOSSARY (Top Symbols)',
    glossaryText || '(none)',
    '',
    '## NEARBY EXAMPLES (Mirror These Patterns)',
    contextList || '(none)',
    '',
    '## TASK',
    input.task,
    '',
    '## OUTPUT FORMAT',
    'Return ONLY valid JSON:',
    '```json',
    '{',
    '  "files": [',
    '    {"path": "src/example.ts", "content": "...full file content..."}',
    '  ],',
    '  "tests": [',
    '    {"path": "src/__tests__/example.test.ts", "content": "...full test content..."}',
    '  ],',
    '  "notes": "brief explanation of implementation decisions"',
    '}',
    '```'
  ];
  
  return sections.join('\n');
}

/**
 * Build refinement prompt with specific feedback
 */
export function buildRefinementPrompt(input: {
  task: string;
  brief: ProjectBrief;
  previousAttempt: string;
  feedback: string;
  glossary: Array<{ symbol: string; file: string; summary?: string }>;
}): string {
  const rules = makeHouseRules(input.brief);
  
  return [
    '# Code Refinement Task',
    '',
    'Your previous attempt had issues. Fix them using the feedback below.',
    '',
    '## HOUSE RULES (MANDATORY)',
    rules.map(r => `${r}`).join('\n'),
    '',
    '## PREVIOUS ATTEMPT',
    '```typescript',
    input.previousAttempt.slice(0, 2000),
    '```',
    '',
    '## FEEDBACK & REQUIRED FIXES',
    input.feedback,
    '',
    '## REPOSITORY GLOSSARY (Reuse These)',
    input.glossary
      .slice(0, 30)
      .map(g => `  • ${g.symbol} → ${g.file}`)
      .join('\n'),
    '',
    '## ORIGINAL TASK',
    input.task,
    '',
    'Generate CORRECTED code that fixes ALL issues. Focus on:',
    '1. Making the code compile and pass type checking',
    '2. Ensuring all tests pass',
    '3. Following the specification exactly',
    '4. Using REAL APIs only',
    '',
    'Return ONLY valid JSON with files and tests.'
  ].join('\n');
}

/**
 * Format code for display in prompts
 */
function codeFence(s: string, lang = 'typescript'): string {
  const maxLen = 4000;
  const slice = s.length > maxLen 
    ? s.slice(0, maxLen) + '\n/* …truncated… */'
    : s;
  return `\`\`\`${lang}\n${slice}\n\`\`\``;
}

/**
 * Extract key information from brief for quick reference
 */
export function briefSummary(brief: ProjectBrief): string {
  const lines = [
    `Languages: ${brief.languages?.join(', ') || 'unknown'}`,
    `Frameworks: ${brief.frameworks?.join(', ') || 'unknown'}`,
    `Testing: ${brief.testing?.framework || 'unknown'}`,
    `Linting: ${brief.linting?.tools?.join(', ') || 'none'}`
  ];
  return lines.join(' | ');
}

