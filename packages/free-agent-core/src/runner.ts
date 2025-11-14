import { loadAdapter } from "./repo/adapter.js";
import { discover } from "./repo/discover.js";
import { ensureCodegen } from "./spec/codegen.js";
import { buildPipeline } from "./pipeline/index.js";
import { learnPatternContract } from "./patterns/learn.js";
import { pickExamples } from "./patterns/examples.js";
import type { AgentTask, AgentRunResult } from './task.js';

export async function runFreeAgent(opts: {
  repo: string;
  task: string;
  kind: "feature" | "bugfix" | "refactor" | "research";
  tier?: "free" | "paid";
  quality?: "fast" | "balanced" | "best" | "auto";
}) {
  // 1) pick adapter: per-repo config > auto-discover > defaults
  const base = await discover(opts.repo);
  const adapter = await loadAdapter(base);

  console.log(`[Runner] Adapter: ${adapter.name}`);

  // 2) learn pattern contract from repo
  const contract = learnPatternContract(base);
  const exemplars = pickExamples(base, contract, 6);
  console.log(
    `[Runner] Learned contract with ${contract.containers.length} containers, ${contract.wrappers.length} wrappers`
  );

  // 3) ensure spec-first handlers exist (registry path/URL, not repo-bound)
  const specRegistry =
    process.env.FREE_AGENT_SPEC ?? adapter.specRegistry;
  if (specRegistry) {
    console.log(`[Runner] Spec registry: ${specRegistry}`);
    await ensureCodegen({
      registry: specRegistry,
      outDir: adapter.codegenOutDir,
    });
  }

  // 4) run repo-specific gates/commands via adapter (build/lint/test are abstract)
  const pipe = buildPipeline({ adapter, repo: base, contract, exemplars });
  await pipe.run(opts.kind, opts.task, {
    tier: opts.tier || (process.env.FREE_AGENT_TIER as any) || "free",
    quality: (opts.quality as any) || (process.env.FREE_AGENT_QUALITY as any) || "auto",
  });
}

/**
 * Generic agent task runner - neutral entrypoint for both Free and Paid agents
 * This is the shared Agent Core interface used by both MCP servers
 */
export async function runAgentTask(task: AgentTask): Promise<AgentRunResult> {
  await runFreeAgent({
    repo: task.repo,
    task: task.task,
    kind: task.kind,
    tier: task.tier,
    quality: task.quality,
  });

  // Future: return richer data (patches applied, tests run, etc.)
  return { success: true };
}

