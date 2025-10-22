#!/usr/bin/env node

/**
 * Generate MCP Configuration JSON
 * 
 * Creates augment-mcp-config.json with all 4 Robinson AI servers configured.
 * Prompts for optional API keys and generates environment variables.
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
  console.log('🔧 Robinson AI MCP Configuration Generator\n');
  console.log('This will generate your MCP server configuration.');
  console.log('Press Enter to skip optional API keys.\n');

  // Collect optional API keys
  const config = {
    mcpServers: {}
  };

  // 1. Architect MCP (always included)
  console.log('📐 Architect MCP (Strategic Planning with Local LLMs)');
  const ollamaUrl = await prompt('  Ollama URL [http://localhost:11434]: ') || 'http://localhost:11434';
  const fastModel = await prompt('  Fast model [qwen2.5:3b]: ') || 'qwen2.5:3b';
  const stdModel = await prompt('  Standard model [deepseek-coder:33b]: ') || 'deepseek-coder:33b';
  const bigModel = await prompt('  Big model [qwen2.5-coder:32b]: ') || 'qwen2.5-coder:32b';

  config.mcpServers['architect-mcp'] = {
    command: 'npx',
    args: ['-y', '@robinsonai/architect-mcp'],
    env: {
      OLLAMA_BASE_URL: ollamaUrl,
      ARCHITECT_FAST_MODEL: fastModel,
      ARCHITECT_STD_MODEL: stdModel,
      ARCHITECT_BIG_MODEL: bigModel
    }
  };

  // 2. Autonomous Agent MCP (always included)
  console.log('\n🤖 Autonomous Agent MCP (Code Generation with Local LLMs)');
  
  config.mcpServers['autonomous-agent-mcp'] = {
    command: 'npx',
    args: ['-y', '@robinsonai/autonomous-agent-mcp'],
    env: {
      OLLAMA_BASE_URL: ollamaUrl
    }
  };

  // 3. Credit Optimizer MCP (always included)
  console.log('\n💰 Credit Optimizer MCP (Autonomous Workflows & Templates)');
  
  config.mcpServers['credit-optimizer-mcp'] = {
    command: 'npx',
    args: ['-y', '@robinsonai/credit-optimizer-mcp'],
    env: {}
  };

  // 4. Robinson's Toolkit MCP (with optional integrations)
  console.log('\n🧰 Robinson\'s Toolkit MCP (912 Tools Across Integrations)');
  console.log('  Configure optional integrations (press Enter to skip):');

  const githubToken = await prompt('    GitHub Token: ');
  const vercelToken = await prompt('    Vercel Token: ');
  const neonApiKey = await prompt('    Neon API Key: ');
  const googleCredsPath = await prompt('    Google Service Account JSON path: ');
  const redisUrl = await prompt('    Redis URL: ');
  const openaiKey = await prompt('    OpenAI API Key: ');
  const resendKey = await prompt('    Resend API Key: ');
  const twilioSid = await prompt('    Twilio Account SID: ');
  const twilioToken = await prompt('    Twilio Auth Token: ');
  const cloudflareToken = await prompt('    Cloudflare API Token: ');

  const toolkitEnv = {};
  if (githubToken) toolkitEnv.GITHUB_TOKEN = githubToken;
  if (vercelToken) toolkitEnv.VERCEL_TOKEN = vercelToken;
  if (neonApiKey) toolkitEnv.NEON_API_KEY = neonApiKey;
  if (googleCredsPath) toolkitEnv.GOOGLE_APPLICATION_CREDENTIALS = googleCredsPath;
  if (redisUrl) toolkitEnv.REDIS_URL = redisUrl;
  if (openaiKey) toolkitEnv.OPENAI_API_KEY = openaiKey;
  if (resendKey) toolkitEnv.RESEND_API_KEY = resendKey;
  if (twilioSid) {
    toolkitEnv.TWILIO_ACCOUNT_SID = twilioSid;
    if (twilioToken) toolkitEnv.TWILIO_AUTH_TOKEN = twilioToken;
  }
  if (cloudflareToken) toolkitEnv.CLOUDFLARE_API_TOKEN = cloudflareToken;

  config.mcpServers['robinsons-toolkit-mcp'] = {
    command: 'npx',
    args: ['-y', '@robinsonai/robinsons-toolkit-mcp'],
    env: toolkitEnv
  };

  // Write config file
  const outputPath = path.resolve(process.cwd(), outputFile);
  fs.writeFileSync(outputPath, JSON.stringify(config, null, 2) + '\n');

  console.log('\n✅ Configuration generated successfully!');
  console.log(`📄 File: ${outputPath}`);
  console.log('\n📋 Summary:');
  console.log(`   • Architect MCP: ${ollamaUrl} (${fastModel}, ${stdModel}, ${bigModel})`);
  console.log(`   • Autonomous Agent MCP: ${ollamaUrl}`);
  console.log(`   • Credit Optimizer MCP: Enabled`);
  console.log(`   • Robinson's Toolkit MCP: ${Object.keys(toolkitEnv).length} integrations configured`);

  if (Object.keys(toolkitEnv).length > 0) {
    console.log('\n🔌 Configured Integrations:');
    if (githubToken) console.log('   ✅ GitHub');
    if (vercelToken) console.log('   ✅ Vercel');
    if (neonApiKey) console.log('   ✅ Neon');
    if (googleCredsPath) console.log('   ✅ Google Workspace');
    if (redisUrl) console.log('   ✅ Redis');
    if (openaiKey) console.log('   ✅ OpenAI');
    if (resendKey) console.log('   ✅ Resend');
    if (twilioSid) console.log('   ✅ Twilio');
    if (cloudflareToken) console.log('   ✅ Cloudflare');
  }

  console.log('\n📖 Next Steps:');
  console.log('   1. Copy this file to your MCP client config location:');
  console.log('      • Augment Code: Project root (already done!)');
  console.log('      • Claude Desktop: ~/Library/Application Support/Claude/claude_desktop_config.json (Mac)');
  console.log('      • Claude Desktop: %APPDATA%\\Claude\\claude_desktop_config.json (Windows)');
  console.log('   2. Restart your MCP client');
  console.log('   3. Run diagnose tools to verify:');
  console.log('      • diagnose_architect');
  console.log('      • diagnose_autonomous_agent');
  console.log('      • diagnose_credit_optimizer');
  console.log('      • diagnose_environment (Robinson\'s Toolkit)');

  rl.close();
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  rl.close();
  process.exit(1);
});

