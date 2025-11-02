# Robinson Context Engine - Global CLI Installer (Windows-safe version)
# Fixes fast-glob Windows path issues

$BASE = "$env:USERPROFILE\Robinson\context-engine"
Write-Host "📦 Installing Robinson Context Engine to: $BASE" -ForegroundColor Cyan

# Create directories
New-Item -ItemType Directory -Path "$BASE\bin" -Force -ErrorAction SilentlyContinue | Out-Null

# Create package.json
$packageJson = @'
{
  "name": "robinson-context-engine",
  "version": "1.1.0",
  "type": "module",
  "private": true,
  "bin": {
    "robinson-context": "bin/robinson-context.mjs"
  },
  "dependencies": {
    "fast-glob": "^3.3.2",
    "ignore": "^5.3.1",
    "strip-json-comments": "^5.0.1"
  }
}
'@

Set-Content -Path "$BASE\package.json" -Value $packageJson -Encoding UTF8
Write-Host "✅ Created package.json" -ForegroundColor Green

# Install dependencies
Push-Location $BASE
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install 2>&1 | Out-Null
Pop-Location
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Create bin/robinson-context.mjs
$binScript = @'
#!/usr/bin/env node
import { execFile } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const cmd = (process.argv[2] || "audit").toLowerCase();
const script = path.resolve(__dirname, "../run-audit.mjs");
const args = (cmd === "preview") ? ["--dry"] : [];

execFile(process.execPath, [script, ...args], { cwd: process.cwd() }, (err, stdout, stderr) => {
  if (err) {
    console.error(stderr || err.message);
    process.exit(1);
  }
  try {
    console.log(JSON.parse(stdout));
  } catch {
    console.log(stdout);
  }
});
'@

Set-Content -Path "$BASE\bin\robinson-context.mjs" -Value $binScript -Encoding UTF8
Write-Host "✅ Created bin/robinson-context.mjs" -ForegroundColor Green

# Create run-audit.mjs (Windows-safe version)
$auditScript = @'
import fs from "fs";
import path from "path";
import fg from "fast-glob";
import ignore from "ignore";

const repoRoot = process.cwd();
const CTX_INCLUDE = (process.env.CTX_INCLUDE || "**/*.{ts,tsx,js,jsx,md,mdx,json,yml,yaml,sql,py,sh,ps1}");
const CTX_EXCLUDE = (process.env.CTX_EXCLUDE || "").split(",").map(s=>s.trim()).filter(Boolean);
const CTX_MAX_FILES = parseInt(process.env.CTX_MAX_FILES || "8000", 10);
const DRY = process.argv.includes("--dry");
const REPORT_DIR = path.join(repoRoot, "reports");
const REPORT_MD  = path.join(REPORT_DIR, "CONTEXT_AUDIT.md");
const REPORT_JSON= path.join(REPORT_DIR, "context_audit.json");
const CLAIMS_MD  = path.join(REPORT_DIR, "CLAIMS_VS_CODE.md");
const ACTIONS_MD = path.join(REPORT_DIR, "NEXT_ACTIONS.md");

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, {recursive: true});
}

function loadIgnore(rr) {
  const ig = ignore();
  const add = p => {
    if (fs.existsSync(p)) ig.add(fs.readFileSync(p, "utf8"));
  };
  add(path.join(rr, ".gitignore"));
  add(path.join(rr, ".contextignore"));
  if (CTX_EXCLUDE.length) ig.add(CTX_EXCLUDE);
  ig.add([
    "**/node_modules/**",
    "**/.git/**",
    "**/dist/**",
    "**/build/**",
    "**/.next/**",
    "**/.turbo/**",
    "**/out/**"
  ]);
  return ig;
}

function readTextSafe(p) {
  try {
    const s = fs.readFileSync(p, "utf8");
    if (/\x00/.test(s)) return null;
    return s;
  } catch {
    return null;
  }
}

const kindOf = rel =>
  /\.mdx?$/.test(rel) ? "doc" :
  /\.(ts|tsx|js|jsx)$/.test(rel) ? "code" :
  /\.(yml|yaml|json)$/.test(rel) ? "config" :
  /\.(sql)$/.test(rel) ? "sql" :
  /\.(py|sh|ps1)$/.test(rel) ? "script" :
  "other";

function signals(content) {
  const lines = content.split(/\r?\n/);
  const hits = [];
  const push = (t, i, m) => hits.push({type: t, line: i + 1, match: m});
  
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    if (/\bTODO\b|\bFIXME\b/i.test(L)) push("todo", i, L.trim());
    if (/\bTBD\b|\bWIP\b/i.test(L)) push("todo", i, L.trim());
    if (/placeholder|stub(?!born)/i.test(L)) push("placeholder", i, L.trim());
    if (/throw\s+new\s+Error\(['"]?Not\s+implemented/i.test(L) || /\/\/\s*not\s+implemented/i.test(L))
      push("not_implemented", i, L.trim());
  }
  return hits;
}

function extractClaims(md) {
  const claims = [];
  const lines = md.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i].trim();
    if (/^[-*]\s/.test(L) || /^\d+\.\s/.test(L) || /should|will|must|guarantees|provides/i.test(L))
      claims.push({line: i + 1, text: L});
  }
  return claims;
}

const main = async () => {
  const ig = loadIgnore(repoRoot);
  const patterns = CTX_INCLUDE.split(",").map(s => s.trim()).filter(Boolean);
  
  // Windows-safe: use posix cwd so fast-glob doesn't choke on backslashes
  const cwdPosix = repoRoot.replace(/\\/g, "/");
  
  const all = await fg(patterns, {
    cwd: cwdPosix,
    dot: true,
    onlyFiles: true,
    unique: true,
    suppressErrors: true
  });
  
  const files = all.filter(f => !ig.ignores(f)).slice(0, CTX_MAX_FILES);
  
  if (DRY) {
    console.log(JSON.stringify({
      total: all.length,
      included: files.length,
      sample: files.slice(0, 50)
    }, null, 2));
    return;
  }

  const results = [];
  const claims = [];
  let placeholders = 0;
  let notImpl = 0;
  let todos = 0;
  
  for (const rel of files) {
    const abs = path.join(repoRoot, rel);
    const txt = readTextSafe(abs);
    if (txt == null) continue;
    
    const kind = kindOf(rel);
    const sig = signals(txt);
    
    placeholders += sig.filter(s => s.type === "placeholder").length;
    notImpl += sig.filter(s => s.type === "not_implemented").length;
    todos += sig.filter(s => s.type === "todo").length;
    
    results.push({
      path: rel,
      kind,
      counts: {
        placeholder: sig.filter(s => s.type === "placeholder").length,
        not_implemented: sig.filter(s => s.type === "not_implemented").length,
        todo: sig.filter(s => s.type === "todo").length
      },
      examples: sig.slice(0, 5)
    });
    
    if (kind === "doc") {
      claims.push(...extractClaims(txt).map(c => ({path: rel, ...c})));
    }
  }

  ensureDir(REPORT_DIR);
  
  fs.writeFileSync(REPORT_JSON, JSON.stringify({
    scanned: files.length,
    placeholders,
    notImplemented: notImpl,
    todos,
    claims: claims.length,
    results
  }, null, 2));
  
  const top = [...results]
    .sort((a, b) => (b.counts.placeholder + b.counts.not_implemented + b.counts.todo) - (a.counts.placeholder + a.counts.not_implemented + a.counts.todo))
    .slice(0, 30);
  
  const md = [
    "# CONTEXT AUDIT",
    `- Scanned files: **${files.length}**`,
    `- TODO: **${todos}**`,
    `- Placeholders: **${placeholders}**`,
    `- Not implemented: **${notImpl}**`,
    "",
    "## Top hotspots",
    ...top.map(h => `- ${h.path} — total:${h.counts.placeholder + h.counts.not_implemented + h.counts.todo} (todo:${h.counts.todo}, placeholders:${h.counts.placeholder}, not_impl:${h.counts.not_implemented})`),
    "",
    "## Examples",
    ...top.flatMap(h => h.examples.length ? [`### ${h.path}`, ...h.examples.map(e => `- ${e.type} @ ${h.path}:${e.line} — \`${e.match}\``)] : [])
  ];
  
  fs.writeFileSync(REPORT_MD, md.join("\n"));
  fs.writeFileSync(CLAIMS_MD, [
    "# CLAIMS vs CODE",
    `Total extracted claims: **${claims.length}**`,
    "",
    ...claims.slice(0, 200).map(c => `- ${c.path}:${c.line} — ${c.text}`)
  ].join("\n"));
  fs.writeFileSync(ACTIONS_MD, [
    "# NEXT ACTIONS (prioritized)",
    "1) Fix hotspots (see CONTEXT_AUDIT.md).",
    "2) Implement stubs or remove dead code.",
    "3) Align docs claims with proof points (tests/scripts).",
    "4) Re-run audit and commit reports."
  ].join("\n"));
  
  console.log(JSON.stringify({
    ok: true,
    reports: [
      path.relative(repoRoot, REPORT_MD),
      path.relative(repoRoot, CLAIMS_MD),
      path.relative(repoRoot, ACTIONS_MD),
      path.relative(repoRoot, REPORT_JSON)
    ]
  }, null, 2));
};

main().catch(e => {
  console.error(e);
  process.exit(1);
});
'@

Set-Content -Path "$BASE\run-audit.mjs" -Value $auditScript -Encoding UTF8
Write-Host "✅ Created run-audit.mjs (Windows-safe)" -ForegroundColor Green

# Make global
Push-Location $BASE
Write-Host "🔗 Linking globally..." -ForegroundColor Cyan
npm link 2>&1 | Out-Null
Pop-Location
Write-Host "✅ Linked globally" -ForegroundColor Green

# Verify installation
$whereResult = where.exe robinson-context 2>&1
if ($whereResult) {
    Write-Host "✅ robinson-context installed at: $whereResult" -ForegroundColor Green
} else {
    Write-Host "⚠️  robinson-context not found in PATH" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Usage:" -ForegroundColor Cyan
Write-Host "  robinson-context preview  # Preview files to be scanned"
Write-Host "  robinson-context audit    # Run full audit and write reports"

