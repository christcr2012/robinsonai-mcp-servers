# Robinson AI MCP Server Development Guide

## Overview
This guide documents the complete process for creating custom MCP (Model Context Protocol) servers that work with Augment Code on the first try.

## Critical Success Factors

### 1. MCP + Augment Code Integration Pattern
**The most important lesson learned:**
- ✅ **Use `npx <bin-name>`** with globally linked packages
- ❌ **DO NOT use `node <path>`** - servers start but Augment Code can't discover tools
- ❌ **DO NOT use `npx @scope/package`** - only works if published to npm

**Working pattern:**
```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["bin-name", "arg1", "arg2"]
    }
  }
}
```

### 2. Package Configuration Requirements

**package.json must have:**
```json
{
  "name": "@robinsonai/package-name",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "bin-name": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc"
  }
}
```

**Key points:**
- `"type": "module"` is required for ES modules
- `bin` field creates the executable command
- Bin name should be simple (e.g., `redis-mcp`, `vercel-mcp`)

### 3. TypeScript Configuration

**tsconfig.json:**
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

### 4. Source File Structure

**src/index.ts must start with shebang:**
```typescript
#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
```

### 5. MCP Server Class Pattern

```typescript
class MyMCP {
  private server: Server;
  private client: any; // Your API client

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
    // Tool discovery handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "tool_name",
          description: "Tool description",
          inputSchema: {
            type: "object",
            properties: {
              param1: { type: "string", description: "Parameter description" },
            },
            required: ["param1"],
          },
        },
        // ... more tools
      ],
    }));

    // Tool execution handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "tool_name":
            return await this.handleToolName(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  // Tool handler methods
  private async handleToolName(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    // Implementation
    return {
      content: [
        {
          type: "text",
          text: "Result",
        },
      ],
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

### 6. Return Type Requirements

**CRITICAL:** All handler methods must return the exact type:
```typescript
Promise<{ content: Array<{ type: string; text: string }> }>
```

**DO NOT use custom type aliases like `Promise<ToolResponse>`** - this causes TypeScript compilation errors.

## Development Workflow

### Step 1: Create Package Structure
```bash
cd robinsonai-mcp-servers/packages
mkdir my-mcp
cd my-mcp
npm init -y
```

### Step 2: Install Dependencies
```bash
npm install @modelcontextprotocol/sdk
npm install --save-dev typescript @types/node
```

### Step 3: Create Configuration Files
- Create `tsconfig.json` (see above)
- Update `package.json` (see above)
- Create `src/index.ts` with shebang

### Step 4: Implement MCP Server
- Follow the class pattern above
- Add tool definitions to `ListToolsRequestSchema` handler
- Add case statements to `CallToolRequestSchema` switch
- Implement handler methods

### Step 5: Build
```bash
npm run build
```

### Step 6: Global Link
```bash
npm link
```

### Step 7: Test Manually
```bash
npx bin-name arg1 arg2
```

Should output: `@robinsonai/my-mcp server running on stdio`

### Step 8: Configure Augment Code
Add to `mcp-config.json`:
```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["bin-name", "arg1", "arg2"]
    }
  }
}
```

### Step 9: Import and Restart
1. Import the config in Augment Code
2. Restart VS Code
3. Verify tools appear

## Common Pitfalls

### ❌ Using `Promise<ToolResponse>` type alias
**Problem:** TypeScript compilation fails
**Solution:** Use full type `Promise<{ content: Array<{ type: string; text: string }> }>`

### ❌ Using `node <path>` in config
**Problem:** Server starts but no tools discovered
**Solution:** Use `npx <bin-name>` with globally linked package

### ❌ Forgetting shebang
**Problem:** Permission denied or not executable
**Solution:** Add `#!/usr/bin/env node` at top of compiled JS

### ❌ Wrong module type
**Problem:** Import/export errors
**Solution:** Set `"type": "module"` in package.json

### ❌ Missing bin field
**Problem:** Command not found
**Solution:** Add `"bin": { "name": "./dist/index.js" }` to package.json

## Tool Design Best Practices

### 1. Comprehensive Coverage
- Cover all major API endpoints
- Group related operations (CRUD patterns)
- Include both simple and advanced operations

### 2. Clear Naming
- Use consistent prefixes (e.g., `redis_`, `vercel_`)
- Use action verbs (list, get, create, update, delete)
- Be specific (e.g., `list_deployment_files` not `list_files`)

### 3. Good Descriptions
- Explain what the tool does
- Mention key use cases
- Note any important limitations

### 4. Proper Input Schemas
- Mark required vs optional parameters
- Provide clear parameter descriptions
- Use appropriate types (string, number, boolean, array, object)

### 5. Error Handling
- Wrap all operations in try/catch
- Return user-friendly error messages
- Include relevant context in errors

## Publishing (Future)

When ready to publish to npm:

1. Update version in package.json
2. Build: `npm run build`
3. Publish: `npm publish --access public`
4. Update config to use `npx -y @robinsonai/package-name`

## Current Status

### ✅ Completed MCPs
- **Redis MCP**: 53 tools - Comprehensive Redis operations
- **Vercel MCP**: 49 tools - Full Vercel API coverage

### 🔄 Wrapper MCPs (Using Official)
- **GitHub MCP**: 26 tools - Official @modelcontextprotocol/server-github
- **Neon MCP**: 23 tools - Official @neondatabase/mcp-server-neon

### 📋 Planned Custom MCPs
- **Neon MCP**: Enhanced with migrations, performance monitoring, workflows
- **GitHub MCP**: Enhanced with PR automation, Actions integration, issue workflows
- **Google Workspace MCP**: Gmail, Calendar, Drive, Docs, Sheets integration

## Next Steps

See GitHub issues for detailed implementation plans for each MCP server.

