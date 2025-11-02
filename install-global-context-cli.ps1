# Install Global Robinson Context CLI
# Creates a global CLI at robinson-context that works in any repo

Write-Host "🚀 Installing Global Robinson Context CLI..." -ForegroundColor Cyan

# 1) Create clean home and package
$contextHome = "$env:USERPROFILE\Robinson\context-engine"
Write-Host "Creating directory: $contextHome" -ForegroundColor Yellow
New-Item -ItemType Directory -Path "$contextHome\bin" -Force | Out-Null
Set-Location $contextHome

# 2) Create package.json
Write-Host "Creating package.json..." -ForegroundColor Yellow
$packageJson = @'
{
  "name": "robinson-context-engine",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "bin": { "robinson-context": "bin/robinson-context.mjs" },
  "dependencies": {
    "fast-glob": "^3.3.2",
    "ignore": "^5.3.1",
    "strip-json-comments": "^5.0.1"
  }
}
'@
Set-Content package.json $packageJson

# 3) Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# 4) Create global wrapper (bin/robinson-context.mjs)
Write-Host "Creating bin/robinson-context.mjs..." -ForegroundColor Yellow
$wrapperScript = @'
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
  if (err) { console.error(stderr || err.message); process.exit(1); }
  try { console.log(JSON.parse(stdout)); } catch { console.log(stdout); }
});
'@
Set-Content bin/robinson-context.mjs $wrapperScript

# 5) Create audit engine (run-audit.mjs)
Write-Host "Creating run-audit.mjs..." -ForegroundColor Yellow
$auditScript = @'
/* Robinson Context Engine – Audit Runner (global) */
import fs from 'fs'; import path from 'path'; import fg from 'fast-glob'; import ignore from 'ignore';
const repoRoot = process.cwd();
const CTX_INCLUDE = (process.env.CTX_INCLUDE || '**/*.{ts,tsx,js,jsx,md,mdx,json,yml,yaml,sql,py,sh,ps1}');
const CTX_EXCLUDE = (process.env.CTX_EXCLUDE || '').split(',').map(s=>s.trim()).filter(Boolean);
const CTX_MAX_FILES = parseInt(process.env.CTX_MAX_FILES || '8000', 10);
const DRY = process.argv.includes('--dry');
const REPORT_DIR = path.join(repoRoot, 'reports');
const REPORT_MD  = path.join(REPORT_DIR, 'CONTEXT_AUDIT.md');
const REPORT_JSON= path.join(REPORT_DIR, 'context_audit.json');
const CLAIMS_MD  = path.join(REPORT_DIR, 'CLAIMS_VS_CODE.md');
const ACTIONS_MD = path.join(REPORT_DIR, 'NEXT_ACTIONS.md');
function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p,{recursive:true}); }
function loadIgnore(rr){ const ig=ignore(); const add=p=>{ if(fs.existsSync(p)) ig.add(fs.readFileSync(p,'utf8')); };
  add(path.join(rr,'.gitignore')); add(path.join(rr,'.contextignore'));
  if (CTX_EXCLUDE.length) ig.add(CTX_EXCLUDE);
  ig.add(['**/node_modules/**','**/.git/**','**/dist/**','**/build/**','**/.next/**','**/.turbo/**','**/out/**']); return ig; }
function readTextSafe(p){ try{ const s=fs.readFileSync(p,'utf8'); if(/\x00/.test(s)) return null; return s; }catch{return null;} }
function basicSignals(content){ const lines=content.split(/\r?\n/); const hits=[]; const push=(t,i,m)=>hits.push({type:t,line:i+1,match:m});
  for(let i=0;i<lines.length;i++){const L=lines[i];
    if(/\bTODO\b|\bFIXME\b/i.test(L)) push('todo',i,L.trim());
    if(/\bTBD\b|\bWIP\b/i.test(L)) push('todo',i,L.trim());
    if(/placeholder|stub(?!born)/i.test(L)) push('placeholder',i,L.trim());
    if(/throw\s+new\s+Error\(['\"]?Not\s+implemented/i.test(L)) push('not_implemented',i,L.trim());
    if(/\/\/\s*not\s+implemented/i.test(L)) push('not_implemented',i,L.trim());
  } return hits; }
function extractClaimsMd(md){ const claims=[]; const lines=md.split(/\r?\n/);
  for(let i=0;i<lines.length;i++){ const L=lines[i].trim();
    if(/^[-*]\s/.test(L)||/^\d+\.\s/.test(L)||/should|will|must|guarantees|provides/i.test(L)){ claims.push({line:i+1,text:L});}}
  return claims; }
function classify(rel){ if(/\.mdx?$/.test(rel)) return 'doc'; if(/\.(ts|tsx|js|jsx)$/.test(rel)) return 'code';
  if(/\.(yml|yaml|json)$/.test(rel)) return 'config'; if(/\.(sql)$/.test(rel)) return 'sql';
  if(/\.(py|sh|ps1)$/.test(rel)) return 'script'; return 'other'; }
function link(rel,line){ return `${rel}${line?':'+line:''}`; }
const main=async()=>{ const ig=loadIgnore(repoRoot);
  const all=await fg(CTX_INCLUDE.split(',').map(s=>s.trim()).filter(Boolean),{cwd:repoRoot,dot:true});
  const files=all.filter(f=>!ig.ignores(f)).slice(0,CTX_MAX_FILES);
  if(DRY){ console.log(JSON.stringify({total:all.length,included:files.length,sample:files.slice(0,50)},null,2)); return;}
  const results=[], claims=[]; let placeholders=0, notImplemented=0, todos=0;
  for(const rel of files){ const abs=path.join(repoRoot,rel); const txt=readTextSafe(abs); if(txt==null) continue;
    const kind=classify(rel); const sigs=basicSignals(txt);
    sigs.forEach(s=>{ if(s.type==='placeholder')placeholders++; if(s.type==='not_implemented')notImplemented++; if(s.type==='todo')todos++; });
    results.push({path:rel,kind,counts:{
      placeholder:sigs.filter(s=>s.type==='placeholder').length,
      not_implemented:sigs.filter(s=>s.type==='not_implemented').length,
      todo:sigs.filter(s=>s.type==='todo').length}, examples:sigs.slice(0,5)});
    if(kind==='doc'){ for(const c of extractClaimsMd(txt)){ claims.push({path:rel,line:c.line,text:c.text}); } }}
  ensureDir(REPORT_DIR);
  fs.writeFileSync(REPORT_JSON, JSON.stringify({scanned:files.length,placeholders,notImplemented,todos,results,claimsCount:claims.length},null,2));
  const top=[...results].sort((a,b)=> (b.counts.placeholder+b.counts.not_implemented+b.counts.todo)-(a.counts.placeholder+a.counts.not_implemented+a.counts.todo)).slice(0,30);
  const md=[]; md.push('# CONTEXT AUDIT'); md.push(`- Scanned files: **${files.length}**`); md.push(`- TODO: **${todos}**`);
  md.push(`- Placeholders: **${placeholders}**`); md.push(`- Not implemented: **${notImplemented}**\n`); md.push('## Top hotspots');
  top.forEach(h=>{ const sum=h.counts.placeholder+h.counts.not_implemented+h.counts.todo;
    md.push(`- ${h.path} — total:${sum} (todo:${h.counts.todo}, placeholders:${h.counts.placeholder}, not_impl:${h.counts.not_implemented})`);});
  md.push('\n## Examples'); top.forEach(h=>{ if(!h.examples.length)return; md.push(`### ${h.path}`); h.examples.forEach(e=>md.push(`- ${e.type} @ ${link(h.path,e.line)} — \`${e.match}\``)); });
  fs.writeFileSync(REPORT_MD, md.join('\n'));
  const cm=[]; cm.push('# CLAIMS vs CODE (naive surface)'); cm.push(`Total extracted claims: **${claims.length}**\n`);
  claims.slice(0,200).forEach(c=> cm.push(`- ${link(c.path,c.line)} — ${c.text}`)); fs.writeFileSync(CLAIMS_MD, cm.join('\n'));
  const nx=['# NEXT ACTIONS (prioritized)','1) Fix hotspots (see CONTEXT_AUDIT.md).','2) Implement stubs or remove dead code.',
            '3) Align docs claims with proof points (tests/scripts).','4) Re-run audit and commit reports.'];
  fs.writeFileSync(ACTIONS_MD, nx.join('\n'));
  console.log(JSON.stringify({ok:true,reports:[path.relative(repoRoot,REPORT_MD),path.relative(repoRoot,CLAIMS_MD),path.relative(repoRoot,ACTIONS_MD),path.relative(repoRoot,REPORT_JSON)]},null,2));
};
main().catch(e=>{ console.error(e); process.exit(1); });
'@
Set-Content run-audit.mjs $auditScript

# 6) Make it available on PATH
Write-Host "Linking globally..." -ForegroundColor Yellow
npm link

# 7) Verify installation
Write-Host "`n✅ Installation complete!" -ForegroundColor Green
Write-Host "`nVerifying installation..." -ForegroundColor Yellow
$wherePath = where.exe robinson-context 2>$null
if ($wherePath) {
    Write-Host "✅ robinson-context found at: $wherePath" -ForegroundColor Green
} else {
    Write-Host "⚠️  robinson-context not found in PATH. You may need to restart your terminal." -ForegroundColor Yellow
}

Write-Host "`n📝 Usage:" -ForegroundColor Cyan
Write-Host "  robinson-context preview   # Preview files to be scanned" -ForegroundColor White
Write-Host "  robinson-context audit     # Run full audit and write reports/" -ForegroundColor White

Write-Host "`n🎯 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Navigate to any repo" -ForegroundColor White
Write-Host "  2. Run: robinson-context preview" -ForegroundColor White
Write-Host "  3. Run: robinson-context audit" -ForegroundColor White
Write-Host "  4. Check ./reports/ for results" -ForegroundColor White

Set-Location $PSScriptRoot

