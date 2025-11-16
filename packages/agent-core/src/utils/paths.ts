import fs from "fs";
import path from "path";

export function findWorkspaceRoot(start = process.cwd()): string | null {
  let dir = path.resolve(start);
  while (true) {
    const hit =
      fs.existsSync(path.join(dir, "pnpm-workspace.yaml")) ||
      fs.existsSync(path.join(dir, "yarn.lock")) ||
      fs.existsSync(path.join(dir, "package.json")) ||
      fs.existsSync(path.join(dir, ".git"));
    if (hit) return dir;
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}

export function resolveRepoRoot(input?: string): string {
  const arg = input || process.env.FREE_AGENT_REPO || ".";
  const ws = process.env.WORKSPACE_ROOT || findWorkspaceRoot() || process.cwd();
  const abs = path.isAbsolute(arg) ? arg : path.resolve(ws, arg);
  return path.normalize(abs);
}

export function resolveFromRepo(repoRoot: string, maybeRel: string): string {
  return path.isAbsolute(maybeRel) ? maybeRel : path.join(repoRoot, maybeRel);
}

export function ensureFile(filePath: string, defaultContent = "{}\n") {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, defaultContent);
}

export function debugPaths(label: string, o: Record<string, string>) {
  const lines = Object.entries(o).map(([k,v]) => `  ${k}: ${v}`);
  // eslint-disable-next-line no-console
  console.log(`[paths:${label}]` + "\n" + lines.join("\n"));
}

