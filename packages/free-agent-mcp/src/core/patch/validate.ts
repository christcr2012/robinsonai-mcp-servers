import { spawnSync } from "child_process";

/**
 * Validate that a patch can be applied to a repository
 * Logs debug info about the patch application attempt
 */
export function gitApplyCheck(patch: string, cwd: string) {
  // Extract file paths from patch for logging
  const fileMatches = patch.match(/^diff --git a\/(.+?) b\/.+?$/gm);
  const files = fileMatches ? fileMatches.map(m => m.match(/^diff --git a\/(.+?) b\/.+?$/)?.[1]).filter(Boolean) : [];

  // Log patch application attempt (debug level - only file paths, not full patch)
  if (process.env.CODEGEN_VERBOSE === "1" || process.env.DEBUG) {
    console.log(`[gitApplyCheck] Target repo: ${cwd}`);
    console.log(`[gitApplyCheck] Files being patched: ${files.join(", ") || "(none detected)"}`);
    console.log(`[gitApplyCheck] Patch size: ${patch.length} chars`);
  }

  const p = spawnSync("git", ["apply", "--check", "-"], { input: patch, cwd, encoding: "utf8" });

  if (p.status !== 0) {
    // Log detailed error info
    const errorMsg = p.stderr || p.stdout || "(no error message)";
    console.error(`[gitApplyCheck] FAILED in repo: ${cwd}`);
    console.error(`[gitApplyCheck] Files attempted: ${files.join(", ") || "(none detected)"}`);
    console.error(`[gitApplyCheck] Git error: ${errorMsg}`);
    throw new Error(`git apply --check failed: ${errorMsg}`);
  }

  if (process.env.CODEGEN_VERBOSE === "1" || process.env.DEBUG) {
    console.log(`[gitApplyCheck] ✓ PASS`);
  }
}

