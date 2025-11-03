import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const p = spawn(process.execPath, [join(rootDir, 'bin/thinking-tools-mcp.js')], {
  cwd: rootDir,
  stdio: ['pipe','pipe','pipe']
});

const req = (id, method, params={}) =>
  JSON.stringify({ jsonrpc:'2.0', id, method, params });

let got = 0;
p.stdout.on('data', d => {
  process.stdout.write(d);
  if (++got >= 2) p.kill();
});
p.stderr.on('data', d => process.stderr.write(d));

setTimeout(() => {
  p.stdin.write(req(1,'tools/list',{})+'\n');
  p.stdin.write(req(2,'tools/call',{name:'healthcheck',arguments:{}})+'\n');
}, 50);

