#!/usr/bin/env node
/**
 * Repair VS Code augment.mcpServers config to a proper name-keyed object.
 *
 * - Finds %APPDATA%\Code\User\settings.json
 * - If augment.mcpServers is an array or an object with numeric keys, converts to an object
 *   keyed by inferred server names from the command shim (e.g., openai-mcp).
 * - Creates a timestamped backup before writing.
 *
 * Usage:
 *   node tools/repair-augment-settings.mjs      # normalize in place
 *   node tools/repair-augment-settings.mjs --wipe  # remove augment.mcpServers entirely
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

function findSettingsPath() {
  const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  const candidates = [
    path.join(appData, 'Code', 'User', 'settings.json'),
    path.join(appData, 'Code - Insiders', 'User', 'settings.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function backup(file) {
  const backupPath = file + ".backup-" + new Date().toISOString().replace(/[:.]/g, '-');
  fs.copyFileSync(file, backupPath);
  return backupPath;
}

function inferNameFromCommand(cmd) {
  if (!cmd || typeof cmd !== 'string') return null;
  const base = path.basename(cmd).replace(/\.(cmd|exe|bat)$/i, '');
  return base || null;
}

function normalizeServers(value) {
  if (!value) return null;
  const out = {};
  const push = (entry, fallbackIndex) => {
    if (!entry || typeof entry !== 'object') return;
    const name = inferNameFromCommand(entry.command) || `server-${fallbackIndex}`;
    out[name] = {
      command: entry.command,
      args: Array.isArray(entry.args) ? entry.args : [],
      env: entry.env && typeof entry.env === 'object' ? entry.env : undefined,
    };
  };

  if (Array.isArray(value)) {
    value.forEach((v, i) => push(v, i));
    return out;
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value);
    const numericLike = keys.every(k => /^(\d+)$/.test(k));
    if (numericLike) {
      keys.sort((a,b) => Number(a) - Number(b)).forEach((k, i) => push(value[k], i));
      return out;
    }
    // Already a named object; return as-is
    return value;
  }
  return null;
}

function main() {
  const wipe = process.argv.includes('--wipe');
  const settingsPath = findSettingsPath();
  if (!settingsPath) {
    console.error('Could not locate VS Code settings.json');
    process.exit(1);
  }
  const raw = fs.readFileSync(settingsPath, 'utf-8');
  const json = raw.trim() ? JSON.parse(raw) : {};

  if (wipe) {
    if (json['augment.mcpServers']) delete json['augment.mcpServers'];
    const b = backup(settingsPath);
    fs.writeFileSync(settingsPath, JSON.stringify(json, null, 2));
    console.log('Wiped augment.mcpServers. Backup:', b);
    process.exit(0);
  }

  const current = json['augment.mcpServers'] || json['mcpServers'];
  const normalized = normalizeServers(current);

  if (!normalized) {
    console.log('Nothing to normalize. Either no augment.mcpServers found or already correct.');
    process.exit(0);
  }

  json['augment.mcpServers'] = normalized;
  const b = backup(settingsPath);
  fs.writeFileSync(settingsPath, JSON.stringify(json, null, 2));

  console.log('Normalized augment.mcpServers to a name-keyed object. Backup:', b);
  console.log('Servers:');
  for (const k of Object.keys(normalized)) {
    const spec = normalized[k];
    console.log(`  • ${k} -> ${spec.command}`);
  }
}

main();
