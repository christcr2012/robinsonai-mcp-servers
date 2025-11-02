// packages/thinking-tools-mcp/src/lib/workspace.ts
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { execSync } from "child_process";

export function resolveWorkspaceRoot(): string {
  // 1) Prefer explicit env passed from Augment Code MCP config
  const envRoot =
    process.env.AUGMENT_WORKSPACE_ROOT ||
    process.env.WORKSPACE_ROOT ||
    process.env.WORKSPACE_FOLDER;
  if (envRoot && existsSync(envRoot)) return normalize(envRoot);

  // 2) Try git toplevel (works even when server cwd != repo)
  try {
    const out = execSync("git rev-parse --show-toplevel", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    if (out && existsSync(out)) return normalize(out);
  } catch {}

  // 3) Walk upward looking for a repo root marker
  let cur = process.cwd();
  for (let i = 0; i < 10; i++) {
    if (
      existsSync(resolve(cur, ".git")) ||
      existsSync(resolve(cur, "pnpm-workspace.yaml")) ||
      existsSync(resolve(cur, "package.json"))
    ) {
      return normalize(cur);
    }
    const parent = dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }

  // 4) Fallback: cwd (as last resort)
  return normalize(process.cwd());
}

export function normalize(p: string): string {
  // unify slashes for Windows/JSON
  return p.replace(/\\/g, "/");
}

// Legacy export for backward compatibility
export function getWorkspaceRoot(): string {
  return resolveWorkspaceRoot();
}

