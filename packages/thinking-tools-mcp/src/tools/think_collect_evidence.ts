// packages/thinking-tools-mcp/src/tools/think_collect_evidence.ts
import fg from "fast-glob";
import { promises as fs } from "fs";
import { resolve, dirname } from "path";
import { normalize, resolveWorkspaceRoot } from "../lib/workspace.js";

type CollectInput = {
  include?: string[]; // globs relative to repo root
  exclude?: string[]; // globs relative to repo root
  maxFiles?: number;  // safety cap
};

// Simple concurrency limiter
async function pLimit<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const task of tasks) {
    const p = task().then(result => {
      results.push(result);
      executing.splice(executing.indexOf(p), 1);
    });
    executing.push(p);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}

export async function think_collect_evidence(input: CollectInput = {}) {
  const root = resolveWorkspaceRoot();
  const include = input.include?.length ? input.include : ["**/*"];
  const exclude = [
    "**/node_modules/**",
    "**/.git/**",
    "**/dist/**",
    "**/build/**",
    "**/.cache/**",
    "**/backups/**",
    "**/*.lock",
    ".robctx/**",
    ...(input.exclude || []),
  ];

  const files = await fg(include, {
    cwd: root,
    ignore: exclude,
    dot: false,
    onlyFiles: true,
    followSymbolicLinks: true,
    absolute: false,
  });

  const capped = files.slice(0, input.maxFiles ?? 5000);
  const outDir = resolve(root, ".robctx/evidence");
  await fs.mkdir(outDir, { recursive: true });

  let written = 0;

  await pLimit(
    capped.map((rel) => async () => {
      const srcAbs = resolve(root, rel);
      try {
        const data = await fs.readFile(srcAbs, "utf8");
        const outAbs = resolve(outDir, rel);
        await fs.mkdir(dirname(outAbs), { recursive: true });
        await fs.writeFile(outAbs, data, "utf8");
        written++;
      } catch (e) {
        // ignore per-file failures; summarize below
      }
    }),
    16 // concurrency
  );

  // Validate before reporting success
  const exists = async (p: string) =>
    fs
      .access(p)
      .then(() => true)
      .catch(() => false);

  const ok = written > 0 && (await exists(outDir));

  return {
    ok,
    root: normalize(root),
    scanned: files.length,
    copied: written,
    output_dir: normalize(outDir),
    message: ok
      ? "Evidence collected."
      : "No files were written. Check include/exclude patterns or permissions.",
  };
}

