/**
 * Evaluation Runner
 *
 * Runs Free Agent evals against sample scenarios.
 * Collects latency, quality, and correctness metrics.
 * Detects regressions against baseline.
 *
 * Usage:
 *   pnpm ts-node scripts/run-evals.ts
 *   pnpm ts-node scripts/run-evals.ts --baseline ./evals/baseline.json
 *   pnpm ts-node scripts/run-evals.ts --save ./evals/latest.json
 */

import * as fs from "fs";
import * as path from "path";
import scenarios from "../packages/free-agent-mcp/src/evals/scenarios.sample.json";
import {
  runScenariosWithBaseline,
  formatReport,
  saveReport,
  loadReport,
  compareReports,
  type Scenario
} from "../packages/free-agent-mcp/src/evals/harness";
import { submit } from "../packages/free-agent-mcp/src/orchestrator";

/**
 * Parse command line arguments
 */
function parseArgs(): {
  baseline?: string;
  save?: string;
  verbose: boolean;
} {
  const args = process.argv.slice(2);
  const result = { baseline: undefined as string | undefined, save: undefined as string | undefined, verbose: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--baseline" && i + 1 < args.length) {
      result.baseline = args[++i];
    } else if (args[i] === "--save" && i + 1 < args.length) {
      result.save = args[++i];
    } else if (args[i] === "--verbose" || args[i] === "-v") {
      result.verbose = true;
    }
  }

  return result;
}

/**
 * Main eval runner
 */
async function main() {
  const args = parseArgs();

  console.log("🧪 Free Agent Evaluation Runner");
  console.log(`📊 Running ${scenarios.length} scenarios...\n`);

  // Load baseline if provided
  let baseline = undefined;
  if (args.baseline) {
    baseline = loadReport(args.baseline);
    if (baseline) {
      console.log(`📈 Loaded baseline from ${args.baseline}`);
      console.log(`   Previous: ${baseline.passedScenarios}/${baseline.totalScenarios} passed\n`);
    } else {
      console.warn(`⚠️  Could not load baseline from ${args.baseline}\n`);
    }
  }

  // Run scenarios
  const report = await runScenariosWithBaseline(
    scenarios as Scenario[],
    async (scenario: Scenario) => {
      if (args.verbose) {
        console.log(`  Running: ${scenario.name}`);
      }
      try {
        await submit({
          kind: "feature",
          detail: scenario.task,
          cwd: scenario.cwd
        });
      } catch (err) {
        if (args.verbose) {
          console.log(`    Error: ${(err as Error).message}`);
        }
      }
    },
    baseline
  );

  // Print report
  console.log(formatReport(report));

  // Compare with baseline if available
  if (baseline) {
    console.log("\n=== Comparison with Baseline ===");
    const comparison = compareReports(report, baseline);
    console.log(`Pass Rate: ${comparison.passRateChange > 0 ? "+" : ""}${comparison.passRateChange.toFixed(1)}%`);
    console.log(`Avg Time: ${comparison.avgTimeChange > 0 ? "+" : ""}${comparison.avgTimeChange.toFixed(2)}ms`);
    console.log(`Regressions: ${comparison.regressions}`);
    console.log(`Improvements: ${comparison.improvements}`);
  }

  // Save report if requested
  if (args.save) {
    const dir = path.dirname(args.save);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    saveReport(report, args.save);
    console.log(`\n💾 Report saved to ${args.save}`);
  }

  // Exit with appropriate code
  const exitCode = report.failedScenarios > 0 ? 1 : 0;
  process.exit(exitCode);
}

// Run
main().catch(err => {
  console.error("❌ Eval runner failed:", err);
  process.exit(1);
});

