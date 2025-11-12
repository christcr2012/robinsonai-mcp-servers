import { loadAdapter } from "./repo/adapter.js";
import { discover } from "./repo/discover.js";
import { ensureCodegen } from "./spec/codegen.js";
import { buildPipeline } from "./pipeline/index.js";
import { learnPatternContract } from "./patterns/learn.js";
import { pickExamples } from "./patterns/examples.js";

export async function runFreeAgent(opts: {
  repo: string;
  task: string;
  kind: "feature" | "bugfix" | "refactor" | "research";
}) {
  // 1) pick adapter: per-repo config > auto-discover > defaults
  const base = await discover(opts.repo);
  const adapter = await loadAdapter(base);

  console.log(`[Runner] Adapter: ${adapter.name}`);

  // 2) learn pattern contract from repo
  const contract = learnPatternContract(base);
  const exemplars = pickExamples(base, contract, 6);
  console.log(`[Runner] Learned contract with ${contract.containers.length} containers, ${contract.wrappers.length} wrappers`);

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
  await pipe.run(opts.kind, opts.task);
}

