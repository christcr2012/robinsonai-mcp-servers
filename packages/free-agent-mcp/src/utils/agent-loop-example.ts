/*
  agent_loop_example.ts – End-to-end example loop
  ------------------------------------------------
  Synthesize N candidates → run pipeline → judge → select winner → fix (iterate) → accept.
  Plug your own model calls in `callModel()`.

  Requires files in this canvas:
    - repo-portable-tools.ts (buildProjectBrief)
    - repo-portable-runner.ts (runPortablePipeline)
    - convention-score-patch.ts (applyPatch, evaluateCandidates)
    - judge-fixer-prompts.ts (prompts + validators)

  Usage:
    npx ts-node agent_loop_example.ts /path/to/repo "Implement add(a,b)" 4 4
    #               root         spec                     N  maxIters
*/

import * as fs from 'fs';
import * as path from 'path';
import { buildProjectBrief } from './repo-portable-tools.js';
import { runPortablePipeline } from './repo-portable-runner.js';
import { evaluateCandidates, applyPatch, diffSizeGuard, GeneratedCandidate } from './convention-score-patch.js';
import { JUDGE_PROMPT, FIXER_PROMPT, makeJudgeInput, validateJudgeVerdict, validateFixerPatch } from './judge-fixer-prompts.js';

// -----------------------------
// Placeholder model caller – swap in your providers
// -----------------------------
async function callModel(opts: { system: string; input: any; model?: string }): Promise<any> {
  // TODO: replace with your SDKs (OpenAI/Anthropic/Ollama). This is a stub.
  throw new Error('callModel() not implemented. Wire this to your providers.');
}

// Example: write candidate files/tests into repo
async function writeCandidate(root: string, cand: GeneratedCandidate) {
  for (const f of (cand.files || [])) {
    const abs = path.resolve(root, f.path);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, f.content, 'utf8');
  }
  for (const t of (cand.tests || [])) {
    const abs = path.resolve(root, t.path);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, t.content, 'utf8');
  }
}

async function runOne(root: string, cand: GeneratedCandidate) {
  await writeCandidate(root, cand);
  return await runPortablePipeline(root);
}

async function main() {
  const [, , repoRoot = process.cwd(), spec = 'Hello', nStr = '3', maxIterStr = '4'] = process.argv;
  const N = parseInt(nStr, 10) || 3;
  const MAX_ITERS = parseInt(maxIterStr, 10) || 4;
  const root = path.resolve(repoRoot);

  console.log('[agent] Building project brief...');
  const brief = await buildProjectBrief(root);
  console.log(`[agent] Detected: ${brief.capabilities.langs.join(', ')}`);
  console.log(`[agent] Naming: var=${brief.naming.var}, type=${brief.naming.type}, const=${brief.naming.const}`);

  // 1) Synthesize N candidates (you must implement this with your models)
  console.log(`[agent] Synthesizing ${N} candidates...`);
  // TODO: Replace this with your actual model call
  // Example: const candidates = await Promise.all(Array(N).fill(0).map(() => synthesize(spec, brief)));
  const candidates: GeneratedCandidate[] = [];
  if (candidates.length === 0) {
    throw new Error('Generate N candidates with your coder model - see TODO above');
  }

  // 2) Evaluate & select winner
  console.log('[agent] Evaluating candidates...');
  const evald = await evaluateCandidates(root, candidates, runOne);
  console.log(`[agent] Winner: Candidate ${evald.winnerIndex + 1} (score: ${evald.score.total.toFixed(3)})`);

  let current: GeneratedCandidate = candidates[evald.winnerIndex];

  // 3) Judge winner
  console.log('[agent] Judging winner...');
  let exec = await runPortablePipeline(root);
  let judgeIn = makeJudgeInput({ spec, brief, exec, modelNotes: current.notes || '' });
  let judge = await callModel({ system: JUDGE_PROMPT, input: judgeIn });
  if (!validateJudgeVerdict(judge).ok) throw new Error('Judge output invalid');

  console.log(`[agent] Initial verdict: ${judge.verdict}`);

  let iter = 0;
  while (iter++ < MAX_ITERS && judge.verdict !== 'accept') {
    console.log(`[agent] Iteration ${iter}/${MAX_ITERS}: Applying fixes...`);

    // 4) Fixer
    const fixer = await callModel({
      system: FIXER_PROMPT,
      input: { spec, brief, diagnostics: exec, fix_plan: judge.fix_plan }
    });

    const v = validateFixerPatch(fixer);
    if (!v.ok) throw new Error('Fixer output invalid: ' + (v.errors||[]).join(','));

    const guard = diffSizeGuard(fixer);
    if (!guard.ok) throw new Error('Patch too large: ' + guard.reason);

    // 5) Apply patch and re-run
    applyPatch(root, fixer);
    exec = await runPortablePipeline(root);

    // 6) Re-judge
    judgeIn = makeJudgeInput({ spec, brief, exec, modelNotes: current.notes || '' });
    judge = await callModel({ system: JUDGE_PROMPT, input: judgeIn });
    if (!validateJudgeVerdict(judge).ok) throw new Error('Judge output invalid');

    console.log(`[agent] Iteration ${iter} verdict: ${judge.verdict}`);
  }

  console.log('[agent] Final verdict:', judge.verdict);
  console.log('[agent] Final scores:', judge.scores);
  
  process.exit(judge.verdict === 'accept' ? 0 : 1);
}

main().catch(e => { 
  console.error('[agent] error:', e?.message || e); 
  process.exit(1); 
});

