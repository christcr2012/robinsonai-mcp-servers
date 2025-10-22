#!/usr/bin/env node

/**
 * Import MCP Configuration from Environment Variables
 * 
 * Generates augment-mcp-config.json from environment variables or .env file.
 * Non-interactive - perfect for automation and CI/CD.
 * 
 * Usage:
 *   node import-mcp-config.mjs
 *   node import-mcp-config.mjs --env-file .env.production
 *   node import-mcp-config.mjs --output claude_desktop_config.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line args
const args = process.argv.slice(2);
const envFile = args.includes('--env-file') 
  ? args[args.indexOf('--env-file') + 1] 
  : '.env';
const outputFile = args.includes('--output') 
  ? args[args.indexOf('--output') + 1] 
  : 'augment-mcp-config.json';

// Load .env file if it exists
function loadEnvFile(filePath) {
  const fullPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`ℹ️  No ${filePath} file found, using system environment variables only`);
    return;
  }

  console.log(`📄 Loading environment from ${filePath}`);
  const content = fs.readFileSync(fullPath, 'utf-8');
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Only set if not already in process.env
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

function getEnv(key, defaultValue = '') {
  return process.env[key] || defaultValue;
}

function main() {
  console.log('🔧 Robinson AI MCP Configuration Importer\n');

  // Load .env file
  loadEnvFile(envFile);

  // Build configuration
  const config = {
    mcpServers: {}
  };

  // 1. Architect MCP
  console.log('📐 Configuring Architect MCP...');
  const ollamaUrl = getEnv('OLLAMA_BASE_URL', 'http://localhost:11434');
  const fastModel = getEnv('ARCHITECT_FAST_MODEL', 'qwen2.5:3b');
  const stdModel = getEnv('ARCHITECT_STD_MODEL', 'deepseek-coder:33b');
  const bigModel = getEnv('ARCHITECT_BIG_MODEL', 'qwen2.5-coder:32b');

  // Detect if packages are installed locally (monorepo) or need npx
  const useNpx = !fs.existsSync(path.join(process.cwd(), 'packages', 'architect-mcp'));

  config.mcpServers['architect-mcp'] = {
    command: useNpx ? 'npx' : 'architect-mcp',
    args: useNpx ? ['-y', '@robinsonai/architect-mcp'] : [],
    env: {
      OLLAMA_BASE_URL: ollamaUrl,
      ARCHITECT_FAST_MODEL: fastModel,
      ARCHITECT_STD_MODEL: stdModel,
      ARCHITECT_BIG_MODEL: bigModel
    }
  };

  // 2. Autonomous Agent MCP
  console.log('🤖 Configuring Autonomous Agent MCP...');
  config.mcpServers['autonomous-agent-mcp'] = {
    command: useNpx ? 'npx' : 'autonomous-agent-mcp',
    args: useNpx ? ['-y', '@robinsonai/autonomous-agent-mcp'] : [],
    env: {
      OLLAMA_BASE_URL: ollamaUrl
    }
  };

  // 3. Credit Optimizer MCP
  console.log('💰 Configuring Credit Optimizer MCP...');
  config.mcpServers['credit-optimizer-mcp'] = {
    command: useNpx ? 'npx' : 'credit-optimizer-mcp',
    args: useNpx ? ['-y', '@robinsonai/credit-optimizer-mcp'] : [],
    env: {}
  };

  // 4. Robinson's Toolkit MCP
  console.log('🧰 Configuring Robinson\'s Toolkit MCP...');
  const toolkitEnv = {};
  
  // Collect all available API keys from environment
  const integrations = [
    { key: 'GITHUB_TOKEN', name: 'GitHub' },
    { key: 'GITHUB_PERSONAL_ACCESS_TOKEN', name: 'GitHub (PAT)', mapTo: 'GITHUB_TOKEN' },
    { key: 'VERCEL_TOKEN', name: 'Vercel' },
    { key: 'NEON_API_KEY', name: 'Neon' },
    { key: 'GOOGLE_APPLICATION_CREDENTIALS', name: 'Google Workspace' },
    { key: 'REDIS_URL', name: 'Redis' },
    { key: 'OPENAI_API_KEY', name: 'OpenAI' },
    { key: 'RESEND_API_KEY', name: 'Resend' },
    { key: 'TWILIO_ACCOUNT_SID', name: 'Twilio' },
    { key: 'TWILIO_AUTH_TOKEN', name: 'Twilio Auth' },
    { key: 'CLOUDFLARE_API_TOKEN', name: 'Cloudflare' },
    { key: 'STRIPE_SECRET_KEY', name: 'Stripe' },
    { key: 'SUPABASE_URL', name: 'Supabase' },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', name: 'Supabase Service Key' },
  ];

  const configuredIntegrations = [];
  integrations.forEach(({ key, name, mapTo }) => {
    const value = getEnv(key);
    if (value) {
      toolkitEnv[mapTo || key] = value;
      if (!configuredIntegrations.includes(name)) {
        configuredIntegrations.push(name);
      }
    }
  });

  config.mcpServers['robinsons-toolkit-mcp'] = {
    command: useNpx ? 'npx' : 'robinsons-toolkit-mcp',
    args: useNpx ? ['-y', '@robinsonai/robinsons-toolkit-mcp'] : [],
    env: toolkitEnv
  };

  // Write config file
  const outputPath = path.resolve(process.cwd(), outputFile);
  fs.writeFileSync(outputPath, JSON.stringify(config, null, 2) + '\n');

  console.log('\n✅ Configuration generated successfully!');
  console.log(`📄 File: ${outputPath}\n`);
  
  console.log('📋 Configuration Summary:');
  console.log(`   • Architect MCP: ${ollamaUrl}`);
  console.log(`     - Fast: ${fastModel}`);
  console.log(`     - Standard: ${stdModel}`);
  console.log(`     - Big: ${bigModel}`);
  console.log(`   • Autonomous Agent MCP: ${ollamaUrl}`);
  console.log(`   • Credit Optimizer MCP: Enabled`);
  console.log(`   • Robinson's Toolkit MCP: ${configuredIntegrations.length} integrations`);

  if (configuredIntegrations.length > 0) {
    console.log('\n🔌 Configured Integrations:');
    configuredIntegrations.forEach(name => {
      console.log(`   ✅ ${name}`);
    });
  } else {
    console.log('\n⚠️  No integrations configured (no API keys found)');
    console.log('   Add API keys to .env file or environment variables');
  }

  console.log('\n📖 Next Steps:');
  console.log('   1. For Augment Code: Configuration is ready (in project root)');
  console.log('   2. For Claude Desktop:');
  console.log('      Mac: cp augment-mcp-config.json ~/Library/Application\\ Support/Claude/claude_desktop_config.json');
  console.log('      Windows: copy augment-mcp-config.json %APPDATA%\\Claude\\claude_desktop_config.json');
  console.log('   3. Restart your MCP client');
  console.log('   4. Test with: diagnose_architect, diagnose_autonomous_agent, etc.');

  console.log('\n💡 Tip: Create a .env file with your API keys:');
  console.log('   GITHUB_TOKEN=ghp_...');
  console.log('   VERCEL_TOKEN=...');
  console.log('   NEON_API_KEY=...');
  console.log('   OPENAI_API_KEY=sk-...');
}

main();

