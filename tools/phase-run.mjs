#!/usr/bin/env node
// tools/phase-run.mjs — apply a single-phase plan {file_ops[], post_steps[]}
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const planPath = process.argv[2] || '';
if (!planPath) { console.error('Usage: node tools/phase-run.mjs <phase.json>'); process.exit(1); }

const root = process.cwd();
function readJSON(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }
function mkdirp(p){ fs.mkdirSync(p,{recursive:true}); }
function writeFileAbs(abs, s){ mkdirp(path.dirname(abs)); fs.writeFileSync(abs, s, 'utf8'); console.log('WROTE', abs); }
function run(cmd){ console.log('$', cmd); execSync(cmd,{cwd:root,stdio:'inherit'}); }

const phase = readJSON(planPath);
if (!phase || !Array.isArray(phase.file_ops)) throw new Error('phase.file_ops must be an array');

for (const op of phase.file_ops){
  const abs = path.join(root, op.path);
  if (op.kind === 'write' || op.kind === 'replace'){ writeFileAbs(abs, op.content || ''); }
  else if (op.kind === 'delete'){ if (fs.existsSync(abs)) { fs.rmSync(abs,{recursive:true,force:true}); console.log('DELETED', abs); } }
  else if (op.kind === 'patch'){ throw new Error('patch not implemented in phase-run'); }
  else { throw new Error('Unknown file op kind: '+op.kind); }
}

if (Array.isArray(phase.post_steps)){
  for (const step of phase.post_steps){ run(step.cmd); }
}
console.log('PHASE DONE');
