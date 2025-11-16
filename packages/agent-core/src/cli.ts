#!/usr/bin/env node
import { runFreeAgent } from "./runner.js";
import { resolveRepoRoot, debugPaths } from "./utils/paths.js";

function arg(name: string, def?: string): string {
  const ix = process.argv.indexOf(name);
  return ix > 0 ? process.argv[ix + 1] : (def ?? "");
}

(async () => {
  const repoRoot = resolveRepoRoot(arg("--repo"));
  const task = arg("--task") || "Hello world";
  const kind = (arg("--kind", "feature") as any);

  debugPaths("cli", {
    cwd: process.cwd(),
    WORKSPACE_ROOT: process.env.WORKSPACE_ROOT || "(unset)",
    FREE_AGENT_REPO: process.env.FREE_AGENT_REPO || "(unset)",
    repoRoot,
  });

  console.log(`[Free Agent Core] Starting...`);
  console.log(`  Repo: ${repoRoot}`);
  console.log(`  Task: ${task}`);
  console.log(`  Kind: ${kind}`);

  await runFreeAgent({ repo: repoRoot, task, kind });

  console.log(`[Free Agent Core] Done!`);
})().catch((e) => {
  console.error("[Free Agent Core] Error:", e.message);
  process.exit(1);
});

