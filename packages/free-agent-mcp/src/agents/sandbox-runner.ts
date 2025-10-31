/*
  sandbox_runner.ts – run portable pipeline inside Docker
  ------------------------------------------------------
  Requires the Dockerfile below (builds an image named repo-sandbox:latest).

  Usage:
    npx ts-node agents/sandbox-runner.ts /abs/path/to/repo
    npx ts-node agents/sandbox-runner.ts /abs/path/to/repo --json
*/

import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const IMAGE = 'repo-sandbox:latest';

function sh(cmd: string, args: string[], cwd = process.cwd()): Promise<{ code: number|null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    const p = spawn(cmd, args, { cwd, shell: process.platform === 'win32' });
    
    if (p.stdout) p.stdout.on('data', (d) => { stdout += d.toString(); process.stdout.write(d); });
    if (p.stderr) p.stderr.on('data', (d) => { stderr += d.toString(); process.stderr.write(d); });
    
    p.on('close', (code) => resolve({ code, stdout, stderr }));
    p.on('error', (err) => { 
      console.error('Spawn error:', err);
      resolve({ code: 1, stdout, stderr }); 
    });
  });
}

async function ensureImage(contextDir: string) {
  console.log('[sandbox] Checking for Docker image...');
  const { code } = await sh('docker', ['image', 'inspect', IMAGE], process.cwd());
  
  if (code !== 0) {
    console.log('[sandbox] Building Docker image...');
    const buildResult = await sh('docker', ['build', '-t', IMAGE, contextDir], contextDir);
    if (buildResult.code !== 0) {
      throw new Error('Failed to build Docker image');
    }
    console.log('[sandbox] Docker image built successfully');
  } else {
    console.log('[sandbox] Docker image already exists');
  }
}

async function runInSandbox(repoRoot: string, jsonOutput = false) {
  const abs = path.resolve(repoRoot);
  if (!fs.existsSync(abs)) throw new Error('Repo path not found: ' + abs);

  console.log('[sandbox] Running portable pipeline in Docker...');
  console.log(`[sandbox] Repo: ${abs}`);
  console.log(`[sandbox] Network: none (hermetic)`);
  console.log(`[sandbox] Resources: 2 CPUs, 2GB RAM`);

  const dockerArgs = [
    'run', '--rm',
    '--network', 'none',                 // hermetic
    '--cpus', '2', '--memory', '2g',     // resource caps
    '--pids-limit', '512',
    '--read-only',
    '--tmpfs', '/tmp:rw,exec,nosuid,nodev',
    '-v', `${abs}:/workspace:rw`,
    IMAGE,
    'bash', '/entrypoint.sh',
    'node', '/workspace/repo_portable_runner.js', 'run', '/workspace'
  ];
  
  const { code, stdout } = await sh('docker', dockerArgs);
  
  if (jsonOutput) {
    // Try to extract JSON from stdout
    try {
      const lines = stdout.split('\n');
      const jsonLine = lines.find(l => l.trim().startsWith('{'));
      if (jsonLine) {
        const result = JSON.parse(jsonLine);
        console.log(JSON.stringify(result, null, 2));
      }
    } catch (e) {
      console.error('[sandbox] Failed to parse JSON output');
    }
  }
  
  console.log(`[sandbox] Exit code: ${code}`);
  process.exit(code ?? 1);
}

(async () => {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const repoRoot = args.find(a => !a.startsWith('--')) || process.cwd();
  
  const ctx = path.resolve(__dirname, 'docker');
  
  try {
    await ensureImage(ctx);
    await runInSandbox(repoRoot, jsonOutput);
  } catch (e) {
    console.error('[sandbox] Error:', e);
    process.exit(1);
  }
})();

