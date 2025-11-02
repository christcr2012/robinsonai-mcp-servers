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

### Recommended patterns (Windows-friendly)

Use one of these for each server. Avoid relying on PATH inside the VS Code extension host.

1) Absolute .cmd shim (preferred on Windows when globally linked)

```json
{
   "mcpServers": {
      "architect-mcp": {
         "command": "C:\\nvm4w\\nodejs\\architect-mcp.cmd",
         "args": [],
         "env": {
            "OLLAMA_BASE_URL": "http://localhost:11434",
            "ARCHITECT_FAST_MODEL": "qwen2.5:3b",
            "ARCHITECT_STD_MODEL": "deepseek-coder:33b",
            "ARCHITECT_BIG_MODEL": "qwen2.5-coder:32b"
         }
      },
      "autonomous-agent-mcp": {
         "command": "C:\\nvm4w\\nodejs\\autonomous-agent-mcp.cmd",
         "args": [],
         "env": { "OLLAMA_BASE_URL": "http://localhost:11434" }
      },
      "credit-optimizer-mcp": {
         "command": "C:\\nvm4w\\nodejs\\credit-optimizer-mcp.cmd",
         "args": [],
         "env": { "CREDIT_OPTIMIZER_SKIP_INDEX": "1" }
      },
      "robinsons-toolkit-mcp": {
         "command": "C:\\nvm4w\\nodejs\\robinsons-toolkit-mcp.cmd",
         "args": [],
         "env": {}
      }
   }
}
```

2) Explicit node + dist entry (no global link required)

```json
{
   "mcpServers": {
      "architect-mcp": {
         "command": "C:\\Program Files\\nodejs\\node.exe",
         "args": [
            "C:\\Users\\chris\\Git Local\\robinsonai-mcp-servers\\packages\\architect-mcp\\dist\\index.js"
         ],
         "env": {
            "OLLAMA_BASE_URL": "http://localhost:11434",
            "ARCHITECT_FAST_MODEL": "qwen2.5:3b",
            "ARCHITECT_STD_MODEL": "deepseek-coder:33b",
            "ARCHITECT_BIG_MODEL": "qwen2.5-coder:32b"
         }
      }
   }
}
```

3) npx fallback (use with caution; may emit stdout noise and be slower)

```json
{
   "mcpServers": {
      "architect-mcp": {
         "command": "C:\\nvm4w\\nodejs\\npx.cmd",
         "args": ["-y", "@robinsonai/architect-mcp"],
         "env": { "OLLAMA_BASE_URL": "http://localhost:11434" }
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

1. Prefer absolute executables over PATH-dependent commands:
   - On Windows, use absolute .cmd shims (e.g., `C:\\nvm4w\\nodejs\\<bin>.cmd`) or explicit `node.exe` with a dist entrypoint.
   - Ensure stdout is reserved for JSON-RPC only; send logs to stderr.

2. **Use `"mcpServers"` (not `"augment.mcpServers"`):**
   - For Augment Settings Panel JSON import: `"mcpServers"` ✅
   - For VS Code settings.json: `"augment.mcpServers"` ✅

3. **Make bins available OR use explicit entrypoints:**
   - Option A: `npm link` each package to create shims under `C:\\nvm4w\\nodejs`.
   - Option B: Call `node` with the built `dist/index.js` directly.
   - Verify links with `npm list -g --depth=0`.

4. **Package name in args array:**
   - `"args": ["package-name"]` ✅
   - NOT `"args": []` ❌
   - NOT `"args": ["-y", "@robinsonai/package-name"]` ❌

5. **Fully reload VS Code / Augment:**
   - Close all windows
   - Reopen fresh (or run Developer: Reload Window)

6. For heavy-initialization servers, keep startup cheap:
   - Example: `CREDIT_OPTIMIZER_SKIP_INDEX=1` to disable indexing on boot.

### ❌ DON'T DO THIS

1. Rely on PATH inside the extension host:
   - `"command": "architect-mcp"` ❌ often fails if the extension’s environment lacks the npm global bin path.

2. Emit any non-JSON output on stdout before initialization:
   - npx and some CLIs can print banners or prompts; that breaks the MCP handshake.

3. **Don't mix formats:**
   - Don't use `"augment.mcpServers"` in JSON import ❌
   - Don't use `"mcpServers"` in VS Code settings.json ❌

4. Skip builds for node+dist usage:
   - If using `node dist/index.js`, ensure you `npm run build` first.

---

## Why `npx <bin>` regressed

- The VS Code extension host spawns processes with a restricted environment; PATH may not include npm global bins.
- npx adds latency and may write to stdout (e.g., install notices), corrupting the MCP JSON-RPC stream.
- Concurrent server startups amplify latency and timeouts; minimize hops and ensure clean stdout.

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

Use Windows-safe, explicit commands in Augment’s MCP configuration:

- Prefer absolute .cmd shims or `node.exe` + `dist/index.js`.
- Treat `npx` as a fallback only, pinned to the absolute `npx.cmd` path if used.
- Provide required env vars (see reference above) and keep stdout clean.
- Import via Augment Settings panel using the `mcpServers` root key.
- Reload VS Code after changes.

Tip: Use `tools/generate-augment-mcp-import.mjs` to emit Windows-safe import JSONs (includes an optional secrets variant).

