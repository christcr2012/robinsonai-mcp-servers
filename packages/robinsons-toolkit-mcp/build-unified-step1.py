#!/usr/bin/env python3
"""
Step 1: Build unified toolkit skeleton with GitHub embedded
"""

import re

# Read GitHub MCP
with open('temp-github-mcp.ts', 'r', encoding='utf-8') as f:
    github = f.read()

# Extract GitHub class methods and tool definitions
# Find the tools array in ListToolsRequestSchema
tools_start = github.find('tools: [')
tools_end = github.find('],', tools_start) + 2
github_tools = github[tools_start:tools_end]

# Find the CallToolRequestSchema handler
handler_start = github.find('this.server.setRequestHandler(CallToolRequestSchema')
handler_end = github.find('});', handler_start) + 3
github_handler = github[handler_start:handler_end]

# Find helper methods (fetch, client, etc)
fetch_start = github.find('private async fetch(')
client_end = github.find('};', github.find('private client: GitHubClient')) + 2
github_helpers = github[fetch_start:client_end]

print(f"Extracted GitHub tools: {len(github_tools)} chars")
print(f"Extracted GitHub handler: {len(github_handler)} chars")
print(f"Extracted GitHub helpers: {len(github_helpers)} chars")

# Build unified toolkit with GitHub embedded
unified = f'''#!/usr/bin/env node
/**
 * Robinson's Toolkit - Unified MCP Server
 * 836+ tools across 5 comprehensive integrations + 8 more to build
 * By Robinson AI Systems
 */

import {{ Server }} from '@modelcontextprotocol/sdk/server/index.js';
import {{ StdioServerTransport }} from '@modelcontextprotocol/sdk/server/stdio.js';
import {{
  CallToolRequestSchema,
  ListToolsRequestSchema,
}} from '@modelcontextprotocol/sdk/types.js';

class UnifiedToolkit {{
  private server: Server;
  private baseUrl = 'https://api.github.com';
  
  // API tokens
  private githubToken?: string;
  private vercelToken?: string;
  private neonApiKey?: string;
  private googleCredsPath?: string;
  private redisUrl?: string;

  constructor() {{
    this.server = new Server(
      {{ name: 'robinsons-toolkit-unified', version: '3.0.0' }},
      {{ capabilities: {{ tools: {{}} }} }}
    );
    
    // Load environment variables
    this.githubToken = process.env.GITHUB_TOKEN;
    this.vercelToken = process.env.VERCEL_TOKEN;
    this.neonApiKey = process.env.NEON_API_KEY;
    this.googleCredsPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_CREDENTIALS_JSON;
    this.redisUrl = process.env.REDIS_URL;
    
    this.setupHandlers();
  }}

  // ============================================================
  // GITHUB HELPERS (from github-mcp)
  // ============================================================
  
  {github_helpers}

  // ============================================================
  // SETUP HANDLERS
  // ============================================================
  
  private setupHandlers() {{
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({{
      {github_tools}
    }}));

    {github_handler}
  }}

  async run() {{
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Robinson Toolkit Unified v3.0 - GitHub embedded (240 tools)');
  }}
}}

const toolkit = new UnifiedToolkit();
toolkit.run().catch(console.error);
'''

# Write unified toolkit
with open('src/index.ts', 'w', encoding='utf-8') as f:
    f.write(unified)

print("✅ Created unified toolkit with GitHub embedded (240 tools)")
print("File size:", len(unified), "chars")

