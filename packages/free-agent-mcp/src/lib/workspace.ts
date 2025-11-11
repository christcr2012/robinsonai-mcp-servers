import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { execSync } from "child_process";

/**
 * Resolve workspace root for MCP server context.
 * 
 * MCP servers run from VS Code's installation directory, not the workspace root.
 * This function detects the workspace root using multiple strategies:
 * 
 * 1. Environment variables (WORKSPACE_ROOT, INIT_CWD, PWD)
 * 2. Git toplevel (git rev-parse --show-toplevel)
 * 3. Upward search for workspace markers (.git, package.json, pnpm-workspace.yaml)
 * 4. Fallback to process.cwd()
 */
export function resolveWorkspaceRoot(): string {
  // 1) Check environment variables first
  const envRoot =
    process.env.WORKSPACE_ROOT ||
    process.env.INIT_CWD ||
    process.env.PWD;
  if (envRoot && existsSync(envRoot)) {
    console.error(`[WorkspaceRoot] Using env var: ${envRoot}`);
    return normalize(envRoot);
  }

  // 2) Try git toplevel (works even when server cwd != repo)
  try {
    const out = execSync("git rev-parse --show-toplevel", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    if (out && existsSync(out)) {
      console.error(`[WorkspaceRoot] Using git toplevel: ${out}`);
      return normalize(out);
    }
  } catch {
    // git command failed, continue to next strategy
  }

  // 3) Walk upward looking for a repo root marker
  let cur = process.cwd();
  for (let i = 0; i < 10; i++) {
    if (
      existsSync(resolve(cur, ".git")) ||
      existsSync(resolve(cur, "pnpm-workspace.yaml")) ||
      existsSync(resolve(cur, "package.json"))
    ) {
      console.error(`[WorkspaceRoot] Found marker in: ${cur}`);
      return normalize(cur);
    }
    const parent = dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }

  // 4) Fallback: cwd (as last resort)
  const fallback = normalize(process.cwd());
  console.error(`[WorkspaceRoot] Using process.cwd(): ${fallback}`);
  return fallback;
}

export function normalize(p: string): string {
  // unify slashes for Windows/JSON
  return p.replace(/\\/g, "/");
}

// Legacy export for backward compatibility
export function getWorkspaceRoot(): string {
  return resolveWorkspaceRoot();
}

