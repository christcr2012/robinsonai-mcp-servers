import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

export default async function testQuickScanFallback() {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'ctx-workspace-'));
  const ctxRoot = path.join(workspaceRoot, '.robinson-context');
  const repoRoot = await fs.mkdtemp(path.join(workspaceRoot, 'repo-'));

  process.env.WORKSPACE_ROOT = workspaceRoot;
  process.env.CTX_ROOT = ctxRoot;
  process.env.CTX_AUTO_WATCH = '0';

  const filePath = path.join(repoRoot, 'src', 'feature', 'important.ts');
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(
    filePath,
    [
      "export function importantThing() {",
      "  const contextNeedle = 'quick scan makes sense';",
      "  return contextNeedle;",
      "}",
    ].join('\n'),
    'utf8',
  );

  const { clearCachedContextConfig } = await import('../../dist/context/config.js');
  clearCachedContextConfig();
  const engineModule = await import('../../dist/context/engine.js');
  const engine = engineModule.ContextEngine.get(repoRoot);

  const results = await engine.quickScan('context needle', 5);

  assert.ok(Array.isArray(results) && results.length > 0, 'quickScan should return fallback hits');
  const top = results[0];
  assert.equal(top._method, 'lazy-scan');
  assert.equal(top._provider, 'lexical-fallback');
  assert.ok(top.uri.includes('important.ts'));
  assert.equal(top.meta?.fallback, true);

  await fs.rm(repoRoot, { recursive: true, force: true });
  await fs.rm(ctxRoot, { recursive: true, force: true });
  await fs.rm(workspaceRoot, { recursive: true, force: true });
}
