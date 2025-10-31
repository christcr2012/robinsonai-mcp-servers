/**
 * Refine (Fixer) stage
 * 
 * Applies minimal fixes based on judge's fix plan
 * Uses separate model call for fixing (not combined with critique)
 */

import type { JudgeVerdict, GenResult, ExecReport } from './types.js';
import { ollamaGenerate } from '@robinsonai/shared-llm';
import { generateMultiFileDiff, formatDiffsForPrompt } from '../utils/diff-generator.js';

/**
 * Apply fix plan from judge
 */
export async function applyFixPlan(
  verdict: JudgeVerdict,
  currentFiles: GenResult['files'],
  report: ExecReport,
  previousFiles?: GenResult['files']
): Promise<GenResult> {
  const prompt = buildFixerPrompt(verdict, currentFiles, report, previousFiles);

  // Try primary model first
  try {
    const response = await ollamaGenerate({
      model: 'qwen2.5-coder:7b', // Primary: Better fix quality
      prompt,
      format: 'json',
      timeoutMs: 120000, // 2 minutes - increased for cold start and larger model
    });

    const result = parseFixerResponse(response);
    return result;
  } catch (error) {
    console.warn('Primary model (qwen2.5-coder:7b) failed for refining, falling back to qwen2.5:3b:', error);

    // Fallback to smaller model
    try {
      const response = await ollamaGenerate({
        model: 'qwen2.5:3b', // Fallback: Faster, more reliable
        prompt,
        format: 'json',
        timeoutMs: 30000, // 30 seconds - smaller model is faster
      });

      const result = parseFixerResponse(response);
      return result;
    } catch (fallbackError) {
      console.error('Both models failed to apply fixes:', fallbackError);
      throw fallbackError;
    }
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
function parseFixerResponse(response: string): GenResult {
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

