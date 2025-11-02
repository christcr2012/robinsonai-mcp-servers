#!/usr/bin/env node

/**
 * Generate MCP Configuration JSON
 *
 * Creates augment-mcp-config.json with all 5 Robinson AI MCP servers configured.
 * Prompts for API keys and generates environment variables.
 *
 * NOTE: augment-mcp-config.json is git-ignored to prevent committing secrets.
 *
 * 5-Server Architecture:
 *   1. FREE Agent MCP (Ollama) - 0 credits, local execution
 *   2. PAID Agent MCP (OpenAI/Claude) - Use sparingly when quality critical
 *   3. Thinking Tools MCP - Cognitive frameworks + context engine + web context
 *   4. Credit Optimizer MCP - Tool discovery, templates, autonomous workflows
 *   5. Robinson's Toolkit MCP - 1,165 integration tools (GitHub, Vercel, Neon, Upstash, Google, OpenAI)
 *
 * OpenAI MCP is NOT included - OpenAI tools are built into Robinson's Toolkit MCP.
 *
 * Usage:
 *   node generate-mcp-config.mjs
 *   node generate-mcp-config.mjs --output claude_desktop_config.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line args
const args = process.argv.slice(2);
const outputFile = args.includes('--output')
  ? args[args.indexOf('--output') + 1]
  : 'augment-mcp-config.json';

// Create readline interface for prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('🔧 Robinson AI MCP Configuration Generator (5-Server Architecture)\n');
  console.log('This will generate your MCP server configuration.');
  console.log('⚠️  NOTE: augment-mcp-config.json is git-ignored to prevent committing secrets.\n');

  // Collect API keys
  const config = {
    mcpServers: {}
  };

  // 1. FREE Agent MCP (always included)
  console.log('🆓 FREE Agent MCP (Code Generation with Local LLMs - 0 Credits)');
  const ollamaUrl = await prompt('  Ollama URL [http://localhost:11434]: ') || 'http://localhost:11434';
  const fastModel = await prompt('  Fast model [qwen2.5:3b]: ') || 'qwen2.5:3b';
  const mediumModel = await prompt('  Medium model [qwen2.5-coder:7b]: ') || 'qwen2.5-coder:7b';
  const complexModel = await prompt('  Complex model [deepseek-coder:33b]: ') || 'deepseek-coder:33b';

  config.mcpServers['Free Agent MCP'] = {
    command: 'npx',
    args: ['-y', '@robinson_ai_systems/free-agent-mcp@latest'],
    env: {
      OLLAMA_BASE_URL: ollamaUrl,
      MAX_OLLAMA_CONCURRENCY: '15',
      DEFAULT_OLLAMA_MODEL: mediumModel,
      OLLAMA_START_TIMEOUT: '120',
      FAST_MODEL: fastModel,
      MEDIUM_MODEL: mediumModel,
      COMPLEX_MODEL: complexModel,
      ENABLE_LEARNING: '1',
      AUTO_TRAIN: '0'
    }
  };

  // 2. PAID Agent MCP (always included)
  console.log('\n💰 PAID Agent MCP (OpenAI/Claude - Use Sparingly)');
  const openaiKey = await prompt('  OpenAI API Key (required): ');
  const anthropicKey = await prompt('  Anthropic API Key (required): ');
  const monthlyBudget = await prompt('  Monthly Budget [$25]: ') || '25';

  config.mcpServers['Paid Agent MCP'] = {
    command: 'npx',
    args: ['-y', '@robinson_ai_systems/paid-agent-mcp@latest'],
    env: {
      OPENAI_API_KEY: openaiKey,
      ANTHROPIC_API_KEY: anthropicKey,
      MONTHLY_BUDGET: monthlyBudget,
      MAX_OPENAI_CONCURRENCY: '15',
      ENABLE_BUDGET_TRACKING: '1',
      COST_OPTIMIZATION: '1'
    }
  };

  // 3. Thinking Tools MCP (always included)
  console.log('\n🧠 Thinking Tools MCP (Cognitive Frameworks + Context Engine)');
  const tavilyKey = await prompt('  Tavily API Key (optional): ');
  const serpapiKey = await prompt('  SerpAPI Key (optional): ');

  config.mcpServers['Thinking Tools MCP'] = {
    command: 'npx',
    args: ['-y', '@robinson_ai_systems/thinking-tools-mcp@1.4.0'],
    env: {
      OLLAMA_BASE_URL: ollamaUrl,
      CTX_EMBED_PROVIDER: 'ollama',
      CONTEXT7_API_KEY: '',
      CTX_WEB_ENABLE: '1',
      CTX_WEB_CONCURRENCY: '3',
      CTX_WEB_DELAY_MS: '350',
      FETCH_UA: 'Robinson-Context/1.0 (+https://robinsonaisystems.com)',
      TAVILY_API_KEY: tavilyKey || '',
      BING_SUBSCRIPTION_KEY: '',
      SERPAPI_KEY: serpapiKey || '',
      CTX_ENABLE_SEMANTIC_SEARCH: '1',
      CTX_AUTO_INDEX: '1'
    }
  };

  // 4. Credit Optimizer MCP (always included)
  console.log('\n⚡ Credit Optimizer MCP (Tool Discovery, Templates, Workflows)');

  config.mcpServers['Credit Optimizer MCP'] = {
    command: 'npx',
    args: ['-y', '@robinson_ai_systems/credit-optimizer-mcp@latest'],
    env: {
      CREDIT_OPTIMIZER_SKIP_INDEX: '0',
      ENABLE_AUTONOMOUS_WORKFLOWS: '1',
      ENABLE_TEMPLATE_SCAFFOLDING: '1',
      ENABLE_TOOL_DISCOVERY: '1'
    }
  };

  // 5. Robinson's Toolkit MCP (with integrations)
  console.log('\n🧰 Robinson\'s Toolkit MCP (1,165 Integration Tools)');
  console.log('  Configure integrations (press Enter to skip):');

  const githubToken = await prompt('    GitHub Token: ');
  const vercelToken = await prompt('    Vercel Token: ');
  const neonApiKey = await prompt('    Neon API Key: ');
  const upstashApiKey = await prompt('    Upstash API Key: ');
  const upstashEmail = await prompt('    Upstash Email: ');
  const upstashRedisUrl = await prompt('    Upstash Redis REST URL: ');
  const upstashRedisToken = await prompt('    Upstash Redis REST Token: ');
  const googleServiceAccountPath = await prompt('    Google Service Account JSON path: ');
  const googleUserEmail = await prompt('    Google User Email: ');
  const stripeSecretKey = await prompt('    Stripe Secret Key: ');
  const supabaseUrl = await prompt('    Supabase URL: ');
  const supabaseKey = await prompt('    Supabase Key: ');
  const resendKey = await prompt('    Resend API Key: ');
  const twilioSid = await prompt('    Twilio Account SID: ');
  const twilioToken = await prompt('    Twilio Auth Token: ');
  const cloudflareToken = await prompt('    Cloudflare API Token: ');

  const toolkitEnv = {
    ENABLE_LAZY_LOADING: '1',
    BROKER_MODE: '1'
  };

  if (githubToken) toolkitEnv.GITHUB_TOKEN = githubToken;
  if (vercelToken) toolkitEnv.VERCEL_TOKEN = vercelToken;
  if (neonApiKey) toolkitEnv.NEON_API_KEY = neonApiKey;
  if (upstashApiKey) toolkitEnv.UPSTASH_API_KEY = upstashApiKey;
  if (upstashEmail) toolkitEnv.UPSTASH_EMAIL = upstashEmail;
  if (upstashRedisUrl) toolkitEnv.UPSTASH_REDIS_REST_URL = upstashRedisUrl;
  if (upstashRedisToken) toolkitEnv.UPSTASH_REDIS_REST_TOKEN = upstashRedisToken;
  if (openaiKey) toolkitEnv.OPENAI_API_KEY = openaiKey; // Reuse from PAID Agent
  if (googleServiceAccountPath) toolkitEnv.GOOGLE_SERVICE_ACCOUNT_KEY = googleServiceAccountPath;
  if (googleUserEmail) toolkitEnv.GOOGLE_USER_EMAIL = googleUserEmail;
  if (stripeSecretKey) toolkitEnv.STRIPE_SECRET_KEY = stripeSecretKey;
  if (supabaseUrl) toolkitEnv.SUPABASE_URL = supabaseUrl;
  if (supabaseKey) toolkitEnv.SUPABASE_KEY = supabaseKey;
  if (resendKey) toolkitEnv.RESEND_API_KEY = resendKey;
  if (twilioSid) {
    toolkitEnv.TWILIO_ACCOUNT_SID = twilioSid;
    if (twilioToken) toolkitEnv.TWILIO_AUTH_TOKEN = twilioToken;
  }
  if (cloudflareToken) toolkitEnv.CLOUDFLARE_API_TOKEN = cloudflareToken;

  config.mcpServers["Robinson's Toolkit MCP"] = {
    command: 'npx',
    args: ['-y', '@robinson_ai_systems/robinsons-toolkit-mcp@latest'],
    env: toolkitEnv
  };

  // Write config file
  const outputPath = path.resolve(process.cwd(), outputFile);
  fs.writeFileSync(outputPath, JSON.stringify(config, null, 2) + '\n');

  console.log('\n✅ Configuration generated successfully!');
  console.log(`📄 File: ${outputPath}`);
  console.log('⚠️  NOTE: This file is git-ignored to prevent committing secrets.');

  console.log('\n📋 5-Server Architecture Summary:');
  console.log(`   1. FREE Agent MCP: ${ollamaUrl} (${fastModel}, ${mediumModel}, ${complexModel})`);
  console.log(`   2. PAID Agent MCP: OpenAI + Anthropic (Budget: $${monthlyBudget}/month)`);
  console.log(`   3. Thinking Tools MCP: v1.4.0 (52 tools)`);
  console.log(`   4. Credit Optimizer MCP: Enabled`);
  console.log(`   5. Robinson's Toolkit MCP: ${Object.keys(toolkitEnv).length - 2} integrations configured`);

  if (Object.keys(toolkitEnv).length > 2) { // -2 for ENABLE_LAZY_LOADING and BROKER_MODE
    console.log('\n🔌 Configured Integrations:');
    if (githubToken) console.log('   ✅ GitHub (241 tools)');
    if (vercelToken) console.log('   ✅ Vercel (150 tools)');
    if (neonApiKey) console.log('   ✅ Neon (166 tools)');
    if (upstashApiKey) console.log('   ✅ Upstash (157 tools)');
    if (googleServiceAccountPath) console.log('   ✅ Google Workspace (192 tools)');
    if (openaiKey) console.log('   ✅ OpenAI (259 tools - built into Toolkit)');
    if (stripeSecretKey) console.log('   ✅ Stripe');
    if (supabaseKey) console.log('   ✅ Supabase');
    if (resendKey) console.log('   ✅ Resend');
    if (twilioSid) console.log('   ✅ Twilio');
    if (cloudflareToken) console.log('   ✅ Cloudflare');
  }

  console.log('\n💡 Key Points:');
  console.log('   • OpenAI MCP is NOT included - OpenAI tools are built into Robinson\'s Toolkit');
  console.log('   • FREE Agent (Ollama) costs 0 credits - use it first!');
  console.log('   • PAID Agent costs 500-2,000 credits - use only when FREE fails');
  console.log('   • Thinking Tools v1.4.0 has auto-populated cognitive operators');
  console.log('   • Robinson\'s Toolkit uses broker pattern (loads tools on-demand)');

  console.log('\n📖 Next Steps:');
  console.log('   1. Import this config into Augment Code:');
  console.log('      • Open Augment settings');
  console.log('      • Go to MCP Servers section');
  console.log('      • Click "Import from JSON"');
  console.log(`      • Select: ${outputPath}`);
  console.log('   2. Restart Augment Code');
  console.log('   3. Verify servers are running:');
  console.log('      • Check Augment MCP status indicator');
  console.log('      • Look for 5 connected servers');

  rl.close();
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  rl.close();
  process.exit(1);
});

