/**
 * Main Synthesize-Execute-Critique-Refine Pipeline
 * 
 * This implements the battle-tested framework:
 * 1. Synthesize: Generate code + tests together (constrained to JSON schema)
 * 2. Execute: Build in sandbox with hard quality gates
 * 3. Critique: Judge with structured verdict
 * 4. Refine: Apply fixes and repeat until quality gates pass
 */

import type {
  GenResult,
  ExecReport,
  JudgeVerdict,
  PipelineConfig,
  PipelineResult,
  JudgeInput,
} from './types.js';
import {
  DEFAULT_PIPELINE_CONFIG,
  calculateWeightedScore,
  meetsAcceptanceCriteria,
} from './types.js';
import { runSandboxPipeline } from './sandbox.js';
import { judgeCode } from './judge.js';
import { generateCodeAndTests } from './synthesize.js';
import { applyFixPlan } from './refine.js';
import { isDockerAvailable, runDockerSandboxPipeline } from './docker-sandbox.js';

/**
 * Run the full pipeline for a task
 */
export async function iterateTask(
  spec: string,
  config: PipelineConfig = DEFAULT_PIPELINE_CONFIG
): Promise<PipelineResult> {
  const maxAttempts = config.maxAttempts ?? DEFAULT_PIPELINE_CONFIG.maxAttempts;
  let attempt = 0;
  let best: { score: number; files: GenResult['files']; verdict?: JudgeVerdict } | null = null;

  let currentSpec = spec;
  let previousVerdict: JudgeVerdict | undefined;

  // Check if Docker is available once at the start
  const dockerAvailable = await isDockerAvailable();
  if (dockerAvailable) {
    console.log('🐳 Docker sandbox available - using hermetic isolation');
  } else {
    console.log('⚠️  Docker not available - using local sandbox (less secure)');
  }

  while (attempt++ < maxAttempts) {
    console.log(`\n🔄 Attempt ${attempt}/${maxAttempts}`);

    // 1. SYNTHESIZE: Generate code + tests
    console.log('  📝 Synthesizing code and tests...');
    const genResult = await generateCodeAndTests(currentSpec, config, previousVerdict);

    // 2. EXECUTE: Run in sandbox (Docker if available, local otherwise)
    console.log('  🏃 Executing in sandbox...');
    const report = dockerAvailable
      ? await runDockerSandboxPipeline(genResult, config)
      : await runSandboxPipeline(genResult, config);
    
    // 3. CRITIQUE: Judge the results
    console.log('  ⚖️  Judging quality...');
    const judgeInput: JudgeInput = {
      spec: currentSpec,
      signals: report,
      patchSummary: {
        filesChanged: genResult.files.map(f => f.path),
        diffStats: {
          additions: genResult.files.reduce((sum, f) => sum + f.content.split('\n').length, 0),
          deletions: 0,
        },
      },
      modelNotes: genResult.notes ?? '',
    };
    
    const verdict = await judgeCode(judgeInput);
    const score = calculateWeightedScore(verdict.scores, config.weights);
    
    console.log(`  📊 Score: ${(score * 100).toFixed(1)}% (threshold: ${(config.acceptThreshold ?? DEFAULT_PIPELINE_CONFIG.acceptThreshold) * 100}%)`);
    console.log(`  📋 Verdict: ${verdict.verdict}`);
    
    // Track best attempt
    if (!best || score > best.score) {
      best = { score, files: genResult.files, verdict };
    }
    
    // Check if we meet acceptance criteria
    if (meetsAcceptanceCriteria(verdict, config)) {
      console.log('  ✅ Accepted!');
      return {
        ok: true,
        files: genResult.files,
        score,
        attempts: attempt,
        verdict,
        report,
      };
    }
    
    // 4. REFINE: Apply fixes for next iteration
    if (attempt < maxAttempts) {
      console.log('  🔧 Refining for next attempt...');
      currentSpec = buildRefinementSpec(spec, verdict, report);
      previousVerdict = verdict;
    }
  }
  
  // Return best attempt
  console.log(`\n❌ Failed to meet acceptance criteria after ${maxAttempts} attempts`);
  console.log(`  📊 Best score: ${(best!.score * 100).toFixed(1)}%`);
  
  return {
    ok: false,
    files: best?.files ?? [],
    score: best?.score ?? 0,
    attempts: maxAttempts,
    verdict: best?.verdict,
  };
}

/**
 * Build refinement spec with specific feedback
 */
function buildRefinementSpec(
  originalSpec: string,
  verdict: JudgeVerdict,
  report: ExecReport
): string {
  const issues: string[] = [];
  
  // Compilation issues
  if (verdict.scores.compilation === 0) {
    issues.push('CRITICAL: Code does not compile');
    if (report.typeErrors.length > 0) {
      issues.push(`Type errors:\n${report.typeErrors.slice(0, 5).join('\n')}`);
    }
  }
  
  // Test issues
  if (verdict.scores.tests_functional < 1) {
    issues.push(`CRITICAL: ${report.test.failed} tests failed`);
    if (report.test.details.length > 0) {
      issues.push(`Test failures:\n${report.test.details.slice(0, 3).join('\n')}`);
    }
  }
  
  // Security issues
  if (verdict.scores.security === 0) {
    issues.push('CRITICAL: Security violations detected');
    if (report.security.violations.length > 0) {
      issues.push(`Violations:\n${report.security.violations.slice(0, 3).join('\n')}`);
    }
  }
  
  // Style issues
  if (verdict.scores.style < 0.8) {
    issues.push(`Linting errors: ${report.lintErrors.length}`);
  }
  
  const feedback = `
ORIGINAL TASK:
${originalSpec}

PREVIOUS ATTEMPT FAILED WITH THESE ISSUES:
${issues.join('\n\n')}

ROOT CAUSE:
${verdict.explanations.root_cause}

REQUIRED FIX:
${verdict.explanations.minimal_fix}

FIX PLAN:
${verdict.fix_plan.map((f, i) => `${i + 1}. ${f.operation} ${f.file}: ${f.brief}`).join('\n')}

Generate CORRECTED code that fixes ALL these issues. Focus on:
1. Making the code compile and pass type checking
2. Ensuring all tests pass
3. Fixing security violations
4. Following the specification exactly

DO NOT repeat the same mistakes. Use REAL APIs only.
`;
  
  return feedback;
}

/**
 * Export all pipeline components
 */
export * from './types.js';
export * from './sandbox.js';
export * from './judge.js';
export * from './synthesize.js';
export * from './refine.js';

