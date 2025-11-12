/**
 * Refine (Fixer) stage
 *
 * Applies minimal fixes based on judge's fix plan
 * Uses separate model call for fixing (not combined with critique)
 * Supports multi-file refinement for coordinated features
 */

import type { JudgeVerdict, GenResult, ExecReport, PipelineConfig } from './types.js';
import { ollamaGenerate, llmGenerate } from '@robinson_ai_systems/shared-llm';
import { generateMultiFileDiff, formatDiffsForPrompt } from '../utils/diff-generator.js';
import { DEFAULT_PIPELINE_CONFIG } from './types.js';
import { formatDiagnosticsForPrompt, extractCriticalErrors } from './execute.js';
import { normalizeOutput, validateOutput, countOutputFiles } from '../schema/output.js';
import { validatePatchUnifiedDiff } from '@fa/core';

/**
 * Apply fix plan from judge
 */
export async function applyFixPlan(
  verdict: JudgeVerdict,
  currentFiles: GenResult['files'],
  report: ExecReport,
  previousFiles?: GenResult['files'],
  config: PipelineConfig = DEFAULT_PIPELINE_CONFIG
): Promise<GenResult> {
  const prompt = buildFixerPrompt(verdict, currentFiles, report, previousFiles);

  // Determine provider and model from config
  const provider = config.provider || 'ollama';
  const model = config.model || (provider === 'ollama' ? 'qwen2.5-coder:7b' : provider === 'openai' ? 'gpt-4o' : 'claude-3-5-sonnet-20241022');

  console.log(`[Refine] Using ${provider}/${model}`);

  // Use unified LLM client
  try {
    const llmResult = await llmGenerate({
      provider,
      model,
      prompt,
      format: 'json',
      timeoutMs: provider === 'ollama' ? 120000 : 60000, // 2 min for Ollama, 1 min for PAID
    });

    const result = await parseFixerResponse(llmResult.text);
    result.cost = llmResult.cost || 0;
    console.log(`[Refine] Success! Cost: $${llmResult.cost?.toFixed(4) || '0.0000'}`);
    return result;
  } catch (error) {
    // If using Ollama and primary model fails, try fallback
    if (provider === 'ollama' && model === 'qwen2.5-coder:7b') {
      console.warn('Primary model (qwen2.5-coder:7b) failed for refining, falling back to qwen2.5:3b:', error);

      try {
        const llmResult = await llmGenerate({
          provider: 'ollama',
          model: 'qwen2.5:3b',
          prompt,
          format: 'json',
          timeoutMs: 30000,
        });

        const result = await parseFixerResponse(llmResult.text);
        return result;
      } catch (fallbackError) {
        console.error('Both Ollama models failed to apply fixes:', fallbackError);
        throw fallbackError;
      }
    }

    // For PAID models or if fallback also failed, throw error
    console.error(`[Refine] ${provider}/${model} failed:`, error);
    throw error;
  }
}

/**
 * Build the fixer prompt
 */
function buildFixerPrompt(
  verdict: JudgeVerdict,
  currentFiles: GenResult['files'],
  report: ExecReport,
  previousFiles?: GenResult['files']
): string {
  // Generate diff if we have previous files
  let diffSection = '';
  if (previousFiles && previousFiles.length > 0) {
    const diffs = generateMultiFileDiff(previousFiles, currentFiles);
    diffSection = `
GIT DIFF (what changed from previous attempt):
${formatDiffsForPrompt(diffs)}

INSTRUCTIONS: Fix ONLY the minimal areas marked by errors below. Keep all other code unchanged.
`;
  } else {
    diffSection = `
CURRENT FILES:
${currentFiles.map(f => `${f.path}:\n${f.content}`).join('\n\n---\n\n')}
`;
  }

  return `You are fixing code based on build/test errors and a judge's fix plan.

${diffSection}

BUILD/TEST ERRORS (FULL LOGS):
- Compilation: ${report.compiled ? 'OK' : 'FAILED'}

TYPE ERRORS (${report.typeErrors.length} total):
${report.typeErrors.length > 0 ? report.typeErrors.join('\n') : 'None'}

LINT ERRORS (${report.lintErrors.length} total):
${report.lintErrors.length > 0 ? report.lintErrors.join('\n') : 'None'}

TESTS FAILED: ${report.test.failed}
TEST DETAILS:
${report.test.details.join('\n')}

SECURITY VIOLATIONS:
${report.security.violations.join('\n')}

JUDGE'S VERDICT:
- Root Cause: ${verdict.explanations.root_cause}
- Required Fix: ${verdict.explanations.minimal_fix}

FIX PLAN:
${verdict.fix_plan.map((f, i) => `${i + 1}. ${f.operation} ${f.file}: ${f.brief}`).join('\n')}

INSTRUCTIONS:
Output ONLY a JSON patch with MINIMAL edits to pass all gates.
DO NOT change public signatures unless required by the spec.
DO NOT add new features or refactor unnecessarily.
Focus ONLY on fixing the specific issues identified.

Return ONLY valid JSON in this format:
{
  "files": [
    {"path": "src/example.ts", "content": "...CORRECTED full file content..."}
  ],
  "tests": [
    {"path": "src/example.test.ts", "content": "...CORRECTED full test content..."}
  ],
  "notes": "brief description of changes made"
}

Make sure:
1. All type errors are fixed
2. All tests pass
3. No security violations
4. Code compiles and passes linting
5. Use REAL APIs only (no fake/hallucinated methods)
`;
}

/**
 * Parse the fixer's JSON response
 */
async function parseFixerResponse(response: string): Promise<GenResult> {
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

    // Tests are optional in fix response
    const tests = parsed.tests && Array.isArray(parsed.tests) ? parsed.tests : [];

    // Validate patches against policy gates
    for (const file of parsed.files) {
      if (file.content) {
        try {
          await validatePatchUnifiedDiff(file.content);
        } catch (policyError) {
          console.error(`[Refine] Policy violation in ${file.path}:`, policyError);
          throw policyError;
        }
      }
    }

    return {
      files: parsed.files,
      tests,
      notes: parsed.notes,
    };
  } catch (error) {
    console.error('Failed to parse fixer response:', error);
    console.error('Response:', response);
    throw new Error(`Failed to parse fixer response: ${error}`);
  }
}

/**
 * Apply minimal diff to fix specific issues
 * This is more efficient than regenerating entire files
 */
export async function applyMinimalDiff(
  file: { path: string; content: string },
  issue: string,
  fix: string
): Promise<string> {
  const prompt = `Apply a minimal fix to this file.

FILE: ${file.path}
CONTENT:
${file.content}

ISSUE:
${issue}

FIX:
${fix}

Return ONLY the CORRECTED file content. Make the SMALLEST possible change to fix the issue.
Do not refactor or change anything else.
`;

  const response = await ollamaGenerate({
    model: 'qwen2.5:3b',
    prompt,
    timeoutMs: 20000,
  });
  
  return response.trim();
}

/**
 * Validate that fixes don't break public API
 */
export function validatePublicAPI(
  originalFiles: GenResult['files'],
  fixedFiles: GenResult['files']
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  
  for (const originalFile of originalFiles) {
    const fixedFile = fixedFiles.find(f => f.path === originalFile.path);
    if (!fixedFile) {
      violations.push(`File removed: ${originalFile.path}`);
      continue;
    }
    
    // Extract exported functions/classes
    const originalExports = extractExports(originalFile.content);
    const fixedExports = extractExports(fixedFile.content);
    
    // Check for removed exports
    for (const exp of originalExports) {
      if (!fixedExports.includes(exp)) {
        violations.push(`Removed export: ${exp} from ${originalFile.path}`);
      }
    }
  }
  
  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Extract exported symbols from TypeScript code
 */
function extractExports(content: string): string[] {
  const exports: string[] = [];
  
  // Match: export function name(...) or export class Name or export const name
  const exportRegex = /export\s+(function|class|const|let|var|interface|type)\s+(\w+)/g;
  let match;
  
  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[2]);
  }
  
  return exports;
}

/**
 * Refine code based on gate diagnostics (for quality gates loop)
 *
 * Generates fixes for type errors, test failures, and linting issues
 */
export async function refineWithGates(params: {
  task: string;
  currentFiles: GenResult['files'];
  gateReport: ExecReport;
  config?: PipelineConfig;
}): Promise<GenResult> {
  const { task, currentFiles, gateReport, config = DEFAULT_PIPELINE_CONFIG } = params;

  // Extract critical errors
  const errors = extractCriticalErrors(gateReport);
  const diagnostics = formatDiagnosticsForPrompt(gateReport);

  // Build refinement prompt
  const prompt = buildGateRefinementPrompt({
    task,
    currentFiles,
    errors,
    diagnostics
  });

  // Determine provider and model
  const provider = config.provider || 'ollama';
  const model = config.model || (provider === 'ollama' ? 'qwen2.5-coder:7b' : provider === 'openai' ? 'gpt-4o' : 'claude-3-5-sonnet-20241022');

  console.log(`[Refine-Gates] Using ${provider}/${model}`);

  try {
    const llmResult = await llmGenerate({
      provider,
      model,
      prompt,
      format: 'json',
      timeoutMs: provider === 'ollama' ? 120000 : 60000,
    });

    const result = parseFixerResponse(llmResult.text);
    result.cost = llmResult.cost || 0;
    console.log(`[Refine-Gates] Success! Cost: $${llmResult.cost?.toFixed(4) || '0.0000'}`);
    return result;
  } catch (error) {
    console.error(`[Refine-Gates] ${provider}/${model} failed:`, error);
    throw error;
  }
}

/**
 * Build refinement prompt for gate-based fixes
 */
function buildGateRefinementPrompt(params: {
  task: string;
  currentFiles: GenResult['files'];
  errors: string[];
  diagnostics: string;
}): string {
  const filesList = params.currentFiles
    .map(f => `${f.path}:\n${f.content.slice(0, 500)}...`)
    .join('\n\n');

  return `You are a code fixer. Fix the code to pass quality gates.

TASK:
${params.task}

CURRENT CODE (first 500 chars of each file):
${filesList}

CRITICAL ERRORS TO FIX:
${params.errors.join('\n')}

DETAILED DIAGNOSTICS:
${params.diagnostics}

INSTRUCTIONS:
1. Fix type errors first (highest priority)
2. Fix test failures second
3. Fix security violations third
4. Fix linting errors last

Return ONLY valid JSON:
{
  "files": [
    {"path": "src/example.ts", "content": "...full corrected content..."}
  ],
  "tests": [
    {"path": "src/__tests__/example.test.ts", "content": "...full corrected test content..."}
  ],
  "notes": "brief explanation of fixes applied"
}

Make MINIMAL changes. Only fix what's broken. Keep the rest unchanged.`;
}

/**
 * Validate and normalize multi-file output from refiner
 */
export function validateAndNormalizeRefineOutput(output: any): GenResult {
  // Validate output format
  const validation = validateOutput(output);
  if (!validation.valid) {
    console.warn('[Refine] Output validation warnings:', validation.errors);
  }

  // Normalize to standard format
  const normalized = normalizeOutput(output);

  // Convert to GenResult
  return {
    files: normalized.files,
    tests: normalized.tests,
    notes: normalized.notes
  };
}

/**
 * Get summary of multi-file refinement
 */
export function getRefineOutputSummary(result: GenResult): string {
  const counts = countOutputFiles({
    files: result.files,
    tests: result.tests,
    notes: result.notes
  });

  const lines = [
    `[Refine] Output Summary:`,
    `  Files: ${counts.files}`,
    `  Tests: ${counts.tests}`,
    `  Total: ${counts.total}`
  ];

  if (result.notes) {
    lines.push(`  Notes: ${result.notes}`);
  }

  return lines.join('\n');
}
