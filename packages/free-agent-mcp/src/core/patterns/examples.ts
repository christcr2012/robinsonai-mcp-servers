import fs from "fs";
import path from "path";

export interface Example {
  path: string;
  content: string;
}

export function pickExamples(repo: string, contract: { layout: { baseDir: string } }, maxFiles = 6): Example[] {
  const base = path.join(repo, contract.layout.baseDir);
  const files: { p: string; size: number }[] = [];

  // Directories to skip (archived, node_modules, etc.)
  const skipDirs = ['archived', 'node_modules', '.git', 'dist', 'build', '.next', 'coverage'];

  (function rec(d: string) {
    // Check if directory exists before trying to read it
    if (!fs.existsSync(d)) return;

    try {
      const entries = fs.readdirSync(d);

      for (const n of entries) {
        // Skip archived and other excluded directories
        if (skipDirs.includes(n)) continue;

        const p = path.join(d, n);

        try {
          const s = fs.statSync(p);
          if (s.isDirectory()) {
            rec(p);
          } else if (/\.(ts|tsx|js|jsx)$/.test(p)) {
            files.push({ p, size: s.size });
          }
        } catch (err) {
          // Skip files/directories that can't be accessed (permissions, broken symlinks, etc.)
          // This prevents crashes on missing or inaccessible paths
          continue;
        }
      }
    } catch (err) {
      // Skip directories that can't be read
      return;
    }
  })(base);

  files.sort((a, b) => b.size - a.size);
  return files.slice(0, maxFiles).map(f => ({
    path: f.p.replace(repo + path.sep, "").replace(/\\/g, "/"),
    content: fs.readFileSync(f.p, "utf8")
  }));
}

