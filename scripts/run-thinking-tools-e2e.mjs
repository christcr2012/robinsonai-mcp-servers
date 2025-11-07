#!/usr/bin/env node
// E2E harness for thinking-tools-mcp (NO deps, ESM)
import fs from 'fs';
import { spawn } from 'child_process';

const REPO_ROOT = process.cwd();
const SERVER_PATH = 'packages/thinking-tools-mcp/dist/index.js';
const REPORT_DIR = 'reports';
const REPORT_PATH = `${REPORT_DIR}/thinking-tools-e2e-report.json`;
const FIXTURE_DIR = 'scripts/fixtures';
const CTX7_FILE = `${FIXTURE_DIR}/context7-import.json`;

const SKIP_NETWORK = process.env.SKIP_NETWORK !== '0';
const ALLOW_CLI = process.env.ALLOW_CLI === '1';
const CALL_TIMEOUT_MS = +(process.env.TIMEOUT_MS || 60000);
const GLOBAL_TIMEOUT_MS = 10 * 60 * 1000;

const CRITICAL = new Set([
  'context_index_repo',
  'context_query',
  'ctx_import_evidence',
  'decision_matrix',
]);

function ensureDirs() {
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
  if (!fs.existsSync(FIXTURE_DIR)) fs.mkdirSync(FIXTURE_DIR, { recursive: true });
  if (!fs.existsSync(CTX7_FILE)) {
    const sample = {
      items: [
        {
          source: 'context7',
          title: 'Sample External Evidence',
          snippet: 'This is imported via Context7 file adapter for testing.',
          uri: 'file://local/evidence/1',
          score: 0.9,
          tags: ['test','external'],
          raw: { id: 'ext-1', kind: 'note' }
        }
      ],
      group: 'e2e',
    };
    fs.writeFileSync(CTX7_FILE, JSON.stringify(sample, null, 2));
  }
}

function startServer() {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [SERVER_PATH], {
      env: { ...process.env, WORKSPACE_ROOT: REPO_ROOT },
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: REPO_ROOT,
    });

    let ready = false;
    const onData = (buf) => {
      const s = buf.toString();
      if (s.includes('Server connected and ready')) {
        ready = true;
        resolve(child);
      }
    };
    child.stderr.on('data', onData);
    child.stdout.on('data', onData);
    child.on('error', reject);

    // Fallback resolve after 2s
    setTimeout(() => { if (!ready) resolve(child); }, 2000);
  });
}

let seq = 0;
function rpc(child, method, params) {
  return new Promise((resolve, reject) => {
    const id = ++seq;
    const payload = { jsonrpc: '2.0', id, method, params };
    const line = JSON.stringify(payload) + '\n';

    let timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout ${method}`));
    }, CALL_TIMEOUT_MS);

    const onData = (buf) => {
      const s = buf.toString();
      for (const line of s.split(/\r?\n/)) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.id === id) {
            clearTimeout(timeout);
            cleanup();
            return resolve(msg.result);
          }
        } catch {}
      }
    };

    const cleanup = () => {
      child.stdout.off('data', onData);
      child.stderr.off('data', onData);
    };

    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.stdin.write(line);
  });
}

function excerpt(s, n = 400) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function now() { return Date.now(); }

function parseResult(result) {
  // Server returns { content: [{ type:'text', text: JSON }] }
  if (!result?.content?.length) return { text: '', obj: null };
  const text = result.content[0]?.text || '';
  try { return { text, obj: JSON.parse(text) }; } catch { return { text, obj: null }; }
}

function scoreCognitive(name, obj, text) {
  let score = 0; const notes = [];
  const len = (text || '').length;
  if (obj && typeof obj === 'object') {
    const hasKeys = (keys) => keys.every(k => obj && (k in obj));
    switch (name) {
      case 'swot_analysis':
        if (hasKeys(['strengths','weaknesses','opportunities','threats'])) {
          const cnt = ['strengths','weaknesses','opportunities','threats'].reduce((a,k)=>a+((obj[k]?.length)||0),0);
          score = Math.min(100, 40 + cnt * 10); notes.push(`SWOT items=${cnt}`);
        }
        break;
      case 'decision_matrix':
        if (hasKeys(['matrix','recommendation'])) {
          const rows = Array.isArray(obj.matrix) ? obj.matrix.length : 0;
          score = Math.min(100, 40 + rows * 10); notes.push(`rows=${rows}`);
        }
        break;
      case 'premortem_analysis':
        if (obj.failure_modes || obj.risks) { score = 70; notes.push('has risks'); }
        break;
      case 'devils_advocate':
        if (obj.counter_arguments || obj.counterArguments) { score = 70; notes.push('has counters'); }
        break;
      default:
        // Generic object scoring
        const keys = Object.keys(obj);
        score = Math.min(100, 30 + keys.length * 5);
        notes.push(`keys=${keys.length}`);
    }
  }
  if (score === 0) {
    let bullets = 0; (text.match(/\n\s*[-•\d+\.]/g) || []).forEach(()=>bullets++);
    score = Math.min(100, 20 + Math.floor(len/50) + bullets * 10);
    notes.push(`len=${len}, bullets=${bullets}`);
  }
  return { score, notes: notes.join('; ') };
}

function scoreContext(name, obj) {
  let score = 0; const notes = [];
  if (!obj) return { score: 0, notes: 'no object' };
  if (name === 'context_query') {
    const n = Array.isArray(obj.results) ? obj.results.length : (obj.length||0);
    score = Math.min(100, 40 + n * 10);
    notes.push(`results=${n}`);
  } else if (name === 'context_stats') {
    const keys = Object.keys(obj);
    score = Math.min(100, 30 + keys.length * 5);
    notes.push(`keys=${keys.length}`);
  } else {
    score = 60; notes.push('generic context score');
  }
  return { score, notes: notes.join('; ') };
}

async function main() {
  ensureDirs();
  const child = await startServer();
  const report = { startedAt: new Date().toISOString(), tools: {} };

  const t0 = now();
  // Send initialize without waiting (server sometimes delays reply)
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'e2e-harness', version: '1.0' } } }) + '\n');
  // Small delay before listing tools
  await new Promise(r => setTimeout(r, 500));
  const list = await rpc(child, 'tools/list', {});
  const tools = list.tools || [];

  const nameSet = new Set(tools.map(t => t.name));
  const maybeSkip = (n) => {
    if (SKIP_NETWORK && /web|fetch|crawl/.test(n)) return true;
    if (!ALLOW_CLI && /context_preview|context_audit/.test(n)) return true;
    return false;
  };

  // Curated calls in order
  const planned = [
    ['context_index_repo', { force: true }],
    ['ensure_fresh_index', { force: true }],
    ['context_index_full', {}],
    ['context_stats', {}],
    ['context_query', { query: 'TODO', top_k: 5 }],
    ['context7_adapter', { from: 'file', file: CTX7_FILE, group: 'e2e' }],
    ['ctx_import_evidence', { group: 'e2e', items: JSON.parse(fs.readFileSync(CTX7_FILE,'utf8')).items }],
    ['ctx_merge_config', { mode: 'blend' }],

    ['devils_advocate', { claim: 'Fixing 482 missing handlers in a week is feasible' }],
    ['swot_analysis', { subject: 'Plan to fix missing handlers', perspective: 'technical' }],
    ['premortem_analysis', { project: 'Fix handlers project', horizon_days: 30 }],
    ['decision_matrix', { options:['Parallelize with FREE agent','Escalate to PAID agent','Hybrid approach'], criteria:['Speed','Quality','Cost'], weights:[0.4,0.4,0.2] }],
    ['critical_thinking', { argument: "Robinson's Toolkit should prioritize OpenAI handlers first" }],
    ['lateral_thinking', { problem: 'Reduce cost while increasing quality' }],
    ['red_team', { plan: 'Implement all handlers quickly', focus: 'all' }],
    ['blue_team', { plan: 'Implement all handlers quickly' }],
    ['socratic_questioning', { topic: 'Handler implementation strategy' }],
    ['systems_thinking', { system: 'MCP servers orchestration' }],
    ['scenario_planning', { situation: 'Tight budget and deadlines', timeframe: '4 weeks' }],
    ['brainstorming', { prompt: 'Ways to improve handler quality', quantity: 8 }],
    ['mind_mapping', { topic: 'Handler implementation phases' }],
    ['sequential_thinking', { problem: 'Deliver complete handlers' }],
    ['parallel_thinking', { problem: 'Deliver complete handlers' }],
    ['reflective_thinking', { reasoning: 'Previous attempts caused regressions' }],
  ];

  for (const [name, args] of planned) {
    if (!nameSet.has(name)) {
      report.tools[name] = { status: 'skipped', error: 'not registered' };
      continue;
    }
    if (maybeSkip(name)) {
      report.tools[name] = { status: 'skipped', error: 'skipped by policy' };
      continue;
    }
    const start = now();
    try {
      const raw = await rpc(child, 'tools/call', { name, arguments: args });
      const { text, obj } = parseResult(raw);
      let qualityScore = 0, notes = '';
      if (/^context_/.test(name) || /^ctx_/.test(name) || /context7/.test(name)) {
        ({ score: qualityScore, notes } = scoreContext(name, obj));
      } else {
        ({ score: qualityScore, notes } = scoreCognitive(name, obj, text));
      }
      report.tools[name] = {
        status: 'ok',
        latencyMs: now() - start,
        qualityScore,
        notes,
        sampleExcerpt: excerpt((obj ? JSON.stringify(obj) : (raw?.content?.[0]?.text || '')), 400)
      };
    } catch (e) {
      report.tools[name] = {
        status: 'fail',
        latencyMs: now() - start,
        error: String(e.message || e)
      };
    }
  }

  report.durationMs = now() - t0;
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  // Console summary
  const entries = Object.entries(report.tools);
  const lines = entries.map(([n, r]) => `${n.padEnd(24)}  ${(r.status||'').padEnd(7)}  ${(r.latencyMs||'-')}`);
  console.log('\nThinking Tools E2E Summary');
  console.log('='.repeat(32));
  for (const line of lines) console.log(line);
  console.log(`\nReport written: ${REPORT_PATH}`);

  // Exit code
  let criticalFail = false;
  for (const n of CRITICAL) {
    const r = report.tools[n];
    if (!r || r.status !== 'ok') { criticalFail = true; break; }
  }
  if (criticalFail) process.exit(2);
}

// Global timeout
setTimeout(() => { console.error('Global timeout exceeded'); process.exit(3); }, GLOBAL_TIMEOUT_MS);

main().catch(e => { console.error('HARNESS ERROR', e); process.exit(1); });

