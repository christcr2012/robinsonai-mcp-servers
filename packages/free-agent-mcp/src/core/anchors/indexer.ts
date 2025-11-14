import fs from "fs";
import path from "path";
import fg from "fast-glob";
import { extractAnchors } from "./extract.js";
import { AnchorHints } from "./types.js";

export async function buildAnchorHints(repoRoot: string, targetPaths: string[], exemplarPaths: string[]): Promise<AnchorHints> {
  const byFile: Record<string, { allowed: string[] }> = {};

  // collect unique, existing files to scan
  const candidates = new Set<string>();
  for (const p of targetPaths) candidates.add(p);
  for (const p of exemplarPaths) candidates.add(p);
  // glob when a target is a directory-style path
  const extra: string[] = [];
  for (const p of [...candidates]) {
    if (p.endsWith("/**") || p.endsWith("/*")) {
      const matches = await fg(p, { cwd: repoRoot, dot:false });
      matches.forEach(m => extra.push(m));
      candidates.delete(p);
    }
  }
  extra.forEach(e => candidates.add(e));

  for (const rel of candidates) {
    const abs = path.join(repoRoot, rel);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) continue;
    const content = fs.readFileSync(abs, "utf8");
    const fa = extractAnchors(rel, content);
    byFile[rel] = { allowed: fa.anchors.map(a => a.text) };
  }

  return { byFile };
}

