/*
  flaky-test-detector.ts – Flaky Test Detector & Quarantine
  ---------------------------------------------------------
  Re-run failures up to N times with different seeds.
  Mark tests as flaky if non-deterministic.
  Don't let flakies block compile/type/style gates.
*/

import { execSync } from 'child_process';

export type TestResult = {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
};

export type FlakyTestReport = {
  test: string;
  runs: TestResult[];
  isFlaky: boolean;
  passRate: number;
  recommendation: 'quarantine' | 'investigate' | 'pass';
};

export type QuarantineList = {
  tests: string[];
  reason: string;
  addedAt: string;
};

/**
 * Detect flaky tests by re-running failures
 */
export async function detectFlakyTests(
  root: string,
  failedTests: string[],
  opts: {
    maxRetries?: number;
    testCommand?: string;
  } = {}
): Promise<FlakyTestReport[]> {
  const maxRetries = opts.maxRetries || 3;
  const reports: FlakyTestReport[] = [];
  
  for (const test of failedTests) {
    const runs: TestResult[] = [];
    
    // Run test multiple times
    for (let i = 0; i < maxRetries; i++) {
      const result = await runSingleTest(root, test, opts.testCommand, i);
      runs.push(result);
    }
    
    // Calculate pass rate
    const passed = runs.filter(r => r.passed).length;
    const passRate = passed / runs.length;
    
    // Determine if flaky
    const isFlaky = passRate > 0 && passRate < 1;
    
    // Recommendation
    let recommendation: FlakyTestReport['recommendation'] = 'pass';
    if (isFlaky) {
      recommendation = passRate < 0.5 ? 'quarantine' : 'investigate';
    } else if (passRate === 0) {
      recommendation = 'investigate';
    }
    
    reports.push({
      test,
      runs,
      isFlaky,
      passRate,
      recommendation,
    });
  }
  
  return reports;
}

/**
 * Run single test with seed
 */
async function runSingleTest(
  root: string,
  test: string,
  testCommand?: string,
  seed?: number
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Set random seed if supported
    const env = seed !== undefined ? { ...process.env, TEST_SEED: seed.toString() } : process.env;
    
    // Detect test framework and build command
    const command = testCommand || detectTestCommand(root, test);
    
    execSync(command, {
      cwd: root,
      env,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    
    return {
      name: test,
      passed: true,
      duration: Date.now() - startTime,
    };
  } catch (e: any) {
    return {
      name: test,
      passed: false,
      duration: Date.now() - startTime,
      error: e.message,
    };
  }
}

/**
 * Detect test command for framework
 */
function detectTestCommand(root: string, test: string): string {
  if (test.includes('.test.ts') || test.includes('.spec.ts')) {
    return `npx jest ${test}`;
  } else if (test.includes('.test.js') || test.includes('.spec.js')) {
    return `npx vitest run ${test}`;
  } else if (test.includes('_test.py')) {
    return `pytest ${test}`;
  } else if (test.includes('_test.go')) {
    return `go test ${test}`;
  } else if (test.includes('_test.rs')) {
    return `cargo test ${test}`;
  }
  
  return `npm test -- ${test}`;
}

/**
 * Quarantine flaky tests
 */
export function quarantineFlakyTests(
  reports: FlakyTestReport[]
): QuarantineList {
  const toQuarantine = reports
    .filter(r => r.recommendation === 'quarantine')
    .map(r => r.test);
  
  return {
    tests: toQuarantine,
    reason: 'Non-deterministic test failures detected',
    addedAt: new Date().toISOString(),
  };
}

/**
 * Filter out quarantined tests from test run
 */
export function filterQuarantinedTests(
  tests: string[],
  quarantine: QuarantineList
): {
  toRun: string[];
  skipped: string[];
} {
  const quarantined = new Set(quarantine.tests);
  
  return {
    toRun: tests.filter(t => !quarantined.has(t)),
    skipped: tests.filter(t => quarantined.has(t)),
  };
}

/**
 * Generate flaky test report
 */
export function renderFlakyTestReport(reports: FlakyTestReport[]): string {
  let md = '# Flaky Test Report\n\n';
  
  const flaky = reports.filter(r => r.isFlaky);
  const stable = reports.filter(r => !r.isFlaky);
  
  if (flaky.length > 0) {
    md += `## ⚠️ Flaky Tests (${flaky.length})\n\n`;
    
    for (const report of flaky) {
      md += `### ${report.test}\n\n`;
      md += `- **Pass Rate:** ${(report.passRate * 100).toFixed(0)}%\n`;
      md += `- **Recommendation:** ${report.recommendation}\n`;
      md += `- **Runs:**\n`;
      
      for (let i = 0; i < report.runs.length; i++) {
        const run = report.runs[i];
        const status = run.passed ? '✅' : '❌';
        md += `  - Run ${i + 1}: ${status} (${run.duration}ms)\n`;
      }
      
      md += '\n';
    }
  }
  
  if (stable.length > 0) {
    md += `## ✅ Stable Tests (${stable.length})\n\n`;
    
    for (const report of stable) {
      const status = report.passRate === 1 ? '✅ Always Pass' : '❌ Always Fail';
      md += `- ${report.test}: ${status}\n`;
    }
  }
  
  return md;
}

/**
 * Analyze test stability over time
 */
export class TestStabilityTracker {
  private history: Map<string, boolean[]> = new Map();
  
  record(test: string, passed: boolean) {
    if (!this.history.has(test)) {
      this.history.set(test, []);
    }
    
    this.history.get(test)!.push(passed);
    
    // Keep last 100 runs
    if (this.history.get(test)!.length > 100) {
      this.history.get(test)!.shift();
    }
  }
  
  getStability(test: string): number {
    const runs = this.history.get(test);
    if (!runs || runs.length === 0) return 1;
    
    const passed = runs.filter(r => r).length;
    return passed / runs.length;
  }
  
  isFlaky(test: string, threshold = 0.8): boolean {
    const stability = this.getStability(test);
    return stability > 0 && stability < threshold;
  }
  
  getStats(): {
    totalTests: number;
    stableTests: number;
    flakyTests: number;
    failingTests: number;
  } {
    let stable = 0;
    let flaky = 0;
    let failing = 0;
    
    for (const [test, runs] of this.history.entries()) {
      const stability = this.getStability(test);
      
      if (stability === 1) {
        stable++;
      } else if (stability === 0) {
        failing++;
      } else {
        flaky++;
      }
    }
    
    return {
      totalTests: this.history.size,
      stableTests: stable,
      flakyTests: flaky,
      failingTests: failing,
    };
  }
}

/**
 * Suggest fixes for flaky tests
 */
export function suggestFlakyTestFixes(report: FlakyTestReport): string[] {
  const suggestions: string[] = [];
  
  // Common causes of flakiness
  if (report.test.includes('async') || report.test.includes('promise')) {
    suggestions.push('Check for race conditions in async code');
    suggestions.push('Add proper await/async handling');
    suggestions.push('Increase timeout for slow operations');
  }
  
  if (report.test.includes('time') || report.test.includes('date')) {
    suggestions.push('Use fixed timestamps instead of Date.now()');
    suggestions.push('Mock time-dependent functions');
  }
  
  if (report.test.includes('random') || report.test.includes('shuffle')) {
    suggestions.push('Use seeded random number generator');
    suggestions.push('Make test deterministic');
  }
  
  if (report.test.includes('network') || report.test.includes('http')) {
    suggestions.push('Mock network requests');
    suggestions.push('Use test fixtures instead of real API calls');
  }
  
  if (report.test.includes('file') || report.test.includes('fs')) {
    suggestions.push('Clean up test files in afterEach');
    suggestions.push('Use unique file names per test');
  }
  
  // Generic suggestions
  suggestions.push('Add test isolation (beforeEach/afterEach cleanup)');
  suggestions.push('Check for shared state between tests');
  suggestions.push('Review test execution order dependencies');
  
  return suggestions;
}

