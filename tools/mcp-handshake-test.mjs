import { spawn } from 'node:child_process';

// Usage: node tools/mcp-handshake-test.mjs "<command string>" [label]
const cmd = process.argv[2];
const label = process.argv[3] || 'server';
if (!cmd) {
  console.error('Usage: node tools/mcp-handshake-test.mjs "<command string>" [label]');
  process.exit(2);
}

console.log(`Spawning (${label}): ${cmd}`);
const child = spawn(cmd, { shell: true, stdio: ['pipe', 'pipe', 'pipe'] });

let stdout = '';
let stderr = '';
child.stdout.on('data', (d) => {
  stdout += d.toString();
  process.stdout.write(d);
});
child.stderr.on('data', (d) => {
  stderr += d.toString();
  process.stderr.write(d);
});

function send(obj) {
  const line = JSON.stringify(obj) + '\n';
  child.stdin.write(line);
}

const initMsg = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    capabilities: { tools: {} },
    clientInfo: { name: 'handshake-test', version: '0.0.1' },
    protocolVersion: '2024-11-05'
  }
};

const listMsg = { jsonrpc: '2.0', id: 2, method: 'tools/list' };

const timeoutMs = 8000;
let stage = 'start';

const timer = setTimeout(() => {
  console.error(`\n[HANDSHAKE-TEST] TIMEOUT at stage=${stage}`);
  child.kill('SIGTERM');
}, timeoutMs);

child.on('spawn', () => {
  stage = 'initialize';
  send(initMsg);
  setTimeout(() => {
    stage = 'tools/list';
    send(listMsg);
  }, 400);
});

child.on('exit', (code) => {
  clearTimeout(timer);
  console.log(`\n[HANDSHAKE-TEST] exited with code ${code}`);
});
