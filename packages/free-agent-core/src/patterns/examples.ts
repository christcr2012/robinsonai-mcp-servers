import fs from "fs";
import path from "path";

export interface Example {
  path: string;
  content: string;
}

export function pickExamples(repo: string, contract: { layout: { baseDir: string } }, maxFiles = 6): Example[] {
  const base = path.join(repo, contract.layout.baseDir);
  const files: { p: string; size: number }[] = [];
  
  (function rec(d: string) {
    if (!fs.existsSync(d)) return;
    for (const n of fs.readdirSync(d)) {
      const p = path.join(d, n);
      const s = fs.statSync(p);
      if (s.isDirectory()) rec(p);
      else if (/\.(ts|tsx|js|jsx)$/.test(p)) files.push({ p, size: s.size });
    }
  })(base);
  
  files.sort((a, b) => b.size - a.size);
  return files.slice(0, maxFiles).map(f => ({
    path: f.p.replace(repo + path.sep, "").replace(/\\/g, "/"),
    content: fs.readFileSync(f.p, "utf8")
  }));
}

