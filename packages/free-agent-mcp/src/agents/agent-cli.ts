#!/usr/bin/env node
/*
  agent-cli.ts – Orchestration-light CLI for Builder agent
  --------------------------------------------------------
  Thin wrapper that reads Design Cards and executes the Builder agent
  with hard quality gates.

  Usage:
    agent run --task <slug>                    # Run task from .agent/tasks/<slug>.yaml
    agent run --task <path>                    # Run task from specific file
    agent fix --task <slug>                    # Re-run fix step only
    agent run --task <slug> --dry-run          # Preview without writing
    agent run --task <slug> --contracts-first  # Require schema changes first
    agent run --task <slug> --explain          # Include rationale in artifacts

  Environment:
    OPENAI_API_KEY, ANTHROPIC_API_KEY, OLLAMA_HOST
*/

import * as path from 'path';
import * as fs from 'fs';
import { parseDesignCard, findDesignCard, designCardToTaskSpec } from './design-card.js';
import { buildProjectBrief } from '../utils/repo-portable-tools.js';
import { runPortablePipeline } from '../utils/repo-portable-runner.js';
import { applyPatch, evaluateCandidates } from '../utils/convention-score-patch.js';
import { makeJudgeInput, validateJudgeVerdict, validateFixerPatch, JUDGE_PROMPT, FIXER_PROMPT } from '../utils/judge-fixer-prompts.js';
import type { GeneratedCandidate, ExecReport, Patch } from '../utils/convention-score-patch.js';
import type { JudgeVerdict } from '../utils/judge-fixer-prompts.js';

// Model adapter (user must wire this)
async function callModel(opts: { system: string; input: any; model?: string }): Promise<any> {
  // TODO: Wire to your model provider (OpenAI, Anthropic, Ollama)
  // Example:
  // const { OpenAIAdapter } = require('./model-adapters');
  // const adapter = new OpenAIAdapter();
  // return await adapter.generateJSON(opts);
  
  throw new Error('callModel() not implemented. Wire this to your model provider (see model-adapters.ts)');
}

type RunOptions = {
  task: string;
  budget?: number;
  dryRun?: boolean;
  contractsFirst?: boolean;
  explain?: boolean;
  models?: string[];
};

async function runTask(root: string, opts: RunOptions) {
  console.log('[agent] Starting Builder agent...');
  console.log(`[agent] Root: ${root}`);
  console.log(`[agent] Task: ${opts.task}`);
  
  // 1. Load Design Card
  console.log('[agent] Loading Design Card...');
  const cardPath = opts.task.includes('/') ? opts.task : findDesignCard(opts.task, root);
  const card = parseDesignCard(cardPath);
  console.log(`[agent] Loaded: ${card.name}`);
  
  // 2. Build Project Brief
  console.log('[agent] Building project brief...');
  const brief = await buildProjectBrief(root);
  console.log(`[agent] Detected: ${brief.capabilities.langs.join(', ')}`);
  console.log(`[agent] Naming: var=${brief.naming.var}, type=${brief.naming.type}, const=${brief.naming.const}`);
  
  // 3. Convert Design Card to task spec
  const spec = designCardToTaskSpec(card, brief);
  
  if (opts.dryRun) {
    console.log('\n[agent] DRY RUN - Task Specification:');
    console.log('─'.repeat(80));
    console.log(spec);
    console.log('─'.repeat(80));
    console.log('\n[agent] Dry run complete - no code generated');
    return;
  }
  
  // 4. Generate candidates (TODO: implement N candidates)
  console.log('[agent] Generating candidate...');
  const candidate: GeneratedCandidate = await callModel({
    system: 'You are a code generator. Generate working code based on the specification.',
    input: { spec, brief }
  });
  
  // 5. Write to sandbox
  const sandboxDir = path.join(root, '.agent', 'sandbox', path.basename(cardPath, path.extname(cardPath)));
  fs.mkdirSync(sandboxDir, { recursive: true });
  
  for (const file of candidate.files || []) {
    const filePath = path.join(sandboxDir, file.path);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, file.content, 'utf-8');
  }
  
  for (const test of candidate.tests || []) {
    const testPath = path.join(sandboxDir, test.path);
    fs.mkdirSync(path.dirname(testPath), { recursive: true });
    fs.writeFileSync(testPath, test.content, 'utf-8');
  }
  
  // 6. Run quality gates
  console.log('[agent] Running quality gates...');
  let exec = await runPortablePipeline(sandboxDir);
  
  // 7. Judge
  console.log('[agent] Judging candidate...');
  const judgeInput = makeJudgeInput({ spec, brief, exec, modelNotes: candidate.notes });
  let judgeRaw = await callModel({ system: JUDGE_PROMPT, input: judgeInput });
  let judge = validateJudgeVerdict(judgeRaw);
  
  if (!judge.ok) {
    throw new Error(`Invalid judge verdict:\n${judge.errors?.join('\n')}`);
  }
  
  const verdict = judgeRaw as JudgeVerdict;
  console.log(`[agent] Verdict: ${verdict.verdict}`);
  
  // 8. Fix loop
  const maxIterations = opts.budget || 4;
  let iteration = 0;
  
  while (verdict.verdict === 'revise' && iteration < maxIterations) {
    iteration++;
    console.log(`[agent] Iteration ${iteration}/${maxIterations}: Applying fixes...`);
    
    // Generate patch
    const fixerInput = { spec, brief, diagnostics: exec, fix_plan: verdict.fix_plan };
    const patchRaw = await callModel({ system: FIXER_PROMPT, input: fixerInput });
    const patchValidation = validateFixerPatch(patchRaw);
    
    if (!patchValidation.ok) {
      throw new Error(`Invalid fixer patch:\n${patchValidation.errors?.join('\n')}`);
    }
    
    const patch = patchRaw as Patch;
    
    // Apply patch
    applyPatch(sandboxDir, patch);
    
    // Re-run quality gates
    exec = await runPortablePipeline(sandboxDir);
    
    // Re-judge
    const newJudgeInput = makeJudgeInput({ spec, brief, exec, modelNotes: `Iteration ${iteration}` });
    judgeRaw = await callModel({ system: JUDGE_PROMPT, input: newJudgeInput });
    judge = validateJudgeVerdict(judgeRaw);
    
    if (!judge.ok) {
      throw new Error(`Invalid judge verdict:\n${judge.errors?.join('\n')}`);
    }
    
    const newVerdict = judgeRaw as JudgeVerdict;
    console.log(`[agent] Iteration ${iteration} verdict: ${newVerdict.verdict}`);
    
    if (newVerdict.verdict === 'accept') {
      break;
    }
  }
  
  // 9. Write artifacts
  const artifactsDir = path.join(root, 'artifacts', path.basename(cardPath, path.extname(cardPath)));
  fs.mkdirSync(artifactsDir, { recursive: true });
  
  const report = {
    name: card.name,
    verdict: verdict.verdict,
    iterations: iteration,
    compiled: exec.compiled,
    lintErrors: exec.lintErrors,
    typeErrors: exec.typeErrors,
    test: exec.test,
    schemaErrors: exec.schemaErrors,
    boundaryErrors: exec.boundaryErrors,
    scores: verdict.scores,
    summary: verdict.explanations.minimal_fix
  };
  
  fs.writeFileSync(
    path.join(artifactsDir, 'report.json'),
    JSON.stringify(report, null, 2),
    'utf-8'
  );
  
  console.log(`[agent] Artifacts written to: ${artifactsDir}`);
  console.log(`[agent] Final verdict: ${verdict.verdict}`);
  
  if (verdict.verdict !== 'accept') {
    console.error('[agent] Failed to meet acceptance criteria');
    process.exit(1);
  }
  
  console.log('[agent] Success! ✅');
}

async function fixTask(root: string, opts: RunOptions) {
  console.log('[agent] Re-running fix step...');
  // TODO: Load last diagnostics and re-run fixer
  throw new Error('fix command not yet implemented');
}

// CLI entry point
(async () => {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage:
  agent run --task <slug>                    # Run task from .agent/tasks/<slug>.yaml
  agent run --task <path>                    # Run task from specific file
  agent fix --task <slug>                    # Re-run fix step only
  agent run --task <slug> --dry-run          # Preview without writing
  agent run --task <slug> --contracts-first  # Require schema changes first
  agent run --task <slug> --explain          # Include rationale in artifacts
  agent run --task <slug> --budget 4         # Max fix iterations (default: 4)

Environment:
  OPENAI_API_KEY, ANTHROPIC_API_KEY, OLLAMA_HOST
    `);
    process.exit(0);
  }
  
  const command = args[0];
  const taskIndex = args.indexOf('--task');
  
  if (taskIndex === -1 || !args[taskIndex + 1]) {
    console.error('Error: --task <slug> required');
    process.exit(1);
  }
  
  const opts: RunOptions = {
    task: args[taskIndex + 1],
    budget: args.includes('--budget') ? parseInt(args[args.indexOf('--budget') + 1], 10) : 4,
    dryRun: args.includes('--dry-run'),
    contractsFirst: args.includes('--contracts-first'),
    explain: args.includes('--explain'),
  };
  
  const root = process.cwd();
  
  try {
    if (command === 'run') {
      await runTask(root, opts);
    } else if (command === 'fix') {
      await fixTask(root, opts);
    } else {
      console.error(`Unknown command: ${command}`);
      process.exit(1);
    }
  } catch (e) {
    console.error('[agent] Error:', e);
    process.exit(1);
  }
})();

