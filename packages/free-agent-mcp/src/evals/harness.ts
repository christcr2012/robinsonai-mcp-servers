/**
 * Evaluation Harness
 *
 * Runs scenarios and collects metrics on latency, quality, and correctness.
 * Supports iteration and regression detection.
 */

import { performance } from "perf_hooks";
import { metrics } from "./metrics.js";

export type Scenario = {
  name: string;
  task: string;
  cwd: string;
  expect?: {
    filesContain?: Array<{ path: string; mustInclude: string[]; mustNotInclude?: string[] }>;
    codeQuality?: Array<{ type: "eslint" | "tsc" | "tests" | "security"; threshold?: number }>;
  };
  timeout?: number;
};

export type ScenarioResult = {
  name: string;
  ms: number;
  error: string | null;
  checks: any;
  pass: boolean;
  timestamp: number;
};

export type EvalReport = {
  timestamp: number;
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  totalTime: number;
  avgTime: number;
  results: ScenarioResult[];
  regressions?: Array<{ scenario: string; previousMs: number; currentMs: number; increase: number }>;
};

/**
 * Run a single scenario
 *
 * @param scenario - Scenario to run
 * @param runTask - Function to execute the task
 * @returns Scenario result
 */
export async function runScenario(
  scenario: Scenario,
  runTask: (s: Scenario) => Promise<void>
): Promise<ScenarioResult> {
  const t0 = performance.now();
  let error: string | null = null;

  try {
    const timeout = scenario.timeout ?? 60000; // 60 second default timeout
    const timeoutPromise = new Promise<void>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
    );

    await Promise.race([runTask(scenario), timeoutPromise]);
  } catch (err: any) {
    error = String(err?.message || err);
  }

  const t1 = performance.now();
  const checks = await metrics.check(scenario);

  return {
    name: scenario.name,
    ms: t1 - t0,
    error,
    checks,
    pass: !error && checks.pass,
    timestamp: Date.now()
  };
}

/**
 * Run multiple scenarios
 *
 * @param scenarios - Scenarios to run
 * @param runTask - Function to execute tasks
 * @returns Eval report
 */
export async function runScenarios(
  scenarios: Scenario[],
  runTask: (s: Scenario) => Promise<void>
): Promise<EvalReport> {
  const t0 = performance.now();
  const results: ScenarioResult[] = [];

  for (const scenario of scenarios) {
    const result = await runScenario(scenario, runTask);
    results.push(result);
  }

  const t1 = performance.now();
  const totalTime = t1 - t0;
  const passedScenarios = results.filter(r => r.pass).length;
  const failedScenarios = results.filter(r => !r.pass).length;

  return {
    timestamp: Date.now(),
    totalScenarios: scenarios.length,
    passedScenarios,
    failedScenarios,
    totalTime,
    avgTime: totalTime / scenarios.length,
    results
  };
}

/**
 * Run scenarios with baseline comparison
 *
 * @param scenarios - Scenarios to run
 * @param runTask - Function to execute tasks
 * @param baseline - Previous results for comparison
 * @returns Eval report with regressions
 */
export async function runScenariosWithBaseline(
  scenarios: Scenario[],
  runTask: (s: Scenario) => Promise<void>,
  baseline?: EvalReport
): Promise<EvalReport> {
  const report = await runScenarios(scenarios, runTask);

  if (baseline) {
    const regressions: Array<{
      scenario: string;
      previousMs: number;
      currentMs: number;
      increase: number;
    }> = [];

    for (const result of report.results) {
      const baselineResult = baseline.results.find(r => r.name === result.name);
      if (baselineResult) {
        const increase = result.ms - baselineResult.ms;
        // Flag as regression if >20% slower
        if (increase > baselineResult.ms * 0.2) {
          regressions.push({
            scenario: result.name,
            previousMs: baselineResult.ms,
            currentMs: result.ms,
            increase
          });
        }
      }
    }

    if (regressions.length > 0) {
      report.regressions = regressions;
    }
  }

  return report;
}

/**
 * Format eval report as human-readable string
 *
 * @param report - Eval report
 * @returns Formatted string
 */
export function formatReport(report: EvalReport): string {
  const lines: string[] = [
    "=== Evaluation Report ===",
    `Timestamp: ${new Date(report.timestamp).toISOString()}`,
    `Total Scenarios: ${report.totalScenarios}`,
    `Passed: ${report.passedScenarios} ✅`,
    `Failed: ${report.failedScenarios} ❌`,
    `Total Time: ${report.totalTime.toFixed(2)}ms`,
    `Average Time: ${report.avgTime.toFixed(2)}ms`,
    ""
  ];

  for (const result of report.results) {
    const status = result.pass ? "✅" : "❌";
    lines.push(`${status} ${result.name} (${result.ms.toFixed(2)}ms)`);
    if (result.error) {
      lines.push(`   Error: ${result.error}`);
    }
    if (result.checks.unit && result.checks.unit.length > 0) {
      for (const check of result.checks.unit) {
        const checkStatus = check.ok ? "✓" : "✗";
        lines.push(`   ${checkStatus} ${check.path}`);
        if (check.details) {
          lines.push(`      ${check.details}`);
        }
      }
    }
  }

  if (report.regressions && report.regressions.length > 0) {
    lines.push("");
    lines.push("=== Regressions Detected ===");
    for (const regression of report.regressions) {
      const increase = regression.increase.toFixed(2);
      const percent = ((regression.increase / regression.previousMs) * 100).toFixed(1);
      lines.push(
        `⚠️  ${regression.scenario}: ${regression.previousMs.toFixed(2)}ms → ${regression.currentMs.toFixed(2)}ms (+${increase}ms, +${percent}%)`
      );
    }
  }

  return lines.join("\n");
}

/**
 * Save eval report to file
 *
 * @param report - Eval report
 * @param filePath - Path to save to
 */
export function saveReport(report: EvalReport, filePath: string): void {
  const fs = require("fs");
  const path = require("path");

  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(report, null, 2), "utf8");
}

/**
 * Load eval report from file
 *
 * @param filePath - Path to load from
 * @returns Eval report or null
 */
export function loadReport(filePath: string): EvalReport | null {
  const fs = require("fs");

  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content) as EvalReport;
  } catch {
    return null;
  }
}

/**
 * Compare two eval reports
 *
 * @param current - Current report
 * @param previous - Previous report
 * @returns Comparison summary
 */
export function compareReports(
  current: EvalReport,
  previous: EvalReport
): {
  passRateChange: number;
  avgTimeChange: number;
  regressions: number;
  improvements: number;
} {
  const currentPassRate = current.passedScenarios / current.totalScenarios;
  const previousPassRate = previous.passedScenarios / previous.totalScenarios;
  const passRateChange = (currentPassRate - previousPassRate) * 100;

  const avgTimeChange = current.avgTime - previous.avgTime;

  let regressions = 0;
  let improvements = 0;

  for (const result of current.results) {
    const prevResult = previous.results.find(r => r.name === result.name);
    if (prevResult) {
      if (result.pass && !prevResult.pass) {
        improvements++;
      } else if (!result.pass && prevResult.pass) {
        regressions++;
      }
    }
  }

  return { passRateChange, avgTimeChange, regressions, improvements };
}

