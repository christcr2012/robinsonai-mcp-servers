import { resolve, dirname } from "node:path";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";

/**
 * Get the workspace root directory for MCP server context.
 *
 * MCP servers run from VS Code's installation directory, not the workspace root.
 * This function detects the workspace root using multiple strategies:
 *
 * 1. Environment variables (WORKSPACE_ROOT, INIT_CWD, PWD)
 * 2. Git toplevel (git rev-parse --show-toplevel)
 * 3. Upward search for workspace markers (.git, package.json, pnpm-workspace.yaml)
 * 4. Fallback to process.cwd()
 */
export function getWorkspaceRoot(): string {
  // 1) Check environment variables first
  const envVars = ['WORKSPACE_ROOT', 'INIT_CWD', 'PWD'];

  for (const varName of envVars) {
    const value = process.env[varName];
    if (value && existsSync(value)) {
      console.error(`[WorkspaceRoot] Using ${varName}: ${value}`);
      return resolve(value);
    }
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
      return resolve(out);
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
      return resolve(cur);
    }
    const parent = dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }

  // 4) Fallback: cwd (as last resort)
  const fallback = resolve(process.cwd());
  console.error(`[WorkspaceRoot] Using process.cwd(): ${fallback}`);
  return fallback;
}

