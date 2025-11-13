# Robinson's Toolkit MCP Server - Architecture & Integration Guide

**Version:** 2.0.0
**Current Status:** ✅ 1,717 tools across 28 categories (16 integrations)
**Architecture:** Broker pattern with lazy-loading registry

> **⚠️ NOTE:** This document is outdated and describes the old unified pattern (v0.1.1).
> The current architecture (v2.0.0+) uses a **broker pattern** with 11 meta-tools and lazy-loading.
> See [docs/README.md](docs/README.md) and [docs/PHASE_5_CORE_TOOLS.md](docs/PHASE_5_CORE_TOOLS.md) for current documentation.

---

## Current Architecture (v2.0.0+)

### Broker Pattern with Lazy Loading

Robinson's Toolkit now uses a **broker pattern** where only 11 meta-tools are exposed to MCP clients:

1. `toolkit_list_categories` - List all integration categories
2. `toolkit_list_tools` - List tools in a category
3. `toolkit_list_subcategories` - List subcategories within a category
4. `toolkit_get_tool_schema` - Get tool parameter schema
5. `toolkit_discover` - Natural language search across all tools
6. `toolkit_search_tools` - Advanced search with filters
7. `toolkit_list_core_tools` - List curated core tools (Phase 5)
8. `toolkit_discover_core` - Search core tools only (Phase 5)
9. `toolkit_call` - Execute any tool by name
10. `toolkit_health_check` - Server health and diagnostics
11. `toolkit_validate` - Validate tool registry

### Core Tools (Phase 5)

**Core tools** are a curated subset of 75+ essential tools (5-12 per category) that cover the most common use cases:

- Defined in `scripts/core-tools-config.json`
- Loaded at server startup
- Accessible via `toolkit_list_core_tools` and `toolkit_discover_core`
- Perfect for getting started or quick reference

See [docs/PHASE_5_CORE_TOOLS.md](docs/PHASE_5_CORE_TOOLS.md) for complete documentation.

### Registry System

- **`dist/registry.json`** - Generated from tool definitions (1,717 tools)
- **`dist/categories.json`** - Category metadata (28 categories)
- **Lazy Loading** - Handler modules are dynamically imported only when tools are called
- **No Context Pollution** - Only 11 broker tools are exposed to Augment

---

## Legacy Documentation (v0.1.1)

The sections below describe the old unified pattern architecture and are kept for historical reference only.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [File Structure](#file-structure)
3. [Core Components](#core-components)
4. [How It Works](#how-it-works)
5. [Adding New Integration Servers](#adding-new-integration-servers)
6. [Method Name Collision Resolution](#method-name-collision-resolution)
7. [Configuration](#configuration)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### **Design Pattern: Unified Embedded Server**

Robinson's Toolkit uses a **unified embedded pattern** where all tools from multiple MCP servers are consolidated into a single `UnifiedToolkit` class. This is NOT a broker/proxy pattern - all tools are embedded directly.

**Why Unified?**
- Augment Code can only connect to ONE MCP server via stdio
- Multiple servers would require complex process management
- Single server = simpler, faster, more reliable

### **Current Integrations**

| Service | Tools | Status | API Pattern |
|---------|-------|--------|-------------|
| GitHub | 240 | ✅ Working | Custom client (not Octokit) |
| Vercel | 150 | ✅ Working | REST API via `vercelFetch()` |
| Neon | 173 | ✅ Working | REST API via `neonFetch()` |
| **Total** | **563** | **556 showing** | **7 missing (investigate)** |

---

## File Structure

```
packages/robinsons-toolkit-mcp/
├── src/
│   ├── index.ts              # Main unified server (7,108 lines)
│   ├── index.ts.backup       # Backup before major changes
│   └── index.ts.broken       # Broken version (for reference)
├── dist/                     # Compiled JavaScript
│   ├── index.js              # Compiled server
│   ├── index.d.ts            # TypeScript definitions
│   └── *.map                 # Source maps
├── package.json              # Dependencies & scripts
├── tsconfig.json             # TypeScript configuration
├── README.md                 # User documentation
├── ARCHITECTURE.md           # This file
└── node_modules/             # Dependencies
```

### **Key Files**

- **`src/index.ts`** - The entire unified server (7,108 lines)
- **`package.json`** - Defines the `robinsons-toolkit-mcp` command
- **`tsconfig.json`** - TypeScript compilation settings
- **`dist/index.js`** - Compiled output (what actually runs)

---

## Core Components

### **1. UnifiedToolkit Class**

The main class that contains all tools from all integrations.

```typescript
class UnifiedToolkit {
  private isEnabled: boolean = true;
  private server: Server;
  private githubToken: string;
  private vercelToken: string;
  private neonApiKey: string;
  private client: any; // GitHub client
  private baseUrl: string = BASE_URL; // Vercel base URL

  constructor() {
    // Initialize tokens from environment
    this.githubToken = process.env.GITHUB_TOKEN || '';
    this.vercelToken = process.env.VERCEL_TOKEN || '';
    this.neonApiKey = process.env.NEON_API_KEY || '';

    // Initialize GitHub client
    this.client = this.createGitHubClient();

    // Initialize MCP server
    this.server = new Server(
      { name: "robinsons-toolkit", version: "0.1.1" },
      { capabilities: { tools: {} } }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }
}
```

### **2. Custom API Clients**

Each integration has its own fetch method:

#### **GitHub Client (Custom, NOT Octokit)**

```typescript
private async githubFetch(path: string, options: RequestInit = {}): Promise<any> {
  const url = path.startsWith('http') ? path : `https://api.github.com${path}`;
  const response = await globalThis.fetch(url, {
    ...options,
    headers: {
      'Authorization': `token ${this.githubToken}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${error}`);
  }

  return response.json();
}

private createGitHubClient() {
  return {
    get: (path: string, params?: any) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return this.githubFetch(`${path}${query}`, { method: 'GET' });
    },
    post: (path: string, body?: any) =>
      this.githubFetch(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    patch: (path: string, body?: any) =>
      this.githubFetch(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
    put: (path: string, body?: any) =>
      this.githubFetch(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
    delete: (path: string) =>
      this.githubFetch(path, { method: 'DELETE' }),
  };
}
```

#### **Vercel Client**

```typescript
private async vercelFetch(endpoint: string, options: any = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${this.vercelToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  return await response.json();
}
```

#### **Neon Client**

```typescript
private async neonFetch(endpoint: string, options: any = {}) {
  const url = `https://console.neon.tech/api/v2${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${this.neonApiKey}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  return await response.json();
}
```

### **3. Tool Registration**

All 563 tools are registered in the `ListToolsRequestSchema` handler:

```typescript
this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // GitHub tools (240)
    { name: 'github_list_repos', description: '...', inputSchema: {...} },
    { name: 'github_get_repo', description: '...', inputSchema: {...} },
    // ... 238 more GitHub tools

    // Vercel tools (150)
    { name: 'vercel_list_projects', description: '...', inputSchema: {...} },
    { name: 'vercel_get_project', description: '...', inputSchema: {...} },
    // ... 148 more Vercel tools

    // Neon tools (173)
    { name: 'neon_list_projects', description: '...', inputSchema: {...} },
    { name: 'neon_create_project', description: '...', inputSchema: {...} },
    // ... 171 more Neon tools
  ]
}));
```

### **4. Tool Execution Handler**

The `CallToolRequestSchema` handler routes tool calls to the appropriate method:

```typescript
this.server.setRequestHandler(CallToolRequestSchema, async (request): Promise<any> => {
  const { name } = request.params;
  const args = request.params.arguments as any;

  try {
    switch (name) {
      // GitHub tools
      case 'github_list_repos': return await this.listRepos(args);
      case 'github_get_repo': return await this.getRepo(args);
      // ... 238 more GitHub cases

      // Vercel tools
      case 'vercel_list_projects': return await this.vercelListProjects(args);
      case 'vercel_get_project': return await this.getProject(args);
      // ... 148 more Vercel cases

      // Neon tools
      case 'neon_list_projects': return await this.neonListProjects(args);
      case 'neon_create_project': return await this.createProject(args);
      // ... 171 more Neon cases

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error.message}`
      }],
      isError: true
    };
  }
});
```

### **5. Implementation Methods**

Each tool has a corresponding private async method:

```typescript
// GitHub example
private async listRepos(args: any) {
  const params: any = {};
  if (args.type) params.type = args.type;
  if (args.sort) params.sort = args.sort;
  if (args.per_page) params.per_page = args.per_page;
  if (args.page) params.page = args.page;
  const path = args.org ? `/orgs/${args.org}/repos` : '/user/repos';
  const response = await this.client.get(path, params);
  return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
}

// Vercel example
private async vercelListProjects(args: any) {
  const params = new URLSearchParams();
  if (args.teamId) params.append("teamId", args.teamId);
  const data = await this.vercelFetch(`/v9/projects?${params}`);
  return this.formatResponse(data);
}

// Neon example
private async neonListProjects(args: any) {
  const params = new URLSearchParams();
  if (args.limit) params.append("limit", args.limit.toString());
  if (args.cursor) params.append("cursor", args.cursor);
  if (args.org_id) params.append("org_id", args.org_id);
  if (args.search) params.append("search", args.search);
  const data = await this.neonFetch(`/projects?${params}`);
  return this.formatResponse(data);
}
```

---

## How It Works

### **Startup Flow**

1. **User runs:** `robinsons-toolkit-mcp` (via npm link or direct node command)
2. **Entry point:** `dist/index.js` (compiled from `src/index.ts`)
3. **Constructor runs:**
   - Loads environment variables (API tokens)
   - Creates GitHub client
   - Initializes MCP server
   - Sets up request handlers
4. **Server connects:** Via stdio transport to Augment Code
5. **Ready:** Augment Code can now call any of the 563 tools

### **Tool Call Flow**

```
Augment Code
    ↓
  (stdio)
    ↓
MCP Server (Robinson's Toolkit)
    ↓
CallToolRequestSchema handler
    ↓
switch (tool name)
    ↓
Appropriate method (e.g., vercelListProjects)
    ↓
API fetch (e.g., vercelFetch)
    ↓
Format response
    ↓
Return to Augment Code
```

### **Example: Calling `vercel_list_projects`**

1. Augment Code sends MCP request: `{ name: "vercel_list_projects", arguments: { teamId: "..." } }`
2. `CallToolRequestSchema` handler receives request
3. Switch statement matches `case 'vercel_list_projects'`
4. Calls `await this.vercelListProjects(args)`
5. Method calls `await this.vercelFetch('/v9/projects?teamId=...')`
6. Vercel API returns project data
7. Method formats response and returns to Augment Code

---

## Adding New Integration Servers

### **Step-by-Step Guide**

#### **Step 1: Add Environment Variables**

In `constructor()`:

```typescript
constructor() {
  this.githubToken = process.env.GITHUB_TOKEN || '';
  this.vercelToken = process.env.VERCEL_TOKEN || '';
  this.neonApiKey = process.env.NEON_API_KEY || '';
  this.newServiceToken = process.env.NEW_SERVICE_TOKEN || ''; // ADD THIS
}
```

#### **Step 2: Create Service-Specific Fetch Method**

```typescript
private async newServiceFetch(endpoint: string, options: any = {}) {
  const url = `https://api.newservice.com${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${this.newServiceToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  return await response.json();
}
```

#### **Step 3: Add Tool Definitions**

In `ListToolsRequestSchema` handler, add tools:

```typescript
tools: [
  // ... existing tools ...

  // NEW SERVICE TOOLS
  { 
    name: 'newservice_list_items', 
    description: 'List items from new service', 
    inputSchema: { 
      type: 'object', 
      properties: { 
        limit: { type: 'number' } 
      } 
    } 
  },
  // ... more new service tools ...
]
```

#### **Step 4: Add Case Handlers**

In `CallToolRequestSchema` handler:

```typescript
switch (name) {
  // ... existing cases ...

  // NEW SERVICE
  case 'newservice_list_items': return await this.newServiceListItems(args);
  case 'newservice_get_item': return await this.newServiceGetItem(args);
  // ... more new service cases ...
}
```

#### **Step 5: Implement Methods**

```typescript
private async newServiceListItems(args: any) {
  const params = new URLSearchParams();
  if (args.limit) params.append("limit", args.limit.toString());
  const data = await this.newServiceFetch(`/items?${params}`);
  return this.formatResponse(data);
}

private async newServiceGetItem(args: any) {
  const data = await this.newServiceFetch(`/items/${args.itemId}`);
  return this.formatResponse(data);
}
```

#### **Step 6: Rebuild**

```bash
npm run build
```

#### **Step 7: Test**

Reload VS Code and test the new tools.

---

## Method Name Collision Resolution

### **The Problem**

When merging multiple MCP servers, methods with the same names collide:

```typescript
// GitHub has this:
private async listProjects(args: any) { /* GitHub projects */ }

// Vercel has this:
private async listProjects(args: any) { /* Vercel projects */ }

// Neon has this:
private async listProjects(args: any) { /* Neon projects */ }

// ❌ COLLISION! Only one survives!
```

### **The Solution: Service-Specific Method Names**

```typescript
// GitHub
private async githubListProjects(args: any) { /* GitHub projects */ }

// Vercel
private async vercelListProjects(args: any) { /* Vercel projects */ }

// Neon
private async neonListProjects(args: any) { /* Neon projects */ }

// ✅ NO COLLISION!
```

### **Critical Pattern**

**ALWAYS use service-specific method names:**

```typescript
// ❌ BAD (will collide)
private async listItems(args: any) { }
private async getItem(args: any) { }
private async createItem(args: any) { }

// ✅ GOOD (no collision)
private async newServiceListItems(args: any) { }
private async newServiceGetItem(args: any) { }
private async newServiceCreateItem(args: any) { }
```

### **Naming Convention**

```
<service>_<action>_<resource>

Examples:
- github_list_repos
- vercel_create_deployment
- neon_run_sql
- stripe_create_customer
- supabase_auth_signup
```

---

## Configuration

### **Environment Variables**

Required in `.env` or Augment Code MCP settings:

```bash
# GitHub
GITHUB_TOKEN=ghp_...

# Vercel
VERCEL_TOKEN=...

# Neon
NEON_API_KEY=...
```

### **Augment Code MCP Configuration**

Location: `%APPDATA%\Code\User\globalStorage\augment.vscode-augment\augment-global-state\mcpServers.json`

Use one of these Windows-safe options:

1) Absolute .cmd shim (preferred when globally linked)

```json
{
  "type": "stdio",
  "name": "robinsons-toolkit",
  "command": "C:\\nvm4w\\nodejs\\robinsons-toolkit-mcp.cmd",
  "arguments": [],
  "env": {
    "GITHUB_TOKEN": "ghp_YOUR_GITHUB_TOKEN_HERE",
    "VERCEL_TOKEN": "YOUR_VERCEL_TOKEN_HERE",
    "NEON_API_KEY": "napi_YOUR_NEON_API_KEY_HERE"
  }
}
```

2) Explicit node + dist entry (no global link required)

```json
{
  "type": "stdio",
  "name": "robinsons-toolkit",
  "command": "C:\\Program Files\\nodejs\\node.exe",
  "arguments": [
    "C:\\Users\\chris\\Git Local\\robinsonai-mcp-servers\\packages\\robinsons-toolkit-mcp\\dist\\index.js"
  ],
  "env": {
    "GITHUB_TOKEN": "ghp_YOUR_GITHUB_TOKEN_HERE",
    "VERCEL_TOKEN": "YOUR_VERCEL_TOKEN_HERE",
    "NEON_API_KEY": "napi_YOUR_NEON_API_KEY_HERE"
  }
}
```

3) npx fallback (use with caution; pin absolute npx shim)

```json
{
  "type": "stdio",
  "name": "robinsons-toolkit",
  "command": "C:\\nvm4w\\nodejs\\npx.cmd",
  "arguments": ["-y", "@robinsonai/robinsons-toolkit-mcp"],
  "env": {
    "GITHUB_TOKEN": "ghp_YOUR_GITHUB_TOKEN_HERE",
    "VERCEL_TOKEN": "YOUR_VERCEL_TOKEN_HERE",
    "NEON_API_KEY": "napi_YOUR_NEON_API_KEY_HERE"
  }
}
```

**Important Notes:**
- Prefer absolute executables; don’t rely on PATH inside the extension host.
- Keep stdout clean (JSON-RPC only); send logs to stderr.
- Build before running: `npm run build`.
- Reload VS Code after configuration changes.
- If startup is slow due to multiple servers, minimize heavy work during init.

### **Package.json**

```json
{
  "name": "@robinsonai/robinsons-toolkit-mcp",
  "version": "0.1.1",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "robinsons-toolkit-mcp": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "start": "node dist/index.js"
  }
}
```

---

## Testing

### **1. Test Individual Tools**

In Augment Code chat:

```
Test github_list_repos
Test vercel_list_projects
Test neon_list_projects
```

### **2. Verify Tool Count**

Check VS Code status bar - should show **563 tools** (currently showing 556).

### **3. Test Each Service Category**

```
# GitHub
Test github_get_repo with owner="robinsonai" and repo="Cortiware"

# Vercel
Test vercel_list_deployments with projectId="..."

# Neon
Test neon_list_branches with projectId="..."
```

### **4. Check Build Output**

```bash
npm run build
# Should complete with 0 errors
```

---

## Troubleshooting

### **Problem: Tools not showing in VS Code**

**Solution:** Reload VS Code window to pick up the new build.

### **Problem: "this.client.get is not a function"**

**Cause:** Using `new Octokit()` instead of custom client.

**Solution:** Use `this.createGitHubClient()` in constructor.

### **Problem: Method name collision**

**Cause:** Multiple services have methods with the same name.

**Solution:** Use service-specific method names (e.g., `vercelListProjects` instead of `listProjects`).

### **Problem: Build fails with TypeScript errors**

**Solution:** Check `tsconfig.json` settings and ensure all imports are correct.

### **Problem: Tool count mismatch (556 vs 563)**

**Investigation needed:** Count actual tool registrations and compare with expected.

---

## Summary

Robinson's Toolkit is a **unified embedded MCP server** that consolidates 563 tools from GitHub, Vercel, and Neon into a single server. The key to success is:

1. **Service-specific method names** to avoid collisions
2. **Custom fetch methods** for each API
3. **Proper tool registration** in `ListToolsRequestSchema`
4. **Correct case handlers** in `CallToolRequestSchema`
5. **Rebuild after changes** with `npm run build`
6. **Reload VS Code** to pick up new builds

Follow this guide when adding new integrations to ensure they work without breaking existing tools.

