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
import { ollamaGenerate, llmGenerate } from '@robinson_ai_systems/shared-llm';
import { makeProjectBrief, formatBriefForPrompt, type ProjectBrief } from '../utils/project-brief.js';
import { retrieveCodeContext } from '../utils/code-retrieval.js';
import { getRepoBrief, buildGlossaryFromBrief, retrieveNearbyFiles } from './context.js';
import { buildPromptWithContext, makeHouseRules } from './prompt.js';

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
    result.cost = llmResult.cost || 0;

    // Validate that tests were generated
    if (!result.tests || result.tests.length === 0) {
      console.warn('[Synthesize] No tests generated! Generating tests separately...');

      // Generate tests using a separate call
      const testPrompt = `Generate comprehensive tests for this code:

FILES:
${result.files.map(f => `${f.path}:\n${f.content}`).join('\n\n')}

SPECIFICATION:
${spec}

Return ONLY valid JSON:
{
  "tests": [
    {"path": "src/__tests__/example.test.ts", "content": "...full test content..."}
  ]
}

Tests must cover:
- Basic functionality (happy path)
- Edge cases (empty, null, undefined, large values)
- Error cases (invalid input, exceptions)

Use @jest/globals for imports. Make tests independent and deterministic.`;

      const testLlmResult = await llmGenerate({
        provider,
        model,
        prompt: testPrompt,
        format: 'json',
        timeoutMs: provider === 'ollama' ? 120000 : 30000,
      });

      const testResult = JSON.parse(testLlmResult.text);
      result.tests = testResult.tests || [];
      result.cost += testLlmResult.cost || 0;
    }

    console.log(`[Synthesize] Success! Files: ${result.files.length}, Tests: ${result.tests.length}, Cost: $${result.cost?.toFixed(4) || '0.0000'}`);
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
 * Build the coder prompt with strict constraints and context injection
 */
async function buildCoderPrompt(
  spec: string,
  config: PipelineConfig,
  previousVerdict?: JudgeVerdict
): Promise<string> {
  const allowedLibs = config.allowedLibraries ?? DEFAULT_PIPELINE_CONFIG.allowedLibraries;

  // Get project brief (with caching)
  const brief = await getProjectBrief();

  // Build glossary from project brief
  const glossary = await buildGlossaryFromBrief();

  // Get nearby files for context
  const cwd = process.cwd();
  const targetPath = `${cwd}/src/index.ts`; // Use a default path
  const nearby = retrieveNearbyFiles(targetPath, { limit: 3 });

  // Get few-shot examples from similar code
  const fewShotExamples = await getFewShotExamples(spec);

  // Build enhanced prompt with context and house rules
  const prompt = buildPromptWithContext({
    task: spec,
    brief,
    glossary,
    nearby
  });

  // Add few-shot examples if available
  let finalPrompt = prompt;
  if (fewShotExamples) {
    finalPrompt = prompt.replace(
      '## NEARBY EXAMPLES (Mirror These Patterns)',
      `## NEARBY EXAMPLES (Mirror These Patterns)\n\n${fewShotExamples}`
    );
  }

  // Add allowed libraries constraint
  if (allowedLibs && allowedLibs.length > 0) {
    finalPrompt += `\n\n## ALLOWED LIBRARIES\nYou may ONLY use these libraries:\n${allowedLibs.map(lib => `- ${lib}`).join('\n')}\n\nDO NOT use any other libraries.`;
  }

  // Add previous verdict feedback if available
  if (previousVerdict) {
    finalPrompt += `\n\n## PREVIOUS ATTEMPT FEEDBACK\n${previousVerdict.explanations?.minimal_fix || 'Fix the issues from the previous attempt.'}`;
  }

  return finalPrompt;
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

