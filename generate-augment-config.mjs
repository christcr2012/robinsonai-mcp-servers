#!/usr/bin/env node

/**
 * Generate augment-mcp-config.json with correct workspace root
 * Run this in any repository to create a working config
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the workspace root (where this script is located)
const workspaceRoot = resolve(__dirname);

console.log(`Generating augment-mcp-config.json for workspace: ${workspaceRoot}`);

const config = {
  "mcpServers": {
    "Free Agent MCP": {
      "command": "npx",
      "args": ["-y", "@robinson_ai_systems/free-agent-mcp@0.1.8"],
      "env": {
        "OLLAMA_BASE_URL": "http://localhost:11434",
        "MAX_OLLAMA_CONCURRENCY": "15",
        "ENABLE_SKILL_LEARNING": "1",
        "AUTO_TRAIN": "0"
      }
    },
    "Paid Agent MCP": {
      "command": "npx",
      "args": ["-y", "@robinson_ai_systems/paid-agent-mcp@0.2.6"],
      "env": {
        "OPENAI_API_KEY": process.env.OPENAI_API_KEY || "YOUR_OPENAI_API_KEY_HERE",
        "ANTHROPIC_API_KEY": process.env.ANTHROPIC_API_KEY || "YOUR_ANTHROPIC_API_KEY_HERE",
        "MONTHLY_BUDGET": "25",
        "MAX_OPENAI_CONCURRENCY": "15",
        "ENABLE_BUDGET_TRACKING": "1",
        "COST_OPTIMIZATION": "1"
      }
    },
    "Thinking Tools MCP": {
      "command": "npx",
      "args": ["-y", "@robinson_ai_systems/thinking-tools-mcp@1.4.4", "--workspace-root", workspaceRoot],
      "env": {
        "WORKSPACE_ROOT": workspaceRoot,
        "OLLAMA_BASE_URL": "http://localhost:11434",
        "CTX_EMBED_PROVIDER": "ollama",
        "CONTEXT7_API_KEY": "",
        "CTX_WEB_ENABLE": "1",
        "CTX_WEB_CONCURRENCY": "3",
        "CTX_WEB_DELAY_MS": "350",
        "FETCH_UA": "Robinson-Context/1.0 (+https://robinsonaisystems.com)",
        "TAVILY_API_KEY": process.env.TAVILY_API_KEY || "",
        "BING_SUBSCRIPTION_KEY": "",
        "SERPAPI_KEY": process.env.SERPAPI_KEY || "",
        "CTX_ENABLE_SEMANTIC_SEARCH": "1",
        "CTX_AUTO_INDEX": "1"
      }
    },
    "Credit Optimizer MCP": {
      "command": "npx",
      "args": ["-y", "@robinson_ai_systems/credit-optimizer-mcp@0.1.7"],
      "env": {
        "ENABLE_COST_TRACKING": "1",
        "ENABLE_LEARNING": "1"
      }
    },
    "Robinson's Toolkit MCP": {
      "command": "npx",
      "args": ["-y", "@robinson_ai_systems/robinsons-toolkit-mcp@1.0.6"],
      "env": {
        "GITHUB_TOKEN": process.env.GITHUB_TOKEN || "YOUR_GITHUB_TOKEN_HERE",
        "VERCEL_TOKEN": process.env.VERCEL_TOKEN || "YOUR_VERCEL_TOKEN_HERE",
        "NEON_API_KEY": process.env.NEON_API_KEY || "YOUR_NEON_API_KEY_HERE",
        "UPSTASH_REDIS_REST_URL": process.env.UPSTASH_REDIS_REST_URL || "YOUR_UPSTASH_URL_HERE",
        "UPSTASH_REDIS_REST_TOKEN": process.env.UPSTASH_REDIS_REST_TOKEN || "YOUR_UPSTASH_TOKEN_HERE",
        "GOOGLE_CLIENT_ID": process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE",
        "GOOGLE_CLIENT_SECRET": process.env.GOOGLE_CLIENT_SECRET || "YOUR_GOOGLE_CLIENT_SECRET_HERE",
        "GOOGLE_REFRESH_TOKEN": process.env.GOOGLE_REFRESH_TOKEN || "YOUR_GOOGLE_REFRESH_TOKEN_HERE"
      }
    }
  }
};

// Write the config file
const configPath = resolve(__dirname, 'augment-mcp-config.json');
writeFileSync(configPath, JSON.stringify(config, null, 2));

console.log(`✅ Generated: ${configPath}`);
console.log(`\n📝 Next steps:`);
console.log(`1. Edit augment-mcp-config.json and add your API keys`);
console.log(`2. Restart Augment to load the new config`);
console.log(`\n💡 Workspace root automatically set to: ${workspaceRoot}`);

