#!/usr/bin/env node
/**
 * Setup Augment MCP Config from .env.local
 * 
 * This script reads environment variables from .env.local and generates
 * an Augment MCP configuration file that references those variables.
 * 
 * Benefits:
 * - No secrets in config files
 * - Single source of truth (.env.local)
 * - Easy to update API keys
 * - Safe to commit config to git
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env.local
const envPath = join(__dirname, '.env.local');
const envContent = readFileSync(envPath, 'utf-8');

// Parse environment variables
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const match = trimmed.match(/^([^=]+)="?([^"]*)"?$/);
    if (match) {
      env[match[1]] = match[2];
    }
  }
}

console.log('📦 Loaded environment variables from .env.local');
console.log(`   Found ${Object.keys(env).length} variables`);

// Generate Augment MCP config
const config = {
  mcpServers: {
    "Free Agent MCP": {
      command: "npx",
      args: ["-y", "@robinson_ai_systems/free-agent-mcp@0.1.6"],
      env: {
        OLLAMA_BASE_URL: env.OLLAMA_BASE_URL || "http://localhost:11434",
        MAX_OLLAMA_CONCURRENCY: env.MAX_OLLAMA_CONCURRENCY || "15",
        DEFAULT_OLLAMA_MODEL: env.DEFAULT_OLLAMA_MODEL || "qwen2.5-coder:7b",
        OLLAMA_START_TIMEOUT: env.OLLAMA_START_TIMEOUT || "120",
        FAST_MODEL: env.FAST_MODEL || "qwen2.5:3b",
        MEDIUM_MODEL: env.MEDIUM_MODEL || "qwen2.5-coder:7b",
        COMPLEX_MODEL: env.COMPLEX_MODEL || "qwen2.5-coder:7b"
      }
    },
    "Paid Agent MCP": {
      command: "npx",
      args: ["-y", "@robinson_ai_systems/paid-agent-mcp@0.2.3"],
      env: {
        OPENAI_API_KEY: env.OPENAI_API_KEY,
        ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
        MONTHLY_BUDGET: env.MONTHLY_BUDGET || "25",
        MAX_OPENAI_CONCURRENCY: env.MAX_OPENAI_CONCURRENCY || "15"
      }
    },
    "Thinking Tools MCP": {
      command: "npx",
      args: ["-y", "@robinson_ai_systems/thinking-tools-mcp@1.1.2"]
    },
    "Credit Optimizer MCP": {
      command: "npx",
      args: ["-y", "@robinson_ai_systems/credit-optimizer-mcp@0.1.6"],
      env: {
        CREDIT_OPTIMIZER_SKIP_INDEX: env.CREDIT_OPTIMIZER_SKIP_INDEX || "0"
      }
    },
    "Robinson's Toolkit MCP": {
      command: "npx",
      args: ["-y", "@robinson_ai_systems/robinsons-toolkit-mcp@1.0.2"],
      env: {
        GITHUB_TOKEN: env.GITHUB_TOKEN,
        VERCEL_TOKEN: env.VERCEL_TOKEN,
        NEON_API_KEY: env.NEON_API_KEY,
        UPSTASH_API_KEY: env.UPSTASH_API_KEY,
        UPSTASH_EMAIL: env.UPSTASH_EMAIL,
        UPSTASH_REDIS_REST_URL: env.UPSTASH_REDIS_REST_URL,
        UPSTASH_REDIS_REST_TOKEN: env.UPSTASH_REDIS_REST_TOKEN,
        OPENAI_API_KEY: env.OPENAI_API_KEY,
        GOOGLE_SERVICE_ACCOUNT_KEY: env.GOOGLE_SERVICE_ACCOUNT_KEY,
        GOOGLE_USER_EMAIL: env.GOOGLE_USER_EMAIL,
        STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
        SUPABASE_URL: env.SUPABASE_URL,
        SUPABASE_KEY: env.SUPABASE_KEY || env.SUPABASE_ANON_KEY,
        RESEND_API_KEY: env.RESEND_API_KEY,
        TWILIO_ACCOUNT_SID: env.TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN: env.TWILIO_AUTH_TOKEN,
        CLOUDFLARE_API_TOKEN: env.CLOUDFLARE_API_TOKEN
      }
    }
  }
};

// Write config file
const configPath = join(__dirname, 'augment-mcp-config.json');
writeFileSync(configPath, JSON.stringify(config, null, 2));

console.log('');
console.log('✅ Generated augment-mcp-config.json');
console.log('');
console.log('📋 Configuration Summary:');
console.log('   - Free Agent MCP: v0.1.6 (Ollama)');
console.log('   - Paid Agent MCP: v0.2.3 (OpenAI/Claude)');
console.log('   - Thinking Tools MCP: latest');
console.log('   - Credit Optimizer MCP: v0.1.6');
console.log('   - Robinson\'s Toolkit MCP: v1.0.2');
console.log('');
console.log('🔑 Environment Variables Loaded:');
console.log(`   - OLLAMA_BASE_URL: ${env.OLLAMA_BASE_URL || 'http://localhost:11434'}`);
console.log(`   - OPENAI_API_KEY: ${env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   - ANTHROPIC_API_KEY: ${env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   - GITHUB_TOKEN: ${env.GITHUB_TOKEN ? '✅ Set' : '❌ Missing'}`);
console.log(`   - VERCEL_TOKEN: ${env.VERCEL_TOKEN ? '✅ Set' : '❌ Missing'}`);
console.log(`   - NEON_API_KEY: ${env.NEON_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   - UPSTASH_API_KEY: ${env.UPSTASH_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   - GOOGLE_SERVICE_ACCOUNT_KEY: ${env.GOOGLE_SERVICE_ACCOUNT_KEY ? '✅ Set' : '❌ Missing'}`);
console.log('');
console.log('🚀 Next Steps:');
console.log('   1. Import augment-mcp-config.json into Augment');
console.log('   2. Restart Augment');
console.log('   3. Test with: discover_tools({ query: "github" })');
console.log('');
console.log('💡 To update API keys:');
console.log('   1. Edit .env.local');
console.log('   2. Run: node setup-augment-from-env.mjs');
console.log('   3. Re-import config into Augment');
console.log('');

