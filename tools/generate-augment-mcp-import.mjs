#!/usr/bin/env node
/**
 * Generate an Augment-compatible MCP servers import JSON.
 * - Produces MCP_SERVERS_IMPORT.json in the repo root
 * - Also prints the JSON to stdout
 *
 * Import in Augment: Settings > MCP Servers > Import from JSON
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const isWindows = os.platform() === 'win32';
const repoRoot = process.cwd();

function resolveCmd(name) {
  if (!isWindows) return name; // non-Windows fallback
  const prefix = process.env.npm_config_prefix || 'C:\\nvm4w\\nodejs';
  const guess = path.join(prefix, `${name}.cmd`);
  return guess;
}

function pick(obj, keys) {
  const out = {};
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== '') out[k] = obj[k];
  }
  return out;
}

const env = process.env;

function pickEnvWithPlaceholders(obj, keys) {
  const out = {};
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== '') out[k] = obj[k];
    else out[k] = '<SET_ME>';
  }
  return out;
}

function buildServers(includeSecrets = false) {
  const servers = {
    'thinking-tools-mcp': {
      command: resolveCmd('thinking-tools-mcp'),
      args: [],
      env: {}
    },
    'openai-mcp': {
      command: resolveCmd('openai-mcp'),
      args: [],
      env: {}
    },
    'paid-agent-mcp': {
      command: resolveCmd('paid-agent-mcp'),
      args: [],
      env: {}
    },
    'credit-optimizer-mcp': {
      command: resolveCmd('credit-optimizer-mcp'),
      args: [],
      env: {}
    },
    'free-agent-mcp': {
      command: resolveCmd('free-agent-mcp'),
      args: [],
      env: {}
    },
    'robinsons-toolkit-mcp': {
      command: resolveCmd('robinsons-toolkit-mcp'),
      args: [],
      env: {}
    }
  };

  if (includeSecrets) {
    servers['openai-mcp'].env = pickEnvWithPlaceholders(env, [
      'OPENAI_API_KEY',
      'OPENAI_BASE_URL',
      'OPENAI_ORG_ID',
      'OPENAI_PROJECT_ID'
    ]);

    servers['paid-agent-mcp'].env = pickEnvWithPlaceholders(env, [
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
      'GEMINI_API_KEY',
      'MAX_WORKER_CONCURRENCY'
    ]);

    servers['credit-optimizer-mcp'].env = pickEnvWithPlaceholders(env, [
      'CREDIT_OPTIMIZER_SKIP_INDEX',
      'AUGMENT_CREDITS_PER_MONTH',
      'AUGMENT_COST_PER_MONTH',
      'OPTIMIZER_DB'
    ]);

    servers['free-agent-mcp'].env = pickEnvWithPlaceholders(env, [
      'OLLAMA_BASE_URL'
    ]);

    servers['robinsons-toolkit-mcp'].env = pickEnvWithPlaceholders(env, [
      'GITHUB_TOKEN',
      'VERCEL_TOKEN',
      'NEON_API_KEY',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_ANON_KEY',
      'RESEND_API_KEY',
      'REDIS_URL',
      'STRIPE_SECRET_KEY',
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'CLOUDFLARE_API_TOKEN',
      'CLOUDFLARE_ACCOUNT_ID'
    ]);
  }

  // Safe defaults to reduce startup load and make local-only basics work
  if (!servers['credit-optimizer-mcp'].env['CREDIT_OPTIMIZER_SKIP_INDEX']) {
    servers['credit-optimizer-mcp'].env['CREDIT_OPTIMIZER_SKIP_INDEX'] = '1';
  }

  return servers;
}

// Public (no secrets) export
const publicOutput = { mcpServers: buildServers(false) };
const outPath = path.join(repoRoot, 'MCP_SERVERS_IMPORT.json');
fs.writeFileSync(outPath, JSON.stringify(publicOutput, null, 2));
console.log(JSON.stringify(publicOutput, null, 2));
console.error(`\n✅ Wrote ${outPath}`);
console.error('Use Augment Settings > MCP Servers > Import from JSON and select this file.');

// Secrets export (git-ignored)
const secretsOutput = { mcpServers: buildServers(true) };
const secretsPath = path.join(repoRoot, 'MCP_SERVERS_IMPORT.secrets.json');
fs.writeFileSync(secretsPath, JSON.stringify(secretsOutput, null, 2));
console.error(`✅ Wrote ${secretsPath} (contains secrets/placeholders)`);
console.error('Import the secrets variant if you want env values included.');
