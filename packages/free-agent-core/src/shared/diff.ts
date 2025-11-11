import { spawnSync } from "child_process";

/**
 * Apply a unified diff to a repository using git apply
 */
export async function applyUnifiedDiff(
  cwd: string,
  diff: string
): Promise<void> {
  const p = spawnSync("git", ["apply", "-p0", "--reject", "--whitespace=fix"], {
    cwd,
    input: diff,
    encoding: "utf8",
  });

  if ((p.status ?? 1) !== 0) {
    throw new Error(`[Diff] git apply failed:\n${p.stderr}`);
  }

  console.log(`[Diff] Applied patch successfully`);
}

