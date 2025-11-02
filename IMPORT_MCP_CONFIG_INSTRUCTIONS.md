# 🚀 Import MCP Configuration - Quick Guide

**File**: `AUGMENT_MCP_CONFIG_COMPLETE.json`

---

> Windows note: When configuring stdio servers in VS Code, prefer absolute executables (e.g., `C:\nvm4w\nodejs\<bin>.cmd`) or `node.exe` + `dist/index.js`. Avoid relying on PATH, and avoid `npx` unless pinned to `C:\nvm4w\nodejs\npx.cmd`. You can generate Windows-safe JSON with `node tools/generate-augment-mcp-import.mjs`.

## ✅ METHOD 1: Import via Augment Settings UI (RECOMMENDED)

### Step 1: Open Augment Settings
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type: "Augment: Open Settings"
3. Click on it

### Step 2: Find MCP Servers Section
1. Scroll down to find "MCP Servers" section
2. Look for "Import from JSON" or "Edit in settings.json" button

### Step 3: Import the Configuration
**Option A: If there's an "Import from JSON" button**:
1. Click "Import from JSON"
2. Select `AUGMENT_MCP_CONFIG_COMPLETE.json`
3. Click "Import"

**Option B: If there's an "Edit in settings.json" button**:
1. Click "Edit in settings.json"
2. Open `AUGMENT_MCP_CONFIG_COMPLETE.json` in another tab
3. Copy the ENTIRE contents (Ctrl+A, Ctrl+C)
4. Paste into the settings.json file
5. Save (Ctrl+S)

### Step 4: Restart Augment
1. Close VS Code completely
2. Reopen VS Code
3. Wait for Augment to initialize (check bottom-right status bar)

---

## ✅ METHOD 2: Manual Copy to VS Code Settings (ALTERNATIVE)

### Step 1: Open VS Code Settings File
```powershell
# Open the file in VS Code
code "$env:APPDATA\Code\User\settings.json"
```

### Step 2: Copy Configuration
1. Open `AUGMENT_MCP_CONFIG_COMPLETE.json`
2. Copy the ENTIRE contents (Ctrl+A, Ctrl+C)

### Step 3: Paste into Settings
1. In `settings.json`, find the `"mcpServers"` section
2. Replace it with the copied configuration
3. Save the file (Ctrl+S)

### Step 4: Restart VS Code
1. Close VS Code completely
2. Reopen VS Code
3. Wait for Augment to initialize

---

## ✅ METHOD 3: Automated PowerShell Script (FASTEST)

### Run This Command:
```powershell
# Backup current settings
Copy-Item "$env:APPDATA\Code\User\settings.json" "$env:APPDATA\Code\User\settings.json.backup" -Force

# Read current settings
$currentSettings = Get-Content "$env:APPDATA\Code\User\settings.json" -Raw | ConvertFrom-Json

# Read new MCP config
$mcpConfig = Get-Content "AUGMENT_MCP_CONFIG_COMPLETE.json" -Raw | ConvertFrom-Json

# Merge MCP servers
$currentSettings.mcpServers = $mcpConfig.mcpServers

# Save updated settings
$currentSettings | ConvertTo-Json -Depth 10 | Set-Content "$env:APPDATA\Code\User\settings.json"

Write-Host "✓ MCP configuration imported successfully!"
Write-Host "✓ Backup saved to: $env:APPDATA\Code\User\settings.json.backup"
Write-Host ""
Write-Host "Now restart VS Code to load the MCP servers."
```

---

## 📋 What This Configuration Includes

### 7 MCP Servers (COMPLETE):

1. **architect-mcp** (Planning & Decomposition)
   - Uses Ollama for planning
   - Models: qwen2.5:3b, deepseek-coder:33b, qwen2.5-coder:32b

2. **free-agent-mcp** (FREE Model Execution)
   - Prefers FREE Ollama models
   - Can use PAID models if requested
   - Default: preferFree=true

3. **paid-agent-mcp** (PAID Model Execution)
   - Prefers PAID OpenAI/Claude models
   - Can use FREE models if requested
   - Default: preferFree=false
   - **OpenAI API Key**: Included ✅
   - **Claude API Key**: Included ✅
   - **Monthly Budget**: $25

4. **credit-optimizer-mcp** (Cost Tracking)
   - Tracks spending
   - Enforces budgets
   - Optimizes model selection

5. **thinking-tools-mcp** (24 Cognitive Frameworks)
   - Advanced reasoning tools
   - Problem-solving frameworks
   - No API keys needed

6. **openai-mcp** (249 OpenAI API Tools)
   - Direct OpenAI API access
   - Assistants, threads, files, etc.
   - **OpenAI API Key**: Included ✅

7. **robinsons-toolkit-mcp** (906 Integration Tools)
   - **GitHub**: Included ✅
   - **Vercel**: Included ✅
   - **Neon**: Included ✅
   - **Upstash**: Included ✅
   - **Fly.io**: Included ✅

---

## ✅ Verification Steps

### After Restart, Check:

**1. MCP Servers Connected**
```
Ask Augment: "What MCP servers are connected?"
```
**Expected**: 7 servers listed (architect, free-agent, paid-agent, credit-optimizer, thinking-tools, openai, robinsons-toolkit)

**2. Test FREE Agent**
```
Ask Augment: "Use free-agent-mcp to write a hello world function"
```
**Expected**: Uses FREE Ollama, $0.00 cost

**3. Test PAID Agent**
```
Ask Augment: "Use paid-agent-mcp to write a complex algorithm"
```
**Expected**: Uses PAID OpenAI

**4. Check Toolkit**
```
Ask Augment: "List available GitHub tools from robinsons-toolkit-mcp"
```
**Expected**: Shows GitHub tools

---

## 🔧 Troubleshooting

### Problem: "Package not found"

**Solution**:
```powershell
cd packages/free-agent-mcp && npm link && npm run build
cd ../paid-agent-mcp && npm link && npm run build
cd ../..
```

### Problem: "Settings panel won't load"

**Solution**:
1. Close VS Code
2. Delete cache:
   ```powershell
   Remove-Item -Path "$env:APPDATA\Augment Code\User\globalStorage\augment.augment-vscode" -Recurse -Force
   ```
3. Reopen VS Code
4. Re-import configuration

### Problem: "API key invalid"

**Solution**: Check that API keys in the JSON are correct:
- OpenAI: `sk-proj-wn7aq...`
- Claude: `sk-ant-api03-cqoB...`
- GitHub: `ghp_IMX2x...`

---

## 📊 What You'll Get

**Before Import**:
- ❌ No MCP servers
- ❌ No AI agent coordination
- ❌ No cost optimization

**After Import**:
- ✅ 7 MCP servers running (COMPLETE!)
- ✅ FREE + PAID model support
- ✅ Claude support (ready!)
- ✅ 24 cognitive frameworks (thinking-tools)
- ✅ 249 OpenAI API tools (openai-mcp)
- ✅ 906 integration tools (robinsons-toolkit)
- ✅ Cost tracking and optimization
- ✅ Smart model selection

---

## 🎯 Quick Start (TL;DR)

**Fastest Method**:
1. Open `AUGMENT_MCP_CONFIG_COMPLETE.json`
2. Copy everything (Ctrl+A, Ctrl+C)
3. Press `Ctrl+Shift+P` → "Augment: Open Settings"
4. Click "Edit in settings.json"
5. Paste (Ctrl+V)
6. Save (Ctrl+S)
7. Restart VS Code

**Done!** 🚀

---

**Need help?** Just ask! I'm here to assist.

