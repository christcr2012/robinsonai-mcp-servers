/*
  Portable Repo Runner + Schema & Boundaries Checks (TypeScript)
  ----------------------------------------------------------------
  Extends the earlier portable runner to include:
   - Optional SCHEMA checks (OpenAPI/GraphQL/Prisma/SQL migrations) using whatever is present
   - Import BOUNDARIES checks using a lightweight layer inference from the project brief

  Works hand-in-hand with `repo_portable_tools.ts` (capabilitiesProbe/buildProjectBrief/lightweightSymbolIndexer).

  Usage:
    npx ts-node repo_portable_runner.ts run /path/to/repo
*/

import * as path from 'path';
import { capabilitiesProbe, Capabilities, lightweightSymbolIndexer } from './repo-portable-tools.js';

export type ExecReport = {
  compiled: boolean;
  lintErrors: string[];
  typeErrors: string[];
  test: { passed: number; failed: number; details: string[]; coveragePct?: number };
  schemaErrors: string[];
  boundaryErrors: string[];
  logsTail: string[];
};

async function runCommand(cmd: string, args: string[], cwd: string, timeoutMs = 120000): Promise<{code:number|null, stdout:string, stderr:string}> {
  const { spawn } = await import('child_process');
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { cwd, shell: process.platform === 'win32' });
    let stdout = '', stderr = '';
    const to = setTimeout(() => { try { p.kill('SIGKILL'); } catch {} }, timeoutMs);
    p.stdout.on('data', d => stdout += d.toString());
    p.stderr.on('data', d => stderr += d.toString());
    p.on('close', (code) => { clearTimeout(to); resolve({ code, stdout, stderr }); });
    p.on('error', () => { clearTimeout(to); resolve({ code: null, stdout, stderr }); });
  });
}

function tail(s: string, lines = 50) {
  const arr = s.trim().split(/\r?\n/); return arr.slice(Math.max(0, arr.length - lines));
}

export async function runFormatters(root: string, caps: Capabilities) {
  const logs: string[] = [];
  if (caps.formatters.includes('prettier')) {
    const r = await runCommand('npx', ['--yes','prettier','--loglevel','warn','--write','.'], root, 180000);
    logs.push(...tail(r.stdout, 5), ...tail(r.stderr, 5));
  }
  if (caps.formatters.some((f: string) => f.startsWith('black'))) {
    const r = await runCommand('python', ['-m','black','.'], root, 180000);
    logs.push(...tail(r.stdout, 5), ...tail(r.stderr, 5));
  }
  if (caps.formatters.includes('rustfmt')) {
    const r = await runCommand('cargo', ['fmt'], root);
    logs.push(...tail(r.stdout, 5), ...tail(r.stderr, 5));
  }
  return logs;
}

export async function runLinters(root: string, caps: Capabilities) {
  const errors: string[] = [];
  if (caps.linters.includes('eslint')) {
    const r = await runCommand('npx', ['--yes','eslint','.', '--format','json'], root);
    try {
      const report = JSON.parse(r.stdout);
      for (const f of report) for (const m of (f.messages||[])) errors.push(`[eslint] ${f.filePath}:${m.line}:${m.column} ${m.ruleId||''} ${m.message}`);
    } catch { errors.push(...tail(r.stdout, 10), ...tail(r.stderr, 10)); }
  }
  if (caps.linters.includes('ruff')) {
    const r = await runCommand('ruff', ['check','--output-format','json','.'], root);
    try { const report = JSON.parse(r.stdout); for (const m of report) errors.push(`[ruff] ${m.filename}:${m.location.row}:${m.location.column} ${m.code} ${m.message}`); }
    catch { errors.push(...tail(r.stdout, 10), ...tail(r.stderr, 10)); }
  }
  if (caps.linters.includes('flake8')) {
    const r = await runCommand('flake8', ['.'], root);
    if (r.stdout.trim()) errors.push(...r.stdout.trim().split(/\r?\n/).map(s => `[flake8] ${s}`));
  }
  if (caps.linters.includes('golangci-lint')) {
    const r = await runCommand('golangci-lint', ['run','--out-format','line-number'], root);
    if (r.stdout.trim()) errors.push(...r.stdout.trim().split(/\r?\n/).map(s => `[golangci] ${s}`));
  }
  if (caps.linters.includes('clippy')) {
    const r = await runCommand('cargo', ['clippy','--message-format','short'], root);
    if (r.stdout.trim()) errors.push(...r.stdout.trim().split(/\r?\n/).map(s => `[clippy] ${s}`));
  }
  return errors;
}

export async function runTypecheckers(root: string, caps: Capabilities) {
  const errors: string[] = [];
  if (caps.typecheckers.includes('tsc')) {
    const r = await runCommand('npx', ['--yes','tsc','--noEmit','--pretty','false'], root, 240000);
    const lines = r.stdout + '\n' + r.stderr;
    lines.split(/\r?\n/).forEach(l => { if (/error TS\d+/.test(l)) errors.push(`[tsc] ${l.trim()}`); });
  }
  if (caps.typecheckers.includes('pyright')) {
    const r = await runCommand('pyright', ['--outputjson'], root, 240000);
    try {
      const out = JSON.parse(r.stdout || '{}');
      for (const d of (out.diagnostics||[])) errors.push(`[pyright] ${d.file}:${d.range.start.line}:${d.range.start.character} ${d.message}`);
    } catch { errors.push(...tail(r.stdout, 10), ...tail(r.stderr, 10)); }
  }
  if (caps.typecheckers.includes('mypy')) {
    const r = await runCommand('mypy', ['.','--hide-error-context','--no-error-summary'], root);
    if (r.stdout.trim()) errors.push(...r.stdout.trim().split(/\r?\n/).map(s => `[mypy] ${s}`));
  }
  return errors;
}

export async function runTests(root: string, caps: Capabilities) {
  let passed = 0, failed = 0; const details: string[] = []; let coveragePct: number | undefined;
  if (caps.tests.find((t: string) => t.includes('jest'))) {
    const r = await runCommand('npx', ['--yes','jest','--runInBand','--silent'], root, 300000);
    const text = r.stdout + '\n' + r.stderr;
    const m = /(?:\s|^)Tests?:\s*(\d+)\s*passed.*?(\d+)\s*failed/i.exec(text);
    if (m) { passed = parseInt(m[1],10); failed = parseInt(m[2],10); }
    details.push(...tail(text, 20));
    const cm = /All files.*?\s(\d+\.?\d*)%/i.exec(text); if (cm) coveragePct = parseFloat(cm[1]);
  }
  if (caps.tests.includes('vitest')) {
    const r = await runCommand('npx', ['--yes','vitest','run','--reporter','basic'], root, 300000);
    const text = r.stdout + '\n' + r.stderr; const m = /(\d+)\s+passed.*?(\d+)\s+failed/i.exec(text); if (m) { passed = parseInt(m[1],10); failed = parseInt(m[2],10); }
    details.push(...tail(text, 20));
  }
  if (caps.tests.includes('pytest')) {
    const r = await runCommand('pytest', ['-q'], root, 300000);
    const text = r.stdout + '\n' + r.stderr; const m = /(\d+)\s+passed.*?(\d+)\s+failed/i.exec(text); if (m) { passed = parseInt(m[1],10); failed = parseInt(m[2],10); }
    details.push(...tail(text, 20));
  }
  if (caps.tests.includes('go test')) {
    const r = await runCommand('go', ['test','./...','-count=1'], root, 300000);
    const text = r.stdout + '\n' + r.stderr; const fails = (text.match(/FAIL\s/g) || []).length; const oks = (text.match(/ok\s/g) || []).length; failed += fails; passed += oks; details.push(...tail(text, 20));
  }
  if (caps.tests.includes('cargo test')) {
    const r = await runCommand('cargo', ['test','--','-q'], root, 300000);
    const text = r.stdout + '\n' + r.stderr; const m = /(\d+)\s+passed.*?(\d+)\s+failed/i.exec(text); if (m) { passed = parseInt(m[1],10); failed = parseInt(m[2],10); }
    details.push(...tail(text, 20));
  }
  if (caps.tests.includes('junit')) {
    const r = await runCommand('bash', ['-lc','[ -f mvnw ] && ./mvnw -q -DskipITs test || mvn -q -DskipITs test || [ -f gradlew ] && ./gradlew -q test || gradle -q test'], root, 600000);
    const text = r.stdout + '\n' + r.stderr; const m = /\b(\d+)\s+tests? completed,\s*(\d+)\s+failed/i.exec(text); if (m) { passed = parseInt(m[1],10) - parseInt(m[2],10); failed = parseInt(m[2],10); }
    details.push(...tail(text, 20));
  }
  return { passed, failed, details, coveragePct } as const;
}

// -----------------------------
// SCHEMA CHECKS (best-effort; skip if tools not present)
// -----------------------------
export async function runSchemaChecks(root: string, caps: Capabilities) {
  const errors: string[] = [];
  // Prisma
  if (caps.schemas.includes('prisma')) {
    const r = await runCommand('npx', ['--yes','prisma','validate'], root, 180000);
    if (r.code !== 0) errors.push(...tail(r.stdout, 20), ...tail(r.stderr, 20));
  }
  // OpenAPI (try openapi-generator or openapi-typescript if present)
  if (caps.schemas.includes('openapi')) {
    const gen = await runCommand('npx', ['--yes','openapi-typescript','openapi.yaml','--output','/tmp/_types.d.ts'], root, 240000);
    if (gen.code !== 0) {
      // try yml/json variants silently
      const alt = await runCommand('bash', ['-lc','npx --yes openapi-typescript $(ls openapi.* | head -n1) --output /tmp/_types.d.ts'], root, 240000);
      if (alt.code !== 0) errors.push('[openapi] failed to generate types', ...tail(gen.stderr,10), ...tail(alt.stderr,10));
    }
  }
  // GraphQL (validate schema if cli available)
  if (caps.schemas.includes('graphql')) {
    const r = await runCommand('bash', ['-lc','[ -f schema.graphql ] && npx --yes graphql-cli validate-schema schema.graphql || exit 0'], root, 180000);
    if (r.code && r.code !== 0) errors.push('[graphql] schema validation failed', ...tail(r.stderr, 10));
  }
  return errors;
}

// -----------------------------
// BOUNDARIES CHECK (inferred from import graph)
// -----------------------------
export async function runBoundaryChecks(root: string) {
  const index = await lightweightSymbolIndexer(root, { maxFiles: 3000 });
  // Build edges between first-level directories (under src/ if present, else top-level)
  type Cnt = Record<string, Record<string, number>>;
  const edges: Cnt = {};
  const dirOf = (absPath: string, target: string) => {
    const rel = absPath.replace(root + path.sep, '');
    const segs = rel.split(/[\\\/]/).filter(Boolean);
    const srcIdx = segs.indexOf('src');
    const first = srcIdx >= 0 ? segs[srcIdx + 1] : segs[0];
    return first || '';
  };

  for (const im of index.imports) {
    let to = im.to;
    if (!to.startsWith('.')) continue; // external dep allowed
    const fromDir = dirOf(im.from, root);
    const abs = path.normalize(path.join(path.dirname(im.from), im.to));
    const toDir = dirOf(abs, root);
    if (!fromDir || !toDir || fromDir === toDir) continue;
    edges[fromDir] = edges[fromDir] || {};
    edges[fromDir][toDir] = (edges[fromDir][toDir] || 0) + 1;
  }

  // Infer majority direction between pairs (a,b). If current edges invert dominant flow by >3x, flag.
  const violations: string[] = [];
  const dirs = Array.from(new Set(Object.keys(edges).concat(...Object.values(edges).map(o => Object.keys(o)).flat())));
  for (const a of dirs) {
    for (const b of dirs) {
      if (a >= b) continue; // pair once
      const ab = (edges[a] && edges[a][b]) || 0;
      const ba = (edges[b] && edges[b][a]) || 0;
      if (!ab && !ba) continue;
      const dominant = ab >= ba ? 'ab' : 'ba';
      const minority = ab >= ba ? ba : ab;
      const majority = Math.max(ab, ba);
      // if minority exists and is less common by factor >=3, treat as inversion violations for that direction
      if (minority > 0 && majority >= minority * 3) {
        if (dominant === 'ab' && ba) violations.push(`Import inversion: ${b} → ${a} uncommon (ba=${ba}, ab=${ab})`);
        if (dominant === 'ba' && ab) violations.push(`Import inversion: ${a} → ${b} uncommon (ab=${ab}, ba=${ba})`);
      }
    }
  }
  return violations;
}

export async function runPortablePipeline(root: string): Promise<ExecReport> {
  const caps = await capabilitiesProbe(root);
  const logs: string[] = [];
  logs.push(...await runFormatters(root, caps));
  const lintErrors = await runLinters(root, caps);
  const typeErrors = await runTypecheckers(root, caps);
  const test = await runTests(root, caps);
  const schemaErrors = await runSchemaChecks(root, caps);
  const boundaryErrors = await runBoundaryChecks(root);
  const compiled = lintErrors.length === 0 && typeErrors.length === 0 && test.failed === 0 && schemaErrors.length === 0 && boundaryErrors.length === 0;
  return { compiled, lintErrors, typeErrors, test, schemaErrors, boundaryErrors, logsTail: logs.slice(-20) };
}

// CLI command
if (require.main === module) {
  (async () => {
    const [, , cmd, repoRoot = process.cwd()] = process.argv;
    if (cmd === 'run') {
      const report = await runPortablePipeline(path.resolve(repoRoot));
      console.log(JSON.stringify(report, null, 2));
      process.exit(report.compiled ? 0 : 1);
    } else {
      console.error('Usage: npx ts-node repo_portable_runner.ts run /path/to/repo');
      process.exit(2);
    }
  })();
}

