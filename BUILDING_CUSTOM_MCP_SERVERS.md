# Building Custom MCP Servers - Complete Guide

## Overview

This guide documents the complete process for building custom Model Context Protocol (MCP) servers that work with Augment Code on the first try. This knowledge was hard-won through extensive debugging and iteration.

## Critical Success Factors

### 1. **MCP Protocol Requirements**

**Server Class Pattern:**
```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

class MyMCP {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "@robinsonai/my-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Tool discovery
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "my_tool",
          description: "Tool description",
          inputSchema: {
            type: "object",
            properties: {
              param: { type: "string", description: "Parameter description" },
            },
            required: ["param"],
          },
        },
      ],
    }));

    // Tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        switch (name) {
          case "my_tool":
            return await this.handleMyTool(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
        };
      }
    });
  }

  private async handleMyTool(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    // Implementation
    return {
      content: [{ type: "text", text: "Result" }],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("@robinsonai/my-mcp server running on stdio");
  }
}

const server = new MyMCP();
server.run().catch(console.error);
```

### 2. **Package Configuration (package.json)**

**Critical fields:**
```json
{
  "name": "@robinsonai/my-mcp",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "my-mcp": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.4"
  },
  "devDependencies": {
    "@types/node": "^22.10.5",
    "typescript": "^5.7.2"
  }
}
```

**Key points:**
- `"type": "module"` is REQUIRED for ES modules
- `bin` field creates the executable command
- Bin name (e.g., `my-mcp`) is what you use with `npx`

### 3. **TypeScript Configuration (tsconfig.json)**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4. **Shebang in Source File**

**CRITICAL:** The first line of `src/index.ts` MUST be:
```typescript
#!/usr/bin/env node
```

This gets compiled into `dist/index.js` and makes it executable.

### 5. **Augment Code Integration Pattern**

**The ONLY pattern that works:**

1. **Global linking:**
   ```bash
   cd packages/my-mcp
   npm link
   ```

2. **MCP config (mcp-config.json):**
   ```json
   {
     "mcpServers": {
       "my-custom": {
         "command": "npx",
         "args": ["my-mcp", "arg1", "arg2"]
       }
     }
   }
   ```

**What DOESN'T work:**
- ❌ `npx -y @robinsonai/my-mcp` (package not published to npm)
- ❌ `node <absolute-path>` (Augment Code can't discover tools)
- ❌ `npx @robinsonai/my-mcp` (scoped name doesn't work with local link)

**What DOES work:**
- ✅ `npx my-mcp` (bin name from package.json, globally linked)

### 6. **Return Type Pattern**

**All handler methods MUST return:**
```typescript
Promise<{ content: Array<{ type: string; text: string }> }>
```

**DO NOT use custom type aliases like:**
```typescript
interface ToolResponse {
  content: Array<{ type: string; text: string }>;
}
```

The MCP SDK expects the full type, not an alias.

## Building Process

### Step 1: Create Package Structure
```
packages/my-mcp/
├── src/
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Step 2: Install Dependencies
```bash
cd packages/my-mcp
npm install
```

### Step 3: Build
```bash
npm run build
```

### Step 4: Global Link
```bash
npm link
```

### Step 5: Test Standalone
```bash
npx my-mcp <args>
```

Should output: `@robinsonai/my-mcp server running on stdio`

### Step 6: Add to MCP Config
Edit `mcp-config.json` and add your server.

### Step 7: Import Config and Restart VS Code
Import the config in Augment Code settings and restart VS Code.

## Debugging Tips

### Problem: "No tools available"
**Causes:**
1. Using wrong invocation pattern (not `npx <bin-name>`)
2. Package not globally linked
3. Return type mismatch in handlers
4. Missing shebang in source file

**Solution:**
1. Verify `npm link` was run
2. Check bin name in package.json matches command in config
3. Ensure all handlers return full type (not alias)
4. Verify shebang exists in src/index.ts

### Problem: Server doesn't start
**Causes:**
1. Missing dependencies
2. TypeScript compilation errors
3. Wrong module type

**Solution:**
1. Run `npm install`
2. Run `npm run build` and fix errors
3. Ensure `"type": "module"` in package.json

### Problem: Tools discovered but fail to execute
**Causes:**
1. Missing case in switch statement
2. Handler method doesn't exist
3. Error in handler implementation

**Solution:**
1. Verify case statement matches tool name exactly
2. Verify handler method exists and is called correctly
3. Add try-catch and return error messages

## Best Practices

### Tool Naming Convention
- Use lowercase with underscores: `my_tool_name`
- Prefix with service name: `redis_get`, `vercel_list_projects`
- Be descriptive but concise

### Tool Organization
Group tools by category in the tools array:
```typescript
tools: [
  // ==================== CATEGORY 1 ====================
  { name: "tool1", ... },
  { name: "tool2", ... },
  
  // ==================== CATEGORY 2 ====================
  { name: "tool3", ... },
]
```

### Error Handling
Always wrap tool execution in try-catch:
```typescript
try {
  switch (name) {
    case "my_tool":
      return await this.handleMyTool(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
} catch (error: any) {
  return {
    content: [{ type: "text", text: `Error: ${error.message}` }],
  };
}
```

### Response Formatting
For complex data, use JSON.stringify:
```typescript
return {
  content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
};
```

## Monorepo Integration

### Root package.json
```json
{
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "npm run build --workspaces --if-present",
    "build:my-mcp": "npm run build -w @robinsonai/my-mcp"
  }
}
```

### Building from Root
```bash
npm run build              # Build all packages
npm run build:my-mcp       # Build specific package
```

## Publishing (Future)

When ready to publish to npm:

1. **Update package.json:**
   ```json
   {
     "name": "@robinsonai/my-mcp",
     "publishConfig": {
       "access": "public"
     }
   }
   ```

2. **Publish:**
   ```bash
   npm publish
   ```

3. **Update MCP config to use published package:**
   ```json
   {
     "command": "npx",
     "args": ["-y", "@robinsonai/my-mcp", "arg1"]
   }
   ```

## Current Robinson AI MCP Servers

### Redis MCP (53 tools)
- Comprehensive Redis operations
- String, Hash, List, Set, Sorted Set operations
- Key management and inspection
- Pub/Sub support

### Vercel MCP (49 tools)
- Complete Vercel API coverage
- Projects, deployments, domains, DNS
- Environment variables, secrets
- Aliases, checks, webhooks
- Edge config, analytics

### GitHub MCP (26 tools)
- Official MCP wrapper
- Repository management
- Issues, PRs, commits

### Neon MCP (23 tools)
- Official MCP wrapper
- Database management
- SQL execution

## Next Steps

### Planned Custom MCPs

1. **Enhanced Neon MCP**
   - Advanced migration workflows
   - Performance monitoring
   - Query optimization
   - Branch management

2. **Google Workspace MCP**
   - Gmail integration
   - Google Drive operations
   - Calendar management
   - Sheets/Docs automation

3. **Enhanced GitHub MCP**
   - PR automation workflows
   - Issue templates and workflows
   - GitHub Actions integration
   - Advanced repository analytics

