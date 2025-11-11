/**
 * Quality Gates Execution
 * 
 * Runs code through sandbox and collects diagnostics:
 * - ESLint (style/conventions)
 * - TypeScript (type safety)
 * - Tests (functionality)
 * - Security (import allowlist, audit)
 * 
 * Returns structured report for judge and refine stages
 */

import type { ExecReport, PipelineConfig, GenResult } from './types.js';
import { runSandboxPipeline } from './sandbox.js';
import { DEFAULT_PIPELINE_CONFIG } from './types.js';

export type GateResult = {
  ok: boolean;
  passed: {
    eslint: boolean;
    tsc: boolean;
    tests: boolean;
    security: boolean;
  };
  report: ExecReport;
  summary: string;
};

/**
 * Run quality gates on generated code
 * 
 * Returns structured result with pass/fail status and diagnostics
 */
export async function runQualityGates(
  genResult: GenResult,
  config: PipelineConfig = DEFAULT_PIPELINE_CONFIG
): Promise<GateResult> {
  console.log('[Gates] Running quality gates...');
  
  // Run sandbox pipeline (handles all gates)
  const report = await runSandboxPipeline(genResult, config);
  
  // Determine pass/fail for each gate
  const passed = {
    eslint: report.lintErrors.length === 0,
    tsc: report.compiled && report.typeErrors.length === 0,
    tests: report.test.failed === 0,
    security: report.security.violations.length === 0
  };
  
  // Overall pass if all gates pass
  const ok = passed.eslint && passed.tsc && passed.tests && passed.security;
  
  // Build summary
  const summary = buildGateSummary(passed, report);
  
  console.log(`[Gates] Result: ${ok ? '✅ PASS' : '❌ FAIL'}`);
  console.log(summary);
  
  return { ok, passed, report, summary };
}

/**
 * Build human-readable summary of gate results
 */
function buildGateSummary(
  passed: { eslint: boolean; tsc: boolean; tests: boolean; security: boolean },
  report: ExecReport
): string {
  const lines = [
    '=== QUALITY GATES SUMMARY ===',
    '',
    `ESLint:   ${passed.eslint ? '✅ PASS' : `❌ FAIL (${report.lintErrors.length} errors)`}`,
    `TypeScript: ${passed.tsc ? '✅ PASS' : `❌ FAIL (${report.typeErrors.length} errors)`}`,
    `Tests:    ${passed.tests ? '✅ PASS' : `❌ FAIL (${report.test.failed} failed, ${report.test.passed} passed)`}`,
    `Security: ${passed.security ? '✅ PASS' : `❌ FAIL (${report.security.violations.length} violations)`}`,
    ''
  ];
  
  // Add details for failures
  if (!passed.eslint && report.lintErrors.length > 0) {
    lines.push('ESLint errors (first 3):');
    report.lintErrors.slice(0, 3).forEach(err => lines.push(`  - ${err}`));
    lines.push('');
  }
  
  if (!passed.tsc && report.typeErrors.length > 0) {
    lines.push('Type errors (first 3):');
    report.typeErrors.slice(0, 3).forEach(err => lines.push(`  - ${err}`));
    lines.push('');
  }
  
  if (!passed.tests && report.test.details.length > 0) {
    lines.push('Test failures (first 3):');
    report.test.details.slice(0, 3).forEach(detail => lines.push(`  - ${detail}`));
    lines.push('');
  }
  
  if (!passed.security && report.security.violations.length > 0) {
    lines.push('Security violations (first 3):');
    report.security.violations.slice(0, 3).forEach(violation => lines.push(`  - ${violation}`));
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Format diagnostics for judge and refine stages
 */
export function formatDiagnosticsForPrompt(report: ExecReport): string {
  const sections = [
    '=== ESLINT DIAGNOSTICS ===',
    report.lintErrors.length === 0 
      ? 'No linting errors'
      : report.lintErrors.slice(0, 10).join('\n'),
    '',
    '=== TYPESCRIPT DIAGNOSTICS ===',
    report.typeErrors.length === 0
      ? 'No type errors'
      : report.typeErrors.slice(0, 10).join('\n'),
    '',
    '=== TEST DIAGNOSTICS ===',
    report.test.failed === 0
      ? `All tests passed (${report.test.passed} passed)`
      : `${report.test.failed} tests failed, ${report.test.passed} passed\n${report.test.details.slice(0, 5).join('\n')}`,
    '',
    '=== SECURITY DIAGNOSTICS ===',
    report.security.violations.length === 0
      ? 'No security violations'
      : report.security.violations.slice(0, 5).join('\n')
  ];
  
  return sections.join('\n');
}

/**
 * Extract critical errors for refinement
 */
export function extractCriticalErrors(report: ExecReport): string[] {
  const errors: string[] = [];
  
  // Type errors are critical
  if (report.typeErrors.length > 0) {
    errors.push(`TypeScript compilation failed: ${report.typeErrors.slice(0, 3).join('; ')}`);
  }
  
  // Test failures are critical
  if (report.test.failed > 0) {
    errors.push(`${report.test.failed} tests failed: ${report.test.details.slice(0, 2).join('; ')}`);
  }
  
  // Security violations are critical
  if (report.security.violations.length > 0) {
    errors.push(`Security violations: ${report.security.violations.slice(0, 2).join('; ')}`);
  }
  
  // Linting errors are less critical but still important
  if (report.lintErrors.length > 0) {
    errors.push(`Linting errors: ${report.lintErrors.slice(0, 2).join('; ')}`);
  }
  
  return errors;
}

