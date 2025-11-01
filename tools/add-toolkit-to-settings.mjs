#!/usr/bin/env node
/**
 * Add robinsons-toolkit-mcp to VS Code augment.mcpServers with available env tokens.
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

function main() {
  const settingsPath = findSettingsPath();
  if (!settingsPath) {
    console.error('Could not locate VS Code settings.json');
    process.exit(1);
  }
  const raw = fs.readFileSync(settingsPath, 'utf-8');
  const json = raw.trim() ? JSON.parse(raw) : {};

  const servers = json['augment.mcpServers'] || {};

  // Determine command shim on Windows global prefix if present
  const defaultCmd = 'robinsons-toolkit-mcp';
  let commandPath = defaultCmd;
  try {
    const prefix = process.env.npm_config_prefix || 'C:\\nvm4w\\nodejs';
    const candidate = path.join(prefix, 'robinsons-toolkit-mcp.cmd');
    if (process.platform === 'win32' && fs.existsSync(candidate)) {
      commandPath = candidate;
    }
  } catch {}

  // Collect env tokens
  const env = {};
  const integrations = [
    ['GITHUB_TOKEN'],
    ['GITHUB_PERSONAL_ACCESS_TOKEN', 'GITHUB_TOKEN'],
    ['VERCEL_TOKEN'],
    ['NEON_API_KEY'],
    ['GOOGLE_APPLICATION_CREDENTIALS'],
    ['REDIS_URL'],
    ['OPENAI_API_KEY'],
    ['RESEND_API_KEY'],
    ['TWILIO_ACCOUNT_SID'],
    ['TWILIO_AUTH_TOKEN'],
    ['CLOUDFLARE_API_TOKEN'],
    ['STRIPE_SECRET_KEY'],
    ['SUPABASE_URL'],
    ['SUPABASE_SERVICE_ROLE_KEY'],
  ];
  for (const [key, mapTo] of integrations) {
    const val = process.env[key];
    if (val) env[mapTo || key] = val;
  }

  servers['robinsons-toolkit-mcp'] = {
    command: commandPath,
    args: [],
    env,
  };

  json['augment.mcpServers'] = servers;
  const b = backup(settingsPath);
  fs.writeFileSync(settingsPath, JSON.stringify(json, null, 2));
  console.log('Added robinsons-toolkit-mcp to augment.mcpServers. Backup:', b);
}

main();
