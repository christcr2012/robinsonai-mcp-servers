/**
 * Custom adapter for Robinson's Toolkit MCP
 * Uses CodeGenerator with quality gates instead of raw Ollama calls
 */

import { Adapter } from '@fa/core/repo/types.js';
import { PatternContract } from '@fa/core/patterns/contract.js';
import { Example } from '@fa/core/patterns/examples.js';
import { CodeGenerator } from '../agents/code-generator.js';
import { OllamaClient } from '../ollama-client.js';
import { spawnSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export function createRobinsonsToolkitAdapter(): Adapter {
  const ollama = new OllamaClient();
  const codeGen = new CodeGenerator(ollama);

  return {
    name: 'robinsons-toolkit',
    cmd: {
      install: 'pnpm install',
      build: 'pnpm build',
      test: 'pnpm test',
      lint: 'pnpm lint',
    },
    specRegistry: 'packages/robinsons-toolkit-mcp/spec/tools.registry.json',
    codegenOutDir: 'packages/robinsons-toolkit-mcp/src/generated',

    async prepare(repo) {
      console.log('[RTAdapter] Installing dependencies...');
      spawn(repo, 'pnpm install');
    },

    async run(repo, cmd) {
      return spawn(repo, cmd);
    },

    async synthesize({ repo, task, contract, exemplars }) {
      console.log('[RTAdapter] Synthesizing with CodeGenerator + quality gates...');

      // Build context from contract and exemplars
      const context = buildContext(repo, contract, exemplars);

      // Use CodeGenerator with quality gates (not raw Ollama)
      const result = await codeGen.generate({
        task,
        context,
        quality: 'balanced', // Use quality gates
        complexity: 'medium',
      });

      // Extract diff from result
      const diff = result.diff || result.code;
      return { diff };
    },

    async refine({ repo, task, diagnostics, lastDiff, contract, exemplars }) {
      console.log('[RTAdapter] Refining with diagnostics...');

      const context = buildContext(repo, contract, exemplars);
      const diag = JSON.stringify(diagnostics, null, 2);

      const result = await codeGen.generate({
        task: task + '\n\nFix these issues:\n' + diag,
        context,
        quality: 'best', // Use best quality for refinement
        complexity: 'medium',
      });

      const diff = result.diff || result.code;
      return { diff };
    },

    async applyPatch(repo, diff, contract) {
      // TODO: Validate and apply patch
      console.log('[RTAdapter] Applying patch...');
    },
  };
}

function buildContext(
  repo: string,
  contract?: PatternContract,
  exemplars?: Example[]
): string {
  const parts: string[] = [];

  // Add pattern contract
  if (contract) {
    parts.push('=== PATTERN CONTRACT ===');
    parts.push(`Language: ${contract.language}`);
    parts.push(`Containers (where code goes):`);
    contract.containers.forEach(c => {
      parts.push(`  - ${c.name} (${c.kind}) in ${c.file}`);
    });
    parts.push(`Wrappers (helper functions to use):`);
    contract.wrappers.forEach(w => {
      parts.push(`  - ${w.name}() from ${w.importFrom}`);
    });
  }

  // Add exemplars
  if (exemplars && exemplars.length > 0) {
    parts.push('\n=== CODE EXEMPLARS ===');
    exemplars.forEach((ex, i) => {
      parts.push(`\n--- Example ${i + 1}: ${ex.path} ---`);
      parts.push(ex.content.slice(0, 1000));
    });
  }

  // Add package.json
  const pkgPath = join(repo, 'package.json');
  if (existsSync(pkgPath)) {
    parts.push('\n=== package.json ===');
    parts.push(readFileSync(pkgPath, 'utf8'));
  }

  return parts.join('\n');
}

function spawn(cwd: string, sh: string): { code: number; out: string } {
  const p = spawnSync(sh, { cwd, shell: true, encoding: 'utf8' });
  return {
    code: p.status ?? 1,
    out: (p.stdout || '') + (p.stderr || ''),
  };
}

