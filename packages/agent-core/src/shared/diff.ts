import { spawnSync } from "child_process";

/**
 * Apply a unified diff to a repository using git apply
 */
export async function applyUnifiedDiff(
  cwd: string,
  diff: string
): Promise<void> {
  const p = spawnSync("git", ["apply", "-p1", "--reject", "--whitespace=fix"], {
    cwd,
    input: diff,
    encoding: "utf8",
  });

  if ((p.status ?? 1) !== 0) {
    const errorMsg = p.stderr || p.stdout || "(no error message)";
    throw new Error(`[Diff] git apply failed:\n${errorMsg}`);
  }

  console.log(`[Diff] Applied patch successfully`);
}

