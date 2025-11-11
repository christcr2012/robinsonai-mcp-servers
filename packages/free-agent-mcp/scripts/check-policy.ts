import fs from "fs";
import path from "path";

const root = path.resolve(process.cwd());
const src = path.join(root, "packages/free-agent-mcp/src");

// 1) No manual handlers alongside generated ones
const handlersDir = path.join(src, "handlers");
const files = fs.existsSync(handlersDir) ? fs.readdirSync(handlersDir) : [];
const manual = files.filter(
  (f) => f.endsWith(".ts") && f !== "handlers.generated.ts" && f !== "index.ts"
);
if (manual.length) {
  console.error("[policy] Manual handlers detected:", manual.join(", "));
  process.exit(1);
}

// 2) Scan repo for forbidden patterns
const forbid = [
  /Placeholder for real implementation/i,
  /\bany\b(?!\s*=>)/,                     // 'any' types
  /from\s+['"]@src\/spec\/types['"]/,     // hallucinated imports
  /path\/to\/gateway\/handlers\.ts/,      // fake paths
  /default_collection\b/                  // hardcoded collection
];

function walk(d: string): string[] {
  return fs.readdirSync(d).flatMap((n) => {
    const p = path.join(d, n);
    const s = fs.statSync(p);
    if (s.isDirectory()) return walk(p);
    return p.endsWith(".ts") || p.endsWith(".tsx") ? [p] : [];
  });
}

const filesTs = fs.existsSync(src) ? walk(src) : [];
const hits: Array<{ file: string; pattern: RegExp }> = [];
for (const f of filesTs) {
  const t = fs.readFileSync(f, "utf8");
  for (const re of forbid) {
    if (re.test(t)) hits.push({ file: f, pattern: re });
  }
}
if (hits.length) {
  console.error(
    "[policy] Forbidden patterns found:\n" +
      hits.map((h) => ` - ${h.file}: ${h.pattern}`).join("\n")
  );
  process.exit(1);
}

console.log("[policy] ✅ Build-time policy checks passed.");

