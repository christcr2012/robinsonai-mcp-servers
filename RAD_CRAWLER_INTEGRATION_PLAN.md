# RAD Crawler Integration Plan

## Problem Identified

You're absolutely right! I made an architectural mistake. The RAD Crawler should be **integrated into the unified toolkit**, not a standalone 5th server.

Current (WRONG):
- 5 separate MCP servers
- RAD Crawler as standalone server
- User has to configure 5 servers in Augment

Correct (YOUR VISION):
- 4 MCP servers total
- RAD Crawler integrated into Robinson's Toolkit MCP
- User only configures 4 servers

## Current Architecture

1. **Architect MCP** - Planning & critique (8 tools)
2. **Autonomous Agent MCP** - Local code generation (4 tools)
3. **Credit Optimizer MCP** - Workflows & templates (10 tools)
4. **Robinson's Toolkit MCP** - 912+ tools from 12 integrations
5. ~~**RAD Crawler MCP**~~ ← **SHOULD NOT BE STANDALONE**

## Correct Architecture

1. **Architect MCP** - Planning & critique (8 tools)
2. **Autonomous Agent MCP** - Local code generation (4 tools)
3. **Credit Optimizer MCP** - Workflows & templates (10 tools)
4. **Robinson's Toolkit MCP** - 922+ tools from 13 integrations (including RAD Crawler)

## Integration Options

### Option A: Integrate into `robinsons-toolkit-mcp` (RECOMMENDED)

**Pros:**
- Simpler architecture
- Already has meta-tools for integration management
- Designed as a consolidation layer
- Easier to maintain

**Cons:**
- Currently just a proxy/meta-server
- Would need to add actual tool implementations

### Option B: Integrate into `unified-mcp`

**Pros:**
- Already mentions RAG in description (lines 23-24)
- Has more complete implementations
- Has lazy-loading infrastructure

**Cons:**
- More complex codebase
- Might be redundant with robinsons-toolkit-mcp

## Recommended Approach

**Integrate RAD Crawler into `robinsons-toolkit-mcp`** as the 13th integration:

1. Move RAD Crawler code from `packages/rad-crawler-mcp/src/*` to `packages/robinsons-toolkit-mcp/src/integrations/rad-crawler/`
2. Update `robinsons-toolkit-mcp` to actually implement tools (not just proxy)
3. Add RAD Crawler as integration #13
4. Remove standalone `rad-crawler-mcp` package
5. Update Augment config to only have 4 servers

## Implementation Steps

### Step 1: Create Integration Structure

```
packages/robinsons-toolkit-mcp/src/
├── index.ts                    # Main server
├── lazy-loader.ts              # Existing
├── integrations/
│   ├── rad-crawler/
│   │   ├── index.ts           # RAD tools export
│   │   ├── db.ts              # Database client
│   │   ├── crawler.ts         # Web crawler
│   │   ├── extractor.ts       # Content extraction
│   │   ├── ollama-client.ts   # Ollama integration
│   │   ├── worker.ts          # Job processor
│   │   └── types.ts           # Type definitions
│   ├── github/                # Future: actual GitHub tools
│   ├── vercel/                # Future: actual Vercel tools
│   └── ...
```

### Step 2: Update `robinsons-toolkit-mcp/src/index.ts`

Add RAD Crawler to integrations list:

```typescript
// RAD Crawler integration (10 tools)
this.integrations.set('rad-crawler', {
  name: 'rad-crawler',
  toolCount: 10,
  categories: ['crawling', 'search', 'ingestion', 'governance'],
  status: 'available',
  requiredEnv: ['NEON_DATABASE_URL', 'OLLAMA_BASE_URL'],
});
```

### Step 3: Add RAD Tools to Tool List

```typescript
private getTools(): Tool[] {
  const tools: Tool[] = [
    // Existing meta-tools...
    
    // RAD Crawler tools
    {
      name: 'rad_plan_crawl',
      description: 'Plan a web crawl from a high-level goal using local LLM',
      inputSchema: { /* ... */ },
    },
    {
      name: 'rad_seed',
      description: 'Seed a crawl job with explicit URLs and rules',
      inputSchema: { /* ... */ },
    },
    // ... 8 more RAD tools
  ];
  
  return tools;
}
```

### Step 4: Route Tool Calls

```typescript
this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  // RAD Crawler tools
  if (name.startsWith('rad_')) {
    const radTools = await import('./integrations/rad-crawler/index.js');
    const toolName = name.replace('rad_', '');
    return await radTools[toolName](args);
  }
  
  // Other integrations...
});
```

### Step 5: Update Package Dependencies

Add RAD Crawler dependencies to `robinsons-toolkit-mcp/package.json`:

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.4",
    "axios": "^1.7.9",
    "cheerio": "^1.0.0",
    "robots-parser": "^3.0.1",
    "bottleneck": "^2.19.5",
    "turndown": "^7.2.0",
    "tiktoken": "^1.0.17",
    "pg": "^8.13.1",
    "ollama": "^0.5.9"
  }
}
```

### Step 6: Update Documentation

- Update README to show 4 servers, not 5
- Update tool count: 922+ tools (912 + 10 RAD)
- Update AUGMENT_SETUP_COMPLETE.md to remove RAD Crawler as separate server

### Step 7: Clean Up

- Remove `packages/rad-crawler-mcp` (or mark as deprecated)
- Update `augment-mcp-config.json` to only have 4 servers
- Update all documentation

## Migration Path for Users

If users already have RAD Crawler configured as standalone:

1. Remove `rad-crawler-mcp` from Augment settings
2. Update `robinsons-toolkit-mcp` configuration to include RAD env vars:
   ```json
   {
     "robinsons-toolkit-mcp": {
       "command": "robinsons-toolkit-mcp",
       "args": [],
       "env": {
         "NEON_DATABASE_URL": "postgres://...",
         "OLLAMA_BASE_URL": "http://localhost:11434"
       }
     }
   }
   ```
3. Restart Augment
4. RAD tools now available as `rad_*` tools in Robinson's Toolkit

## Benefits of Integration

1. **Simpler setup** - 4 servers instead of 5
2. **Unified namespace** - All tools in one place
3. **Better organization** - RAD is part of the toolkit
4. **Easier maintenance** - One less server to manage
5. **Consistent with vision** - Robinson's Toolkit as the "hands" to do things

## Timeline

- **Phase 1** (1 hour): Copy RAD code into robinsons-toolkit-mcp
- **Phase 2** (30 min): Update tool routing and registration
- **Phase 3** (30 min): Test integration
- **Phase 4** (30 min): Update documentation
- **Total**: ~2.5 hours

## Next Steps

Would you like me to:

1. **Implement the integration now** - Move RAD Crawler into robinsons-toolkit-mcp
2. **Keep both for now** - Maintain standalone RAD Crawler until you're ready
3. **Different approach** - Integrate into unified-mcp instead

Let me know and I'll execute immediately!

