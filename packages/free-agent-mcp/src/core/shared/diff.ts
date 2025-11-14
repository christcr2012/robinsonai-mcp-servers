import { spawnSync } from "child_process";

/**
 * Apply a unified diff to a repository using git apply
 * Logs debug info about the patch application
 */
export async function applyUnifiedDiff(
  cwd: string,
  diff: string
): Promise<void> {
  // Extract file paths from patch for logging
  const fileMatches = diff.match(/^diff --git a\/(.+?) b\/.+?$/gm);
  const files = fileMatches ? fileMatches.map(m => m.match(/^diff --git a\/(.+?) b\/.+?$/)?.[1]).filter(Boolean) : [];

  // Log patch application attempt (debug level - only file paths, not full patch)
  if (process.env.CODEGEN_VERBOSE === "1" || process.env.DEBUG) {
    console.log(`[applyUnifiedDiff] Target repo: ${cwd}`);
    console.log(`[applyUnifiedDiff] Files being patched: ${files.join(", ") || "(none detected)"}`);
    console.log(`[applyUnifiedDiff] Patch size: ${diff.length} chars`);
  }

  const p = spawnSync("git", ["apply", "-p1", "--reject", "--whitespace=fix"], {
    cwd,
    input: diff,
    encoding: "utf8",
  });

  if ((p.status ?? 1) !== 0) {
    // Log detailed error info
    const errorMsg = p.stderr || p.stdout || "(no error message)";
    console.error(`[applyUnifiedDiff] FAILED in repo: ${cwd}`);
    console.error(`[applyUnifiedDiff] Files attempted: ${files.join(", ") || "(none detected)"}`);
    console.error(`[applyUnifiedDiff] Git error: ${errorMsg}`);
    throw new Error(`[Diff] git apply failed:\n${errorMsg}`);
  }

  if (process.env.CODEGEN_VERBOSE === "1" || process.env.DEBUG) {
    console.log(`[applyUnifiedDiff] ✓ Applied patch successfully to ${files.length} file(s)`);
  } else {
    console.log(`[Diff] Applied patch successfully`);
  }
}

