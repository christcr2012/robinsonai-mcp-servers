import { runFreeAgent } from "../runner.js";

export interface Scenario {
  name: string;
  repo: string;
  kind: "feature" | "bugfix" | "refactor" | "research";
  task: string;
}

export interface BatchResult {
  name: string;
  ok: boolean;
  error?: string;
  duration?: number;
}

export async function runBatch(scenarios: Scenario[]): Promise<BatchResult[]> {
  const results: BatchResult[] = [];

  for (const scenario of scenarios) {
    const start = Date.now();
    let ok = true;
    let error: string | undefined;

    try {
      await runFreeAgent({
        repo: scenario.repo,
        kind: scenario.kind,
        task: scenario.task
      });
    } catch (e: any) {
      ok = false;
      error = String(e?.message || e);
    }

    const duration = Date.now() - start;
    results.push({
      name: scenario.name,
      ok,
      error,
      duration
    });

    console.log(`[Batch] ${scenario.name}: ${ok ? "✓" : "✗"} (${duration}ms)`);
  }

  console.log("\n=== BATCH RESULTS ===");
  console.log(JSON.stringify(results, null, 2));
  return results;
}

