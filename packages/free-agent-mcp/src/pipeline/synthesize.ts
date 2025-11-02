/**
 * Synthesize (Coder) stage
 * 
 * Generates code + tests together with strict constraints:
 * - Output constrained to JSON schema
 * - Tests generated FIRST (or in parallel)
 * - Must use real, documented APIs only
 * - No placeholders, TODOs, or stubs
 */

import type { GenResult, PipelineConfig, JudgeVerdict } from './types.js';
import { DEFAULT_PIPELINE_CONFIG } from './types.js';
import { ollamaGenerate, llmGenerate } from '@robinsonai/shared-llm';
import { makeProjectBrief, formatBriefForPrompt, type ProjectBrief } from '../utils/project-brief.js';
import { retrieveCodeContext } from '../utils/code-retrieval.js';

// Cache project brief (regenerate every 5 minutes)
let cachedBrief: { brief: ProjectBrief; timestamp: number } | null = null;
const BRIEF_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getProjectBrief(root: string = process.cwd()): Promise<ProjectBrief> {
  const now = Date.now();

  if (cachedBrief && (now - cachedBrief.timestamp) < BRIEF_CACHE_TTL) {
    return cachedBrief.brief;
  }

  const brief = await makeProjectBrief(root);
  cachedBrief = { brief, timestamp: now };
  return brief;
}

/**
 * Get few-shot examples from similar code in the repo
 */
async function getFewShotExamples(spec: string): Promise<string> {
  try {
    // Extract keywords from spec
    const keywords = extractKeywords(spec);

    // Retrieve similar code
    const context = await retrieveCodeContext(process.cwd(), {
      keywords,
    });

    if (context.snippets.length === 0) {
      return '';
    }

    // Build few-shot examples section
    const examples: string[] = [];
    examples.push('## EXAMPLES FROM THIS REPO (Mirror These Patterns)');
    examples.push('');

    for (const snippet of context.snippets.slice(0, 3)) {
      examples.push(`### ${snippet.file} (${snippet.reason})`);
      examples.push('```typescript');
      examples.push(snippet.content.split('\n').slice(0, 30).join('\n')); // First 30 lines
      examples.push('```');
      examples.push('');
    }

    return examples.join('\n');
  } catch (error) {
    // If retrieval fails, continue without examples
    return '';
  }
}

/**
 * Extract keywords from spec for retrieval
 */
function extractKeywords(spec: string): string[] {
  const keywords: string[] = [];

  // Extract capitalized words (likely entity names)
  const capitalizedMatches = spec.matchAll(/\b([A-Z][a-z]+(?:[A-Z][a-z]+)*)\b/g);
  for (const match of capitalizedMatches) {
    keywords.push(match[1]);
  }

  // Extract common programming terms
  const terms = ['function', 'class', 'interface', 'type', 'component', 'service', 'util', 'helper'];
  for (const term of terms) {
    if (spec.toLowerCase().includes(term)) {
      keywords.push(term);
    }
  }

  return keywords.slice(0, 5); // Limit to 5 keywords
}

/**
 * Generate code and tests together
 */
export async function generateCodeAndTests(
  spec: string,
  config: PipelineConfig = DEFAULT_PIPELINE_CONFIG,
  previousVerdict?: JudgeVerdict
): Promise<GenResult> {
  const prompt = await buildCoderPrompt(spec, config, previousVerdict);

  // Determine provider and model from config
  const provider = config.provider || 'ollama';
  const model = config.model || (provider === 'ollama' ? 'qwen2.5-coder:7b' : provider === 'openai' ? 'gpt-4o' : 'claude-3-5-sonnet-20241022');

  console.log(`[Synthesize] Using ${provider}/${model}`);

  // Use unified LLM client
  try {
    const llmResult = await llmGenerate({
      provider,
      model,
      prompt,
      format: 'json',
      timeoutMs: provider === 'ollama' ? 300000 : 60000, // 5 min for Ollama (cold start), 1 min for PAID
    });

    const result = parseCoderResponse(llmResult.text);
    console.log(`[Synthesize] Success! Cost: $${llmResult.cost?.toFixed(4) || '0.0000'}`);
    return result;
  } catch (error) {
    // If using Ollama and primary model fails, try fallback
    if (provider === 'ollama' && model === 'qwen2.5-coder:7b') {
      console.warn('Primary model (qwen2.5-coder:7b) failed, falling back to qwen2.5:3b:', error);

      try {
        const llmResult = await llmGenerate({
          provider: 'ollama',
          model: 'qwen2.5:3b',
          prompt,
          format: 'json',
          timeoutMs: 60000,
        });

        const result = parseCoderResponse(llmResult.text);
        return result;
      } catch (fallbackError) {
        console.error('Both Ollama models failed:', fallbackError);
        throw fallbackError;
      }
    }

    // For PAID models or if fallback also failed, throw error
    console.error(`[Synthesize] ${provider}/${model} failed:`, error);
    throw error;
  }
}

/**
 * Build the coder prompt with strict constraints
 */
async function buildCoderPrompt(
  spec: string,
  config: PipelineConfig,
  previousVerdict?: JudgeVerdict
): Promise<string> {
  const allowedLibs = config.allowedLibraries ?? DEFAULT_PIPELINE_CONFIG.allowedLibraries;

  // Get project brief
  const brief = await getProjectBrief();
  const briefText = formatBriefForPrompt(brief);

  // Get few-shot examples from similar code
  const fewShotExamples = await getFewShotExamples(spec);

  let prompt = `You are writing production-quality code for THIS SPECIFIC REPOSITORY.

${briefText}

${fewShotExamples}

Return ONLY valid JSON in this exact format:

{
  "files": [
    {"path": "src/example.ts", "content": "...full file content..."}
  ],
  "tests": [
    {"path": "src/example.test.ts", "content": "...full test file content..."}
  ],
  "conventions_used": [
    {"new": "customerPlanId", "mirrors": "customerId, planId in models/Plan.ts"},
    {"new": "toISODate", "mirrors": "toIsoString helper in utils/date.ts"}
  ],
  "notes": "optional brief notes about implementation decisions"
}

TASK:
${spec}

CRITICAL REQUIREMENTS (MANDATORY):

1. REAL APIs ONLY
   - Use ONLY real, documented APIs from allowed libraries
   - DO NOT invent or hallucinate methods, classes, or functions
   - If you're unsure if an API exists, DON'T use it
   - For simple tasks, write simple code (don't overcomplicate)

2. REPO-NATIVE CODE (HOUSE RULES)
   - Naming: ${brief.naming.variables} for variables, ${brief.naming.types} for types, ${brief.naming.constants} for constants
   - File naming: ${brief.naming.files}
   - Layering: ${brief.layering.layers ? brief.layering.layers.map(l => `${l.name} can import ${l.canImport.join(', ')}`).join('; ') : 'respect folder boundaries'}
   - Testing: ${brief.testing.framework} with pattern ${brief.testing.testPattern}
   - Mirror existing patterns from the repo (see Project Brief above)
   - Use existing domain names from glossary: ${brief.glossary.entities.slice(0, 10).join(', ')}
   - DO NOT invent new names when existing ones exist

3. ALLOWED LIBRARIES:
${allowedLibs.map(lib => `   - ${lib}`).join('\n')}
   - You may ONLY import from these libraries
   - Any other import will cause SECURITY VIOLATION and automatic rejection

5. NO PLACEHOLDERS
   - NO TODO, FIXME, PLACEHOLDER, STUB, TBD, MOCK
   - NO comments like "implement this later" or "not implemented"
   - Every function must be FULLY implemented
   - Every test must be COMPLETE and runnable

6. TESTS FIRST
   - Write comprehensive tests that cover:
     * Basic functionality (happy path)
     * Edge cases (empty, null, undefined, large values)
     * Error cases (invalid input, exceptions)
   - Tests must be independent and deterministic
   - Use ${brief.testing.framework} framework

7. CODE QUALITY
   - Code must compile with TypeScript (strict mode)
   - Code must pass eslint with no errors
   - Code must be formatted with prettier
   - Functions must be pure unless spec requires side effects
   - No globals, no nondeterminism, no time-based logic

8. SECURITY
   - No network calls unless explicitly required
   - No system calls beyond standard library
   - No eval, Function constructor, or dynamic code execution
   - All inputs must be validated

`;

  // Add feedback from previous attempt if available
  if (previousVerdict) {
    prompt += `
PREVIOUS ATTEMPT FAILED:
- Root cause: ${previousVerdict.explanations.root_cause}
- Required fix: ${previousVerdict.explanations.minimal_fix}

Fix plan:
${previousVerdict.fix_plan.map((f, i) => `${i + 1}. ${f.operation} ${f.file}: ${f.brief}`).join('\n')}

DO NOT repeat these mistakes. Generate CORRECTED code.
`;
  }

  prompt += `
EXAMPLES:

CORRECT (simple task, simple code):
Task: "Create a function that adds two numbers"
{
  "files": [
    {
      "path": "src/math.ts",
      "content": "export function add(a: number, b: number): number {\\n  return a + b;\\n}"
    }
  ],
  "tests": [
    {
      "path": "src/math.test.ts",
      "content": "import { add } from './math';\\n\\ntest('adds two numbers', () => {\\n  expect(add(2, 3)).toBe(5);\\n});\\n\\ntest('handles negative numbers', () => {\\n  expect(add(-1, 1)).toBe(0);\\n});\\n\\ntest('handles zero', () => {\\n  expect(add(0, 0)).toBe(0);\\n});"
    }
  ],
  "notes": "Simple pure function, no external dependencies needed"
}

WRONG (overcomplicated with fake APIs):
{
  "files": [
    {
      "path": "src/math.ts",
      "content": "import { sum } from '@aws-sdk/client-cognito-identity';\\n\\nexport async function add(a: number, b: number): Promise<number> {\\n  const result = await sum(a, b);\\n  return result;\\n}"
    }
  ],
  "tests": [...],
  "notes": "Uses AWS Cognito for addition"
}
❌ WRONG because:
- AWS Cognito doesn't have a 'sum' function (FAKE API)
- Overcomplicated for a simple task
- Unnecessary async/await
- Not in allowed libraries list

WRONG (placeholders):
{
  "files": [
    {
      "path": "src/math.ts",
      "content": "export function add(a: number, b: number): number {\\n  // TODO: implement addition\\n  return 0;\\n}"
    }
  ]
}
❌ WRONG because:
- Contains TODO (forbidden)
- Not fully implemented
- Returns wrong value

Now generate the code for the task. Return ONLY the JSON, no other text.
`;

  return prompt;
}

/**
 * Parse the coder's JSON response
 */
function parseCoderResponse(response: string): GenResult {
  try {
    // Try to extract JSON from response
    let jsonStr = response.trim();
    
    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    
    const parsed = JSON.parse(jsonStr);
    
    // Validate structure
    if (!parsed.files || !Array.isArray(parsed.files)) {
      throw new Error('Invalid response: missing or invalid "files" array');
    }
    
    if (!parsed.tests || !Array.isArray(parsed.tests)) {
      throw new Error('Invalid response: missing or invalid "tests" array');
    }
    
    // Ensure all files have path and content
    for (const file of [...parsed.files, ...parsed.tests]) {
      if (!file.path || !file.content) {
        throw new Error(`Invalid file: missing path or content`);
      }
    }
    
    return {
      files: parsed.files,
      tests: parsed.tests,
      notes: parsed.notes,
    };
  } catch (error) {
    console.error('Failed to parse coder response:', error);
    console.error('Response:', response);
    throw new Error(`Failed to parse coder response: ${error}`);
  }
}

/**
 * Generate tests first, then code to satisfy them (test-first approach)
 */
export async function generateTestsFirst(
  spec: string,
  config: PipelineConfig = DEFAULT_PIPELINE_CONFIG
): Promise<GenResult> {
  // Step 1: Generate tests
  const testPrompt = `Generate comprehensive tests for this specification:

${spec}

Return ONLY valid JSON:
{
  "tests": [
    {"path": "src/example.test.ts", "content": "...full test content..."}
  ],
  "notes": "test strategy"
}

Tests must cover:
- Basic functionality (happy path)
- Edge cases (empty, null, large values)
- Error cases (invalid input)

Use jest with TypeScript. Make tests independent and deterministic.
`;

  const testResponse = await ollamaGenerate({
    model: 'qwen2.5-coder:7b', // Upgraded for better test quality
    prompt: testPrompt,
    format: 'json',
    timeoutMs: 45000, // Increased timeout for larger model
  });
  
  const testResult = JSON.parse(testResponse);
  
  // Step 2: Generate code to satisfy tests
  const codePrompt = `Generate code that satisfies these tests:

TESTS:
${testResult.tests.map((t: any) => `${t.path}:\n${t.content}`).join('\n\n')}

SPECIFICATION:
${spec}

Return ONLY valid JSON:
{
  "files": [
    {"path": "src/example.ts", "content": "...full file content..."}
  ],
  "notes": "implementation notes"
}

Code must:
- Make ALL tests pass
- Use real APIs only
- Be fully implemented (no TODOs)
- Follow TypeScript strict mode
`;

  const codeResponse = await ollamaGenerate({
    model: 'qwen2.5:3b',
    prompt: codePrompt,
    format: 'json',
    timeoutMs: 30000,
  });
  
  const codeResult = JSON.parse(codeResponse);
  
  return {
    files: codeResult.files,
    tests: testResult.tests,
    notes: `${testResult.notes || ''}\n${codeResult.notes || ''}`,
  };
}

