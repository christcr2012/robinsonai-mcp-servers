import { promises as fs } from "node:fs";
import { join, relative } from "node:path";

export type ScoredFile = { path: string; score: number; size: number; preview?: string };

const DEFAULT_INCLUDE = [".md",".mdx",".txt",".json",".yml",".yaml",".ts",".tsx",".js",".jsx"];
const EXCLUDE_DIRS = new Set([".git","node_modules",".robctx",".next","dist","build","out","coverage",".cache",".nuxt","vendor"]);

function norm(p: string) {
  // Normalize backslashes so scores don't duplicate on Windows
  return p.replace(/\\/g, "/");
}

async function walk(root: string, arr: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  for (const e of entries) {
    const full = join(root, e.name);
    if (e.isDirectory()) {
      if (EXCLUDE_DIRS.has(e.name)) continue;
      await walk(full, arr);
    } else {
      arr.push(full);
    }
  }
  return arr;
}

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9_]+/g," ").split(/\s+/).filter(Boolean);
}

function makeWeights(query: string[]) {
  // query term weights (basic); boost multi-word phrases by repeating them
  const w = new Map<string, number>();
  for (const q of query) w.set(q, (w.get(q) || 0) + 1.0);
  return w;
}

function scoreText(text: string, weights: Map<string, number>) {
  const toks = tokenize(text);
  let score = 0;
  for (const t of toks) {
    const w = weights.get(t);
    if (w) score += w;
  }
  // light boost for headings / code fences
  const headingHits = (text.match(/^#{1,6}\s/mg) || []).length;
  return score + headingHits * 0.25;
}

export async function rankRepoFiles(opts: {
  repoRoot: string;
  query: string;
  limit?: number;
  includeExt?: string[];
}) {
  const { repoRoot, query, limit = 25, includeExt = DEFAULT_INCLUDE } = opts;
  const words = tokenize(query);
  const weights = makeWeights(words);

  const files = await walk(repoRoot);
  const scored: ScoredFile[] = [];

  for (const f of files) {
    const ext = f.slice(f.lastIndexOf(".")).toLowerCase();
    if (!includeExt.includes(ext)) continue;
    try {
      const raw = await fs.readFile(f, "utf8");
      const s = scoreText(raw, weights);
      if (s > 0) {
        scored.push({
          path: norm(relative(repoRoot, f)),
          score: s,
          size: raw.length,
          preview: raw.slice(0, 400)
        });
      }
    } catch { /* ignore unreadables */ }
  }

  scored.sort((a,b) => b.score - a.score || a.size - b.size);
  return scored.slice(0, limit);
}

