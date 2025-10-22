# Augment Code MCP Configuration Guide

## ✅ VERIFIED WORKING - All 4 Servers Tested Successfully

This guide documents the **correct** configuration for Robinson AI MCP servers with Augment Code.

---

## 🎯 Quick Start

### 1. Verify Servers Are Built
```bash
npm run build --workspaces
```

### 2. Test All Servers (Optional but Recommended)
```bash
node test-all-mcp-servers.mjs
```

Expected output:
```
✅ architect-mcp: PASS (6 tools)
✅ autonomous-agent-mcp: PASS (7 tools)
✅ credit-optimizer-mcp: PASS (32 tools)
✅ robinsons-toolkit-mcp: PASS (5 tools)
```

### 3. Import Configuration into Augment Code

**Steps:**
1. Open Augment Settings Panel (gear icon in Augment panel)
2. In the MCP section, click **"Import from JSON"**
3. Paste the configuration below
4. Click **Save**
5. **Restart VS Code completely** (close all windows)

**Configuration to paste:**
```json
{
  "mcpServers": {
    "architect-mcp": {
      "command": "npx",
      "args": ["-y", "@robinsonai/architect-mcp"],
      "env": {
        "OLLAMA_BASE_URL": "http://localhost:11434",
        "ARCHITECT_FAST_MODEL": "qwen2.5:3b",
        "ARCHITECT_STD_MODEL": "deepseek-coder:33b",
        "ARCHITECT_BIG_MODEL": "qwen2.5-coder:32b"
      }
    },
    "autonomous-agent-mcp": {
      "command": "npx",
      "args": ["-y", "@robinsonai/autonomous-agent-mcp"],
      "env": {
        "OLLAMA_BASE_URL": "http://localhost:11434"
      }
    },
    "credit-optimizer-mcp": {
      "command": "npx",
      "args": ["-y", "@robinsonai/credit-optimizer-mcp"]
    },
    "robinsons-toolkit-mcp": {
      "command": "npx",
      "args": ["-y", "@robinsonai/robinsons-toolkit-mcp"]
    }
  }
}
```

---

## 📊 Expected Tool Counts

After successful import, you should see:
- **architect-mcp**: 6 tools (planning, critique, export)
- **autonomous-agent-mcp**: 7 tools (code generation, analysis, refactoring)
- **credit-optimizer-mcp**: 32 tools (workflow execution, caching, templates)
- **robinsons-toolkit-mcp**: 5 tools (meta-tools, diagnostics, integration discovery)

**Total: 50 tools available**

---

## 🔧 Technical Details

### Configuration Format

**✅ CORRECT** (Augment Code uses standard MCP format):
```json
{
  "mcpServers": {
    "server-name": { ... }
  }
}
```

**Source:** [Official Augment Code Documentation](https://docs.augmentcode.com/setup-augment/mcp)

### Initialize Handler Implementation

All 4 servers correctly implement the MCP initialize handler:

```typescript
import { InitializeRequestSchema } from "@modelcontextprotocol/sdk/types.js";

this.server.setRequestHandler(InitializeRequestSchema, async (request) => ({
  protocolVersion: "2024-11-05",
  capabilities: {
    tools: {},
  },
  serverInfo: {
    name: "@robinsonai/server-name",
    version: "x.x.x",
  },
}));
```

This handler is **required** by the MCP protocol and must be present before `tools/list` or any other requests.

---

## 🐛 Troubleshooting

### Problem: Servers show "0 tools available"

**Checklist:**
1. ✅ Did you import the configuration via "Import from JSON"?
2. ✅ Did you restart VS Code **completely** (close all windows)?
3. ✅ Are all packages built? Run: `npm run build --workspaces`
4. ✅ Is Ollama running? Test: `curl http://localhost:11434/api/tags`
5. ✅ Check VS Code Output panel → "Augment Code" for errors

### Problem: Architect MCP is slow to start

**Expected behavior:** Architect MCP warms up 3 Ollama models on startup:
- `qwen2.5:3b` (fast model)
- `deepseek-coder:33b` (standard model)  
- `qwen2.5-coder:32b` (big model)

This can take 10-30 seconds. You'll see warnings if models aren't available:
```
[Architect] ⚠ deepseek-coder:33b not available: Ollama timeout after 10000ms
```

**Solution:** Pull missing models or adjust environment variables to use models you have.

### Manual Server Testing

Test a single server manually:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | npx -y @robinsonai/architect-mcp
```

Expected: JSON responses with initialize result and tools list.

---

## 🌍 Environment Variables

### Architect MCP
| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API endpoint |
| `ARCHITECT_FAST_MODEL` | `qwen2.5:3b` | Fast planning model |
| `ARCHITECT_STD_MODEL` | `deepseek-coder:33b` | Standard planning model |
| `ARCHITECT_BIG_MODEL` | `qwen2.5-coder:32b` | Large/forensic planning model |

### Autonomous Agent MCP
| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API endpoint |

### Credit Optimizer MCP
No environment variables required.

### Robinson's Toolkit MCP
No environment variables required.

---

## 📝 Change History

### What Was Fixed
1. **Added InitializeRequestSchema handler** to all 4 servers
2. **Verified configuration format** matches official Augment documentation
3. **Created test suite** (`test-all-mcp-servers.mjs`) to verify all servers
4. **Updated documentation** with correct import process

### Files Modified
- `packages/architect-mcp/src/index.ts`
- `packages/autonomous-agent-mcp/src/index.ts`
- `packages/credit-optimizer-mcp/src/index.ts`
- `packages/robinsons-toolkit-mcp/src/index.ts`

All servers rebuilt and tested successfully.

---

## 🎓 For Future Reference

**When adding new MCP servers:**
1. Always implement `InitializeRequestSchema` handler
2. Test with `test-all-mcp-servers.mjs` before publishing
3. Use `"mcpServers"` in configuration (standard MCP format)
4. Document required environment variables
5. Provide expected tool count for verification

**Official Documentation:**
- Augment MCP Setup: https://docs.augmentcode.com/setup-augment/mcp
- MCP Protocol Spec: https://modelcontextprotocol.io/

