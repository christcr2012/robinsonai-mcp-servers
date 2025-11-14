import { spawnSync } from "child_process";

export function gitApplyCheck(patch: string, cwd: string) {
  const p = spawnSync("git", ["apply", "--check", "-"], { input: patch, cwd, encoding: "utf8" });
  if (p.status !== 0) throw new Error(`git apply --check failed: ${p.stderr || p.stdout}`);
}

