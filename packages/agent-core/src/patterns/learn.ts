import fs from "fs";
import path from "path";
import { PatternContract } from "./contract.js";

function listFiles(base: string, exts = [".ts", ".tsx", ".js", ".jsx"]): string[] {
  const out: string[] = [];
  const ignore = ["node_modules", ".git", "dist", "build", ".next", "archived", "coverage"];

  (function rec(d: string) {
    if (!fs.existsSync(d)) return;

    try {
      const entries = fs.readdirSync(d);

      for (const n of entries) {
        if (ignore.includes(n)) continue;
        const p = path.join(d, n);

        try {
          const s = fs.statSync(p);
          if (s.isDirectory()) {
            rec(p);
          } else if (exts.includes(path.extname(p))) {
            out.push(p);
          }
        } catch (err) {
          // Skip files/directories that can't be accessed
          continue;
        }
      }
    } catch (err) {
      // Skip directories that can't be read
      return;
    }
  })(base);
  return out;
}

function guessLayout(files: string[]): { baseDir: string; testDir?: string; fileSuffix?: string } {
  const src = files.find(f => /\/src\//.test(f)) ? "src" : ".";
  const test = files.find(f => /(__tests__|\.test\.)/.test(f)) ? "__tests__" : undefined;
  const suffix = files.some(f => /\.controller\./.test(f))
    ? ".controller"
    : files.some(f => /\.handler\./.test(f))
    ? ".handler"
    : undefined;
  return { baseDir: src, testDir: test, fileSuffix: suffix };
}

function findWrappers(files: string[]) {
  const wrappers: { name: string; importFrom: string }[] = [];
  for (const f of files) {
    try {
      const code = fs.readFileSync(f, "utf8");
      const callsFetch = /\b(fetch|http|Fetch|axios|request)\s*\(/.test(code);
      const isUtil = /util|client|http|request|fetch|service|helper/.test(f);
      if (callsFetch && isUtil) {
        const m = code.match(/export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/g);
        if (m) {
          m.forEach(x => {
            const name = x.split("function")[1].trim();
            wrappers.push({ name, importFrom: relPath(f) });
          });
        }
      }
    } catch (e) {
      // skip files that can't be read
    }
  }
  return dedupe(wrappers);
}

function findContainers(files: string[]) {
  const containers: any[] = [];
  for (const f of files) {
    try {
      const code = fs.readFileSync(f, "utf8");
      const classDecls = code.match(/export\s+class\s+([A-Za-z0-9_]+)/g) || [];
      if (!classDecls.length) continue;
      const methodCount = (code.match(/\n\s*(public\s+)?(async\s+)?[A-Za-z0-9_]+\s*\(/g) || []).length;
      const fetchCount = (code.match(/\b(fetch|http|Fetch|axios)\s*\(/g) || []).length;
      if (methodCount >= 5 || fetchCount >= 2) {
        const parts = classDecls[0]?.split("class") || [];
        const name = parts[1]?.trim();
        if (name && name.length > 0) {
          containers.push({ kind: "class", name, file: relPath(f), methodStyle: "instance" });
        }
      }
    } catch (e) {
      // skip files that can't be read
    }
  }
  return containers;
}

function relPath(p: string) {
  return p.replace(process.cwd() + path.sep, "").replace(/\\/g, "/");
}

function dedupe<T extends { name: string; importFrom?: string }>(a: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of a) {
    const k = x.name + (x.importFrom || "");
    if (!seen.has(k)) {
      seen.add(k);
      out.push(x);
    }
  }
  return out;
}

export function learnPatternContract(repo: string): PatternContract {
  const files = listFiles(repo);
  const layout = guessLayout(files);
  const wrappers = findWrappers(files);
  const containers = findContainers(files);

  return {
    language: "ts",
    layout,
    containers,
    wrappers,
    imports: wrappers.map(w => ({ preferPath: w.importFrom })),
    naming: { methodCase: "camel", fileCase: "kebab" },
    forbid: ["default_collection", "Placeholder for real implementation", "TODO:", "FIXME:", "any"],
    baseDir: layout.baseDir
  };
}

