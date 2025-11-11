#!/usr/bin/env node
import { resolve } from "path";
import { runFreeAgent } from "./runner.js";

function arg(name: string, def?: string): string {
  const ix = process.argv.indexOf(name);
  return ix > 0 ? process.argv[ix + 1] : (def ?? "");
}

(async () => {
  const repo = resolve(arg("--repo", process.cwd()));
  const task = arg("--task") || "Hello world";
  const kind = (arg("--kind", "feature") as any);

  console.log(`[Free Agent Core] Starting...`);
  console.log(`  Repo: ${repo}`);
  console.log(`  Task: ${task}`);
  console.log(`  Kind: ${kind}`);

  await runFreeAgent({ repo, task, kind });

  console.log(`[Free Agent Core] Done!`);
})().catch((e) => {
  console.error("[Free Agent Core] Error:", e.message);
  process.exit(1);
});

