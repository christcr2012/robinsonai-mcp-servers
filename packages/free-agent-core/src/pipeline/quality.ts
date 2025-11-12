import { Adapter } from "../repo/types.js";
import { PatternContract } from "../patterns/contract.js";
import { Example } from "../patterns/examples.js";

export async function runQualityGates(
  adapter: Adapter,
  repo: string
): Promise<{ ok: boolean; report: any }> {
  console.log(`[Quality] Running quality gates...`);

  const eslint = await adapter.run(
    repo,
    adapter.cmd.eslint ?? "npx eslint . --max-warnings=0"
  );
  const tsc = await adapter.run(
    repo,
    adapter.cmd.tsc ?? "npx tsc --noEmit"
  );
  const tests = await adapter.run(
    repo,
    adapter.cmd.tests ?? "npx vitest run"
  );

  const ok = eslint.code === 0 && tsc.code === 0 && tests.code === 0;

  console.log(`[Quality] ESLint: ${eslint.code === 0 ? "✅" : "❌"}`);
  console.log(`[Quality] TypeScript: ${tsc.code === 0 ? "✅" : "❌"}`);
  console.log(`[Quality] Tests: ${tests.code === 0 ? "✅" : "❌"}`);

  return {
    ok,
    report: {
      eslint: eslint.out,
      tsc: tsc.out,
      tests: tests.out,
    },
  };
}

export async function judge(g: { report: any }): Promise<{ accept: boolean }> {
  // Simple, repo-agnostic rubric
  // Swap to your LLM judge if desired
  const hardFail =
    /error/i.test(g.report.eslint + g.report.tsc);

  return { accept: !hardFail };
}

export async function refineOnce({
  repo,
  task,
  gates,
  lastDiff,
  adapter,
  contract,
  exemplars,
}: {
  repo: string;
  task: string;
  gates: any;
  lastDiff: string;
  adapter: Adapter;
  contract?: PatternContract;
  exemplars?: Example[];
}): Promise<string> {
  console.log(`[Quality] Refining based on diagnostics...`);

  // Ask adapter to produce a new unified diff based on diagnostics
  const next = await adapter.refine({
    repo,
    task,
    diagnostics: gates.report,
    lastDiff,
    contract,
    exemplars,
  });

  return next.diff;
}

