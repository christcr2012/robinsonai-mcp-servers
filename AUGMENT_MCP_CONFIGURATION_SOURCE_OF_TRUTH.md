# Augment MCP Configuration - Source of Truth

**Last Updated:** 2025-10-22  
**Status:** ✅ VERIFIED WORKING

---

## Prerequisites

### 1. Globally Link All Packages

```bash
cd packages/architect-mcp && npm link
cd ../autonomous-agent-mcp && npm link
cd ../credit-optimizer-mcp && npm link
cd ../robinsons-toolkit-mcp && npm link
```

**Verify:**
```bash
npm list -g --depth=0 | grep robinsonai
```

You should see all 4 packages listed.

---

## Configuration Format

### Working Configuration

```json
{
  "mcpServers": {
    "architect-mcp": {
      "command": "npx",
      "args": ["architect-mcp"],
      "env": {
        "OLLAMA_BASE_URL": "http://localhost:11434",
        "ARCHITECT_FAST_MODEL": "qwen2.5:3b",
        "ARCHITECT_STD_MODEL": "deepseek-coder:33b",
        "ARCHITECT_BIG_MODEL": "qwen2.5-coder:32b"
      }
    },
    "autonomous-agent-mcp": {
      "command": "npx",
      "args": ["autonomous-agent-mcp"],
      "env": {
        "OLLAMA_BASE_URL": "http://localhost:11434"
      }
    },
    "credit-optimizer-mcp": {
      "command": "npx",
      "args": ["credit-optimizer-mcp"],
      "env": {}
    },
    "robinsons-toolkit-mcp": {
      "command": "npx",
      "args": ["robinsons-toolkit-mcp"],
      "env": {
        "GITHUB_TOKEN": "your_github_token_here",
        "VERCEL_TOKEN": "your_vercel_token_here",
        "NEON_API_KEY": "your_neon_api_key_here"
      }
    }
  }
}
```

---

## How to Import

### Step 1: Open Augment Settings Panel
1. Click the **gear icon** (⚙️) in Augment panel
2. Click **Settings**

### Step 2: Import Configuration
1. Scroll to **MCP Servers** section
2. Click **"Import from JSON"**
3. Paste the configuration above
4. Click **Save**

### Step 3: Restart VS Code
1. **Fully quit VS Code** (not just reload window)
2. Reopen VS Code
3. Open Augment panel

### Step 4: Verify
Ask Augment: "List available tools"

You should see tools from all 4 servers.

---

## Critical Rules

### ✅ DO THIS

1. **Use npx with package name in args:**
   - `"command": "npx"` ✅
   - `"args": ["architect-mcp"]` ✅
   - This is the VERIFIED WORKING format

2. **Use `"mcpServers"` (not `"augment.mcpServers"`):**
   - For Augment Settings Panel JSON import: `"mcpServers"` ✅
   - For VS Code settings.json: `"augment.mcpServers"` ✅

3. **Globally link packages FIRST:**
   - Run `npm link` in each package directory
   - Verify with `npm list -g --depth=0`

4. **Package name in args array:**
   - `"args": ["package-name"]` ✅
   - NOT `"args": []` ❌
   - NOT `"args": ["-y", "@robinsonai/package-name"]` ❌

5. **Fully quit VS Code:**
   - Close all windows
   - Reopen fresh

### ❌ DON'T DO THIS

1. **Don't use bin names directly:**
   - `"command": "architect-mcp"` ❌
   - This does NOT work in Augment

2. **Don't use `node` with file paths:**
   - `"command": "node"` ❌
   - `"args": ["C:\\path\\to\\file.js"]` ❌

3. **Don't mix formats:**
   - Don't use `"augment.mcpServers"` in JSON import ❌
   - Don't use `"mcpServers"` in VS Code settings.json ❌

4. **Don't skip global linking:**
   - Packages MUST be globally linked
   - `npx` won't work in Augment

---

## Troubleshooting

### Tools Not Loading

**Check 1: Are packages globally linked?**
```bash
npm list -g --depth=0 | grep robinsonai
```

**Check 2: Are bin files executable?**
```bash
architect-mcp
# Should output: "@robinsonai/architect-mcp running on stdio"
```

**Check 3: Did you fully quit VS Code?**
- Close all windows
- Reopen fresh

**Check 4: Check Augment Output logs**
- View → Output → Select "Augment Code"
- Look for startup errors

### Server Starts But No Tools

**Check: Environment variables**
- Architect needs `OLLAMA_BASE_URL` and model names
- Autonomous Agent needs `OLLAMA_BASE_URL`
- Toolkit needs API tokens (optional but recommended)

### Ollama Timeout Errors

**Normal:** Some models may timeout if not downloaded
```
[Architect] ⚠ deepseek-coder:33b not available: Ollama timeout after 10000ms
```

**This is OK** - Architect will use available models

**To fix:** Download missing models
```bash
ollama pull deepseek-coder:33b
ollama pull qwen2.5-coder:32b
```

---

## Expected Tool Counts

| Server | Tools | Status |
|--------|-------|--------|
| Architect MCP | 6 | ✅ Working |
| Autonomous Agent MCP | 7 | ✅ Working |
| Credit Optimizer MCP | 32 | ✅ Working |
| Robinson's Toolkit MCP | 5 meta-tools | ✅ Working |

**Total:** ~50 tools available

---

## Environment Variables Reference

### Architect MCP
- `OLLAMA_BASE_URL` - Ollama server URL (default: http://localhost:11434)
- `ARCHITECT_FAST_MODEL` - Fast model for quick tasks (default: qwen2.5:3b)
- `ARCHITECT_STD_MODEL` - Standard model (default: deepseek-coder:33b)
- `ARCHITECT_BIG_MODEL` - Large model for complex tasks (default: qwen2.5-coder:32b)

### Autonomous Agent MCP
- `OLLAMA_BASE_URL` - Ollama server URL (default: http://localhost:11434)

### Credit Optimizer MCP
- No required environment variables

### Robinson's Toolkit MCP
- `GITHUB_TOKEN` - GitHub personal access token (optional)
- `VERCEL_TOKEN` - Vercel API token (optional)
- `NEON_API_KEY` - Neon API key (optional)

---

## Package.json Requirements

Each package MUST have:

1. **Shebang in dist/index.js:**
   ```javascript
   #!/usr/bin/env node
   ```

2. **Bin entry in package.json:**
   ```json
   "bin": {
     "package-name": "./dist/index.js"
   }
   ```

3. **Type module:**
   ```json
   "type": "module"
   ```

4. **Main entry:**
   ```json
   "main": "dist/index.js"
   ```

---

## Summary

**The ONLY configuration that works:**

1. Globally link packages: `npm link`
2. Use bin names: `"command": "architect-mcp"`
3. Empty args: `"args": []`
4. Use `"mcpServers"` in JSON import
5. Fully quit and reopen VS Code

**This is the source of truth. All other documentation is outdated.**

