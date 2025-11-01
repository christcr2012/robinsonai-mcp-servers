#!/usr/bin/env node
/**
 * Audit Augment/VS Code MCP configuration and detect stdout pollution from servers.
 *
 * What it does:
 * - Reads VS Code user settings.json and finds `augment.mcpServers`
 * - Lists each configured server with command, args, and env overrides
 * - Optionally spawns each server and checks for non-JSON output on stdout before JSON-RPC
 * - Can disable/enable a server entry by name with backup
 *
 * Usage:
 *   node tools/audit-augment-mcp.mjs                # Print current config summary
 *   node tools/audit-augment-mcp.mjs --test         # Also spawn and audit stdout for each server
 *   node tools/audit-augment-mcp.mjs --disable openai-mcp
 *   node tools/audit-augment-mcp.mjs --enable openai-mcp
 *
 * Notes:
 * - Windows paths only (tested on VS Code stable). Adjust `settingsCandidates` if needed.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

const argv = process.argv.slice(2);
const args = new Set(argv);
const getArgValue = (flag) => {
  const idx = argv.indexOf(flag);
  return idx !== -1 ? argv[idx + 1] : undefined;
};

const wantTest = args.has('--test');
const disableName = getArgValue('--disable');
const enableName = getArgValue('--enable');
const onlyArg = getArgValue('--only'); // comma-separated names
const timeoutMsArg = Number(getArgValue('--timeout-ms') || '') || 8000;

function info(msg) { console.log(msg); }
function warn(msg) { console.warn(msg); }
function err(msg) { console.error(msg); }

function loadSettings() {
  // VS Code user settings path on Windows
  const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  const settingsCandidates = [
    path.join(appData, 'Code', 'User', 'settings.json'), // VS Code Stable
    path.join(appData, 'Code - Insiders', 'User', 'settings.json'), // Insiders
  ];

  for (const p of settingsCandidates) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        const json = raw.trim() ? JSON.parse(raw) : {};
        return { path: p, json };
      }
    } catch (e) {
      // try next
    }
  }
  return null;
}

function saveSettings(settingsPath, json) {
  const backupPath = settingsPath + ".backup-" + new Date().toISOString().replace(/[:.]/g, '-');
  fs.copyFileSync(settingsPath, backupPath);
  fs.writeFileSync(settingsPath, JSON.stringify(json, null, 2));
  info(`Saved settings and created backup: ${backupPath}`);
}

function resolveWindowsCommand(command) {
  if (!command) return command;
  if (process.platform !== 'win32') return command;
  // If absolute path, keep
  if (/[\\/]/.test(command) || /^\w:\\/.test(command)) return command;
  // Try common NVM for Windows prefix
  try {
    const prefix = process.env.npm_config_prefix || 'C:\\nvm4w\\nodejs';
    const candidate = path.join(prefix, `${command}.cmd`);
    if (fs.existsSync(candidate)) return candidate;
  } catch {}
  return command;
}

async function auditServer(name, spec) {
  return new Promise((resolve) => {
    const command = resolveWindowsCommand(spec.command || name);
    const args = Array.isArray(spec.args) ? spec.args : [];
    const env = { ...process.env, ...(spec.env || {}) };

    // On Windows, launching .cmd requires shell. Use shell for .cmd to avoid EINVAL.
    const needsShell = process.platform === 'win32' && /\.cmd$/i.test(command);
    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env,
      shell: needsShell,
    });

    let stdout = '';
    let stderr = '';
    let jsonSeen = false;
    let pollution = '';

    const timeout = setTimeout(() => {
      try { child.kill(); } catch {}
      resolve({ name, ok: jsonSeen, pollution, stderr });
    }, timeoutMsArg);

    const handleLines = (buf) => {
      const chunk = buf.toString();
      stdout += chunk;
      // Evaluate line-by-line to find first valid JSON
      const lines = stdout.split(/\r?\n/);
      // Keep only last partial line in buffer
      stdout = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (!jsonSeen) {
          // Try to parse as JSON
          try {
            const obj = JSON.parse(trimmed);
            // Heuristic: must be JSON-RPC or an object that looks like it
            if (obj && (obj.jsonrpc || obj.method || obj.result || obj.id !== undefined)) {
              jsonSeen = true;
              clearTimeout(timeout);
              try { child.kill(); } catch {}
              resolve({ name, ok: true, pollution, stderr });
              return;
            }
            // else treat as pollution and continue
            pollution += line + '\n';
          } catch {
            pollution += line + '\n';
          }
        } else {
          // After first JSON, we don't care for this audit
        }
      }
    };

    child.stdout.on('data', handleLines);
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', (e) => {
      clearTimeout(timeout);
      resolve({ name, ok: false, error: e.message, pollution, stderr });
    });

    // Send initialize; many servers require this to emit first JSON reply
    const init = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'audit', version: '1.0.0' },
      },
    };
    try {
      child.stdin.write(JSON.stringify(init) + '\n');
    } catch {}
  });
}

async function main() {
  info('🔎 Auditing VS Code Augment MCP configuration');
  const loaded = loadSettings();
  if (!loaded) {
    err('Could not find VS Code settings.json. Please run this on the same Windows user that runs VS Code.');
    process.exit(1);
  }

  const { path: settingsPath, json } = loaded;
  const servers = (json['augment.mcpServers']) || json['mcpServers'] || {};

  if (!servers || Object.keys(servers).length === 0) {
    warn('No augment.mcpServers found in settings.json');
  } else {
    info(`\n📄 settings.json: ${settingsPath}`);
    info('\nConfigured servers:');
    for (const [name, spec] of Object.entries(servers)) {
      const command = spec.command || name;
      const args = Array.isArray(spec.args) ? spec.args : [];
      info(`  • ${name}`);
      info(`      command: ${command}`);
      if (args.length) info(`      args: ${JSON.stringify(args)}`);
      const envKeys = spec.env ? Object.keys(spec.env) : [];
      if (envKeys.length) info(`      env: ${envKeys.join(', ')}`);
    }
  }

  if (disableName || enableName) {
    if (!servers || !servers[disableName || enableName]) {
      err(`Server '${disableName || enableName}' not found in augment.mcpServers`);
      process.exit(1);
    }
    if (disableName) {
      delete servers[disableName];
      json['augment.mcpServers'] = servers;
      saveSettings(settingsPath, json);
      info(`\n⏸️  Disabled server: ${disableName}`);
      return;
    }
    if (enableName) {
      // No-op enable as we don't know the canonical spec here; this is a placeholder
      info(`\nℹ️  Enable requires re-adding the server spec. Use your import script or UI to add it back.`);
      return;
    }
  }

  if (wantTest && servers && Object.keys(servers).length > 0) {
    info('\n🧪 Spawning servers to audit stdout...');
    const results = [];
    const entries = Object.entries(servers).filter(([name]) => {
      if (!onlyArg) return true;
      const set = new Set(onlyArg.split(',').map(s => s.trim()).filter(Boolean));
      return set.has(name);
    });
    for (const [name, spec] of entries) {
      try {
        // Ensure we use absolute command when possible if `command` is bare (relies on PATH otherwise)
        const res = await auditServer(name, spec);
        results.push(res);
      } catch (e) {
        results.push({ name, ok: false, error: e.message });
      }
    }

    info('\nSummary:');
    let anyPollution = false;
    for (const r of results) {
      if (r.ok) {
        if (r.pollution && r.pollution.trim().length) {
          anyPollution = true;
          info(`  ⚠️  ${r.name}: JSON-RPC OK, but stdout pollution detected before first JSON:`);
          const sample = r.pollution.split(/\r?\n/).filter(Boolean).slice(0, 3);
          for (const s of sample) info(`     → ${s}`);
        } else {
          info(`  ✅ ${r.name}: OK (no stdout pollution before JSON)`);
        }
      } else {
        anyPollution = true;
        const msg = r.error || 'No JSON-RPC detected';
        info(`  ❌ ${r.name}: ${msg}`);
        if (r.pollution && r.pollution.trim().length) {
          const sample = r.pollution.split(/\r?\n/).filter(Boolean).slice(0, 3);
          for (const s of sample) info(`     → ${s}`);
        }
      }
    }

    if (anyPollution) {
      info('\nNext steps:');
      info('  - Fix any server that prints to stdout before JSON-RPC (use stderr for logs)');
      info('  - Re-run a focused test: node tools/audit-augment-mcp.mjs --test --only <name> --timeout-ms 5000');
      info("  - You can temporarily disable a server: node tools/audit-augment-mcp.mjs --disable <name>");
    } else {
      info('\nAll good: no stdout pollution detected before JSON.');
    }
  }
}

main().catch((e) => {
  err(e.stack || e.message);
  process.exit(1);
});
