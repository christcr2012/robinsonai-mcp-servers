/**
 * Structured Judge for code quality evaluation
 *
 * Uses LLM-as-a-judge with strict rubric and yes/no questions (QAG approach)
 * Returns structured verdict with scores and fix plan
 */

import type { JudgeInput, JudgeVerdict, ExecReport, GenResult, PipelineConfig } from './types.js';
import { ollamaGenerate, llmGenerate } from '../shared-llm/index.js';
import { makeProjectBrief } from '../shared-utils/index.js';
import { DEFAULT_PIPELINE_CONFIG } from './types.js';

// TODO: Move convention-score to shared-utils in future
// For now, we'll calculate a simple score based on signals
function calculateConventionScore(genResult: GenResult, brief: any, boundaryErrors: any[], customRuleErrors: any[]): { total: number } {
  // Simple scoring: 1.0 if no errors, 0.5 if some errors, 0.0 if many errors
  const errorCount = boundaryErrors.length + customRuleErrors.length;
  if (errorCount === 0) return { total: 1.0 };
  if (errorCount <= 3) return { total: 0.5 };
  return { total: 0.0 };
}

/**
 * Judge the generated code with structured verdict
 */
export async function judgeCode(input: JudgeInput, genResult?: GenResult, config: PipelineConfig = DEFAULT_PIPELINE_CONFIG): Promise<JudgeVerdict> {
  const prompt = buildJudgePrompt(input);

  // Calculate convention score
  let conventionScore = 0;
  if (genResult) {
    const brief = await makeProjectBrief(process.cwd());
    const score = calculateConventionScore(
      genResult,
      brief,
      input.signals.boundaryErrors || [],
      input.signals.customRuleErrors || []
    );
    conventionScore = score.total;
  }

  // Determine provider and model from config
  const provider = config.provider || 'ollama';
  const model = config.model || (provider === 'ollama' ? 'qwen2.5-coder:7b' : provider === 'openai' ? 'gpt-4o' : 'claude-3-5-sonnet-20241022');

  console.log(`[Judge] Using ${provider}/${model}`);

  // Use unified LLM client
  try {
    const llmResult = await llmGenerate({
      provider,
      model,
      prompt,
      format: 'json',
      timeoutMs: provider === 'ollama' ? 120000 : 60000, // 2 min for Ollama, 1 min for PAID
    });

    const verdict = parseJudgeResponse(llmResult.text, input.signals);
    verdict.scores.conventions = conventionScore;
    verdict.cost = llmResult.cost || 0;
    console.log(`[Judge] Success! Cost: $${llmResult.cost?.toFixed(4) || '0.0000'}`);
    return verdict;
  } catch (error) {
    // If using Ollama and primary model fails, try fallback
    if (provider === 'ollama' && model === 'qwen2.5-coder:7b') {
      console.warn('Primary model (qwen2.5-coder:7b) failed for judging, falling back to qwen2.5:3b:', error);

      try {
        const llmResult = await llmGenerate({
          provider: 'ollama',
          model: 'qwen2.5:3b',
          prompt,
          format: 'json',
          timeoutMs: 30000,
        });

        const verdict = parseJudgeResponse(llmResult.text, input.signals);
        verdict.scores.conventions = conventionScore;
        return verdict;
      } catch (fallbackError) {
        console.warn('Fallback model also failed, using automatic verdict:', fallbackError);
        const verdict = buildAutomaticVerdict(input.signals);
        verdict.scores.conventions = conventionScore;
        return verdict;
      }
    }

    // For PAID models, use automatic verdict as fallback
    console.warn(`[Judge] ${provider}/${model} failed, using automatic verdict:`, error);
    const verdict = buildAutomaticVerdict(input.signals);
    verdict.scores.conventions = conventionScore;
    return verdict;
  }
}

/**
 * Build the judge prompt with strict rubric
 */
function buildJudgePrompt(input: JudgeInput): string {
  const { spec, signals, patchSummary, modelNotes } = input;
  
  return `You are a code quality judge. Evaluate the generated code and return a structured verdict.

PROBLEM SPECIFICATION:
${spec}

EXECUTION SIGNALS:
- Compiled: ${signals.compiled ? 'YES' : 'NO'}

LINT ERRORS (${signals.lintErrors.length} total):
${signals.lintErrors.length > 0 ? signals.lintErrors.join('\n') : 'None'}

TYPE ERRORS (${signals.typeErrors.length} total):
${signals.typeErrors.length > 0 ? signals.typeErrors.join('\n') : 'None'}

BOUNDARY VIOLATIONS (${signals.boundaryErrors?.length || 0} total):
${(signals.boundaryErrors || []).length > 0 ? (signals.boundaryErrors || []).join('\n') : 'None'}

CUSTOM RULE VIOLATIONS (${signals.customRuleErrors?.length || 0} total):
${(signals.customRuleErrors || []).length > 0 ? (signals.customRuleErrors || []).join('\n') : 'None'}

TESTS:
- Passed: ${signals.test.passed}
- Failed: ${signals.test.failed}
- Coverage: ${signals.test.coveragePct ?? 'N/A'}%
- Details: ${signals.test.details.join('\n')}

SECURITY VIOLATIONS (${signals.security.violations.length} total):
${signals.security.violations.length > 0 ? signals.security.violations.join('\n') : 'None'}

CHANGES:
- Files: ${patchSummary.filesChanged.join(', ')}
- Diff: +${patchSummary.diffStats.additions} -${patchSummary.diffStats.deletions}

MODEL NOTES:
${modelNotes || 'None'}

RECENT LOGS (last 50 lines):
${signals.logsTail.slice(-50).join('\n')}

---

EVALUATION RUBRIC (Answer YES or NO for each):

1. COMPILATION:
   - Does the code compile/build without errors? (YES/NO)

2. TESTS - FUNCTIONAL:
   - Do the basic functional tests pass? (YES/NO)
   - Do the tests cover the main use cases from the spec? (YES/NO)

3. TESTS - EDGE CASES:
   - Do the tests cover edge cases (empty, large, invalid types)? (YES/NO)
   - Do the tests handle error conditions? (YES/NO)

4. TYPES:
   - Does the code pass type checking with no errors? (YES/NO)
   - Are all function signatures correct and complete? (YES/NO)

5. STYLE:
   - Does the code pass linting with no errors? (YES/NO)
   - Is the code formatted correctly? (YES/NO)

6. SECURITY:
   - Are all imports from allowed/safe libraries? (YES/NO)
   - Are there no security vulnerabilities (npm audit)? (YES/NO)
   - Does the code avoid globals, nondeterminism, or time-based logic? (YES/NO)

7. CORRECTNESS:
   - Does the code use only real, documented APIs? (YES/NO)
   - Are there no fake/hallucinated methods or classes? (YES/NO)
   - Does the code match the specification exactly? (YES/NO)

8. COMPLETENESS:
   - Is the code complete with no TODOs or placeholders? (YES/NO)
   - Are all functions fully implemented? (YES/NO)

---

HARD RULES (automatic REJECT if violated):
- If compilation fails → compilation score = 0, verdict = revise
- If security violations exist → security score = 0, verdict = revise
- If tests fail → tests_functional score = 0, verdict = revise
- If boundary violations exist → style score = 0, verdict = revise
- If custom rule violations exist → style score = 0, verdict = revise

Return ONLY valid JSON in this exact format:
{
  "verdict": "accept|revise|reject",
  "scores": {
    "compilation": 0 or 1,
    "tests_functional": 0 to 1,
    "tests_edge": 0 to 1,
    "types": 0 or 1,
    "style": 0 to 1,
    "security": 0 or 1
  },
  "explanations": {
    "root_cause": "brief explanation of main issue",
    "minimal_fix": "what needs to change"
  },
  "fix_plan": [
    {"file": "path/to/file.ts", "operation": "edit", "brief": "fix type error on line 42"},
    {"file": "path/to/test.ts", "operation": "add", "brief": "add edge case test for empty input"}
  ]
}`;
}

/**
 * Parse the judge's JSON response
 */
function parseJudgeResponse(response: string, signals: ExecReport): JudgeVerdict {
  try {
    const parsed = JSON.parse(response);
    
    // Validate structure
    if (!parsed.verdict || !parsed.scores || !parsed.explanations || !parsed.fix_plan) {
      throw new Error('Invalid judge response structure');
    }
    
    return parsed as JudgeVerdict;
  } catch (error) {
    // Fallback to automatic verdict
    return buildAutomaticVerdict(signals);
  }
}

/**
 * Build automatic verdict based on execution signals (fallback)
 */
function buildAutomaticVerdict(signals: ExecReport): JudgeVerdict {
  const scores = {
    compilation: signals.compiled ? 1 : 0,
    tests_functional: signals.test.failed === 0 && signals.test.passed > 0 ? 1 : 0,
    tests_edge: signals.test.passed >= 3 ? 0.8 : 0.5,
    types: signals.typeErrors.length === 0 ? 1 : 0,
    style: signals.lintErrors.length === 0 ? 1 : Math.max(0, 1 - signals.lintErrors.length * 0.1),
    security: signals.security.violations.length === 0 ? 1 : 0,
  } as const;
  
  // Determine verdict
  let verdict: 'accept' | 'revise' | 'reject' = 'accept';
  
  if (scores.compilation === 0 || scores.security === 0) {
    verdict = 'revise';
  } else if (scores.tests_functional === 0) {
    verdict = 'revise';
  }
  
  // Build explanations
  const issues: string[] = [];
  if (!signals.compiled) issues.push('compilation failed');
  if (signals.test.failed > 0) issues.push(`${signals.test.failed} tests failed`);
  if (signals.typeErrors.length > 0) issues.push(`${signals.typeErrors.length} type errors`);
  if (signals.security.violations.length > 0) issues.push(`${signals.security.violations.length} security violations`);
  
  const root_cause = issues.length > 0 ? issues.join(', ') : 'code quality issues';
  
  // Build fix plan
  const fix_plan: JudgeVerdict['fix_plan'] = [];
  
  if (signals.typeErrors.length > 0) {
    fix_plan.push({
      file: 'unknown',
      operation: 'edit',
      brief: `Fix ${signals.typeErrors.length} type errors: ${signals.typeErrors[0]}`,
    });
  }
  
  if (signals.test.failed > 0) {
    fix_plan.push({
      file: 'unknown',
      operation: 'edit',
      brief: `Fix ${signals.test.failed} failing tests`,
    });
  }
  
  if (signals.security.violations.length > 0) {
    fix_plan.push({
      file: 'unknown',
      operation: 'edit',
      brief: `Fix security violations: ${signals.security.violations[0]}`,
    });
  }
  
  return {
    verdict,
    scores,
    explanations: {
      root_cause,
      minimal_fix: fix_plan.length > 0 ? fix_plan[0].brief : 'improve code quality',
    },
    fix_plan,
  };
}

/**
 * Ask yes/no question to LLM (QAG approach - more reliable)
 */
export async function askYesNoQuestion(question: string, context: string): Promise<boolean> {
  const prompt = `${context}

QUESTION: ${question}

Answer ONLY "YES" or "NO". No explanation needed.

Answer:`;
  
  try {
    const response = await ollamaGenerate({
      model: 'qwen2.5:3b',
      prompt,
      timeoutMs: 10000,
    });
    
    const answer = response.trim().toUpperCase();
    return answer === 'YES' || answer.startsWith('YES');
  } catch (error) {
    // Default to NO on error (conservative)
    return false;
  }
}

/**
 * Validate code using QAG (Question-Answer Generation) approach
 * More reliable than asking for scores directly
 */
export async function qagValidate(code: string, spec: string): Promise<{
  valid: boolean;
  score: number;
  details: Record<string, boolean>;
}> {
  const context = `SPECIFICATION:\n${spec}\n\nCODE:\n${code}`;
  
  const questions = [
    'Does this code use only real, documented APIs?',
    'Are there no fake or hallucinated methods?',
    'Is this code complete with no TODOs or placeholders?',
    'Would this code compile and run without errors?',
    'Does the code match the specification exactly?',
    'Are all imports from real, existing packages?',
    'Are all function signatures correct?',
    'Does the code handle edge cases properly?',
  ];
  
  const results: Record<string, boolean> = {};
  let yesCount = 0;
  
  for (const question of questions) {
    const answer = await askYesNoQuestion(question, context);
    results[question] = answer;
    if (answer) yesCount++;
  }
  
  const score = (yesCount / questions.length) * 100;
  const valid = score >= 80;
  
  return { valid, score, details: results };
}

