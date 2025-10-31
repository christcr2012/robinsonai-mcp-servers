#!/usr/bin/env node

/**
 * Generate Simplified MCP Configuration
 * 
 * Creates configuration for the SIMPLIFIED architecture where Augment is the orchestrator.
 * Removes redundant layers (Architect MCP, Orchestrator) and gives Augment direct worker access.
 * 
 * SERVERS INCLUDED:
 * 1. free-agent-mcp - FREE Ollama code generation (0 credits!)
 * 2. paid-agent-mcp - PAID OpenAI/Claude for complex tasks
 * 3. robinsons-toolkit-mcp - 906 integration tools (GitHub, Vercel, Neon, Upstash, Google)
 * 4. thinking-tools-mcp - 24 cognitive frameworks
 * 5. credit-optimizer-mcp - Tool discovery, templates, caching, cost tracking
 * 
 * SERVERS REMOVED:
 * ❌ architect-mcp - Augment does the planning
 * ❌ agent-orchestrator - Augment does the coordination
 * 
 * Usage:
 *   node generate-simplified-config.mjs
 *   node generate-simplified-config.mjs --env-file .env.local
 *   node generate-simplified-config.mjs --output SIMPLIFIED_AUGMENT_CONFIG.json
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
  : '.env.local';
const outputFile = args.includes('--output')
  ? args[args.indexOf('--output') + 1]
  : 'SIMPLIFIED_AUGMENT_CONFIG.txt';

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
  console.log('🎯 Robinson AI - SIMPLIFIED MCP Configuration Generator\n');
  console.log('📐 Architecture: Augment as Orchestrator (Direct Worker Access)\n');

  // Load .env file
  loadEnvFile(envFile);

  // Build configuration
  const config = {
    mcpServers: {}
  };

  const ollamaUrl = getEnv('OLLAMA_BASE_URL', 'http://localhost:11434/v1');
  const openaiKey = getEnv('OPENAI_API_KEY');
  const anthropicKey = getEnv('ANTHROPIC_API_KEY');

  // 1. FREE Agent MCP (CORE VALUE - 0 credits!)
  console.log('🆓 Configuring FREE Agent MCP (Ollama - 0 credits!)...');
  config.mcpServers['free-agent-mcp'] = {
    command: 'npx',
    args: ['-y', '@robinsonai/free-agent-mcp'],
    env: {
      OLLAMA_BASE_URL: ollamaUrl,
      MAX_OLLAMA_CONCURRENCY: getEnv('MAX_OLLAMA_CONCURRENCY', '15'),
      DEFAULT_OLLAMA_MODEL: getEnv('DEFAULT_OLLAMA_MODEL', 'qwen2.5-coder:7b')
    }
  };

  // 2. PAID Agent MCP (Fallback for complex tasks)
  console.log('💰 Configuring PAID Agent MCP (OpenAI/Claude)...');
  const paidEnv = {};
  if (openaiKey) {
    paidEnv.OPENAI_API_KEY = openaiKey;
    paidEnv.MONTHLY_BUDGET = getEnv('MONTHLY_BUDGET', '25');
    paidEnv.MAX_OPENAI_CONCURRENCY = getEnv('MAX_OPENAI_CONCURRENCY', '15');
  }
  if (anthropicKey) {
    paidEnv.ANTHROPIC_API_KEY = anthropicKey;
  }
  // Also include Ollama for FREE fallback
  paidEnv.OLLAMA_BASE_URL = ollamaUrl;

  config.mcpServers['paid-agent-mcp'] = {
    command: 'npx',
    args: ['-y', '@robinsonai/paid-agent-mcp'],
    env: paidEnv
  };

  // 3. Robinson's Toolkit MCP (906 integration tools)
  console.log('🧰 Configuring Robinson\'s Toolkit MCP (906 tools)...');
  const toolkitEnv = {};
  
  // Collect all available API keys from environment
  const integrations = [
    { key: 'GITHUB_TOKEN', name: 'GitHub' },
    { key: 'GITHUB_PERSONAL_ACCESS_TOKEN', name: 'GitHub (PAT)', mapTo: 'GITHUB_TOKEN' },
    { key: 'VERCEL_TOKEN', name: 'Vercel' },
    { key: 'NEON_API_KEY', name: 'Neon' },
    { key: 'NEON_ORG_ID', name: 'Neon Org' },
    { key: 'UPSTASH_API_KEY', name: 'Upstash' },
    { key: 'UPSTASH_EMAIL', name: 'Upstash Email' },
    { key: 'UPSTASH_REDIS_REST_URL', name: 'Upstash Redis URL' },
    { key: 'UPSTASH_REDIS_REST_TOKEN', name: 'Upstash Redis Token' },
    { key: 'GOOGLE_SERVICE_ACCOUNT_KEY', name: 'Google Workspace' },
    { key: 'GOOGLE_USER_EMAIL', name: 'Google User Email' },
    { key: 'FLY_API_TOKEN', name: 'Fly.io' },
    { key: 'STRIPE_SECRET_KEY', name: 'Stripe' },
    { key: 'SUPABASE_URL', name: 'Supabase' },
    { key: 'SUPABASE_ANON_KEY', name: 'Supabase Anon Key' },
    { key: 'RESEND_API_KEY', name: 'Resend' },
    { key: 'TWILIO_ACCOUNT_SID', name: 'Twilio' },
    { key: 'TWILIO_AUTH_TOKEN', name: 'Twilio Auth' },
    { key: 'CLOUDFLARE_API_TOKEN', name: 'Cloudflare' },
    { key: 'CLOUDFLARE_ACCOUNT_ID', name: 'Cloudflare Account' },
    { key: 'DOCKER_PAT', name: 'Docker' },
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
    command: 'npx',
    args: ['-y', '@robinsonai/robinsons-toolkit-mcp'],
    env: toolkitEnv
  };

  // 4. Thinking Tools MCP (24 cognitive frameworks)
  console.log('🧠 Configuring Thinking Tools MCP (24 frameworks)...');
  config.mcpServers['thinking-tools-mcp'] = {
    command: 'npx',
    args: ['-y', '@robinsonai/thinking-tools-mcp'],
    env: {}
  };

  // 5. Credit Optimizer MCP (Tool discovery, templates, caching)
  console.log('⚡ Configuring Credit Optimizer MCP (Utility Belt)...');
  config.mcpServers['credit-optimizer-mcp'] = {
    command: 'npx',
    args: ['-y', '@robinsonai/credit-optimizer-mcp'],
    env: {}
  };

  // Write config file
  const outputPath = path.resolve(process.cwd(), outputFile);
  fs.writeFileSync(outputPath, JSON.stringify(config, null, 2) + '\n');

  console.log('\n✅ SIMPLIFIED Configuration Generated!\n');
  console.log(`📄 File: ${outputPath}\n`);
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📋 SIMPLIFIED ARCHITECTURE SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('🎯 ORCHESTRATOR: Augment (You!)');
  console.log('   • Planning & coordination');
  console.log('   • Context understanding');
  console.log('   • Task management');
  console.log('   • Validation & communication\n');
  
  console.log('🔧 EXECUTION WORKERS:');
  console.log(`   ✅ FREE Agent: ${ollamaUrl}`);
  console.log('      - Code generation (0 credits!)');
  console.log('      - Refactoring (0 credits!)');
  console.log('      - Tests (0 credits!)');
  console.log('      - Documentation (0 credits!)');
  console.log(`   ✅ PAID Agent: ${openaiKey ? 'OpenAI' : ''}${openaiKey && anthropicKey ? ' + ' : ''}${anthropicKey ? 'Claude' : ''}`);
  console.log('      - Complex reasoning');
  console.log('      - Quality guarantee');
  console.log('      - Fallback for Ollama failures\n');
  
  console.log('🧰 UTILITIES & TOOLS:');
  console.log(`   ✅ Robinson's Toolkit: ${configuredIntegrations.length} integrations`);
  console.log('   ✅ Thinking Tools: 24 cognitive frameworks');
  console.log('   ✅ Credit Optimizer: Tool discovery, templates, caching\n');
  
  console.log('❌ REMOVED (Redundant):');
  console.log('   ❌ Architect MCP - Augment does planning');
  console.log('   ❌ Agent Orchestrator - Augment does coordination\n');

  if (configuredIntegrations.length > 0) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔌 CONFIGURED INTEGRATIONS');
    console.log('═══════════════════════════════════════════════════════════\n');
    configuredIntegrations.forEach(name => {
      console.log(`   ✅ ${name}`);
    });
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('💰 COST SAVINGS');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('   OLD: Augment (500) + Architect (200) + Orchestrator (100) = 800 credits');
  console.log('   NEW: Augment (500) = 500 credits');
  console.log('   SAVINGS: 300 credits per task (37% reduction!)\n');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📖 NEXT STEPS');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('   1. Copy the JSON content from the file above');
  console.log('   2. Paste into Augment settings (MCP Servers section)');
  console.log('   3. Restart Augment');
  console.log('   4. Test with a simple task:\n');
  console.log('      "Generate a login component using FREE agent"\n');
  console.log('   5. Verify tools are available:');
  console.log('      - delegate_code_generation (FREE agent)');
  console.log('      - toolkit_discover (Robinson\'s Toolkit)');
  console.log('      - devils_advocate (Thinking Tools)');
  console.log('      - scaffold_component (Credit Optimizer)\n');
}

main();

