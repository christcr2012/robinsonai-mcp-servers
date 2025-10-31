#!/usr/bin/env node
// tools/robinson-orchestrator.mjs — watches .robinson/inbox for plans, runs phases, opens PRs
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const ROB = path.join(ROOT, '.robinson');
const INBOX = path.join(ROB, 'inbox');
const OUTBOX = path.join(ROB, 'outbox');
fs.mkdirSync(INBOX, { recursive: true });
fs.mkdirSync(OUTBOX, { recursive: true });

const CFG_PATH = path.join(ROB, 'config.json');
if (!fs.existsSync(CFG_PATH)) { console.error('Missing .robinson/config.json'); process.exit(1); }
const CFG = JSON.parse(fs.readFileSync(CFG_PATH,'utf8'));

function sh(cmd){
  console.log('$', cmd);
  const r = spawnSync(cmd, { shell:true, cwd:ROOT, stdio:'inherit' });
  if (r.status !== 0) throw new Error('Command failed: '+cmd);
}
function write(p, s){ fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p, s, 'utf8'); }
function intl(p){ return p.replace(ROOT + path.sep, ''); }

function applyPhase(phaseSpec, strict){
  try { sh('node tools/gen-symbol-map.mjs'); } catch {}
  const one = { intent: phaseSpec.name || 'phase', file_ops: phaseSpec.file_ops || [], post_steps: [] };
  if (CFG.build) one.post_steps.push({cmd: CFG.build});
  if (strict && CFG.test) one.post_steps.push({cmd: CFG.test});

  const tmp = path.join(ROB, `tmp-${(phaseSpec.name||'phase')}-${Date.now()}.json`);
  write(tmp, JSON.stringify(one, null, 2));
  sh(`node tools/phase-run.mjs "${tmp}"`);

  const out = spawnSync('node', ['tools/placeholder-audit.mjs'], { cwd: ROOT, shell:false, stdio:'pipe' });
  const txt = out.stdout ? out.stdout.toString() : '';
  console.log((txt||'').trim());
  const m = /FOUND:\s+(\d+)/.exec(txt) || [0,'0'];
  const hits = parseInt(m[1],10);
  if (strict && hits > 0) throw new Error('Placeholders remain after strict phase');
}

function gitReady(){
  try { sh(`git config user.name "${CFG.gitUserName || 'Robinson Bot'}"`); } catch {}
  try { sh(`git config user.email "${CFG.gitUserEmail || 'bot@example.com'}"`); } catch {}
}

function commitPushOpenPR(branch, title, body){
  sh('git add -A');
  // allow empty commit
  spawnSync('git', ['commit','-m', title], { cwd: ROOT, stdio:'inherit' });
  sh(`git push -u origin ${branch}`);
  if (CFG.openPR && CFG.repo){
    try { sh(`gh pr create --repo ${CFG.repo} --base ${CFG.baseBranch || 'main'} --head ${branch} --title "${title}" --body "${body}"`); }
    catch { console.warn('Could not open PR via gh CLI; open manually if needed.'); }
  }
}

function processPlan(planPath){
  const id = path.basename(planPath).replace(/\.json$/, '');
  const statusFile = path.join(OUTBOX, `${id}.status.json`);
  const plan = JSON.parse(fs.readFileSync(planPath,'utf8'));

  const branch = `${CFG.branchPrefix || 'feat/auto-'}${id}`;
  try {
    write(statusFile, JSON.stringify({ state:'starting', plan_file:intl(planPath) }, null, 2));
    gitReady();
    sh(`git fetch origin ${CFG.baseBranch || 'main'} --depth=1`);
    sh(`git checkout -B ${branch} origin/${CFG.baseBranch || 'main'}`);

    const p1 = (plan.phases && plan.phases[0]) || plan.phase1 || null;
    if (p1) applyPhase(p1, false);

    const p2 = (plan.phases && plan.phases[1]) || plan.phase2 || null;
    if (p2) applyPhase(p2, true);

    const title = plan.intent || `Auto change ${id}`;
    commitPushOpenPR(branch, title, 'Automated by Robinson Orchestrator');
    write(statusFile, JSON.stringify({ state:'done', branch }, null, 2));
    fs.renameSync(planPath, path.join(OUTBOX, path.basename(planPath)));
  } catch (e) {
    console.error('❌ ERROR:', e.message);
    write(statusFile, JSON.stringify({ state:'error', error: e.message }, null, 2));
  }
}

console.log('Robinson Orchestrator watching:', intl(INBOX));
const seen = new Set();
setInterval(() => {
  const files = fs.readdirSync(INBOX).filter(f => f.endsWith('.json'));
  for (const f of files){
    const p = path.join(INBOX, f);
    if (seen.has(p)) continue;
    seen.add(p);
    console.log('\n== New plan ==', intl(p));
    processPlan(p);
  }
}, 2500);
