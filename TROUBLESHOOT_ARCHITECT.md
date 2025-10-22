# 🔧 Troubleshooting Architect MCP Installation

## Issue: Architect showing no tools in Augment Code

### Root Cause Analysis

**Possible causes:**
1. ❌ `node` command not in PATH for Augment Code
2. ❌ MCP server not starting correctly
3. ❌ Tools not being registered
4. ❌ Ollama not running
5. ❌ Database initialization failing

---

## ✅ **Solution 1: Use Full Path to Node.js**

### Find Node.js Path

**PowerShell:**
```powershell
(Get-Command node).Path
```

**CMD:**
```cmd
where node
```

**Common paths:**
- `C:\Program Files\nodejs\node.exe`
- `C:\Users\<username>\AppData\Roaming\npm\node.exe`
- `C:\Users\<username>\scoop\apps\nodejs\current\node.exe`

### Update MCP Config

Replace `"command": "node"` with full path:

```json
{
  "mcpServers": {
    "architect-agent": {
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": [
        "c:/Users/chris/Git Local/robinsonai-mcp-servers/packages/architect-mcp/dist/index.js"
      ],
      "env": {
        "OLLAMA_BASE_URL": "http://localhost:11434",
        "ARCHITECT_MODEL": "deepseek-coder:33b"
      }
    }
  }
}
```

---

## ✅ **Solution 2: Test Server Manually**

### 1. Test if server starts

```powershell
cd "c:\Users\chris\Git Local\robinsonai-mcp-servers"
node packages/architect-mcp/dist/index.js
```

**Expected output:**
```
Architect MCP server running on stdio
```

If you see this, the server is working! Press Ctrl+C to stop.

### 2. Test if Ollama is accessible

```powershell
curl http://localhost:11434/api/tags
```

**Expected output:**
```json
{
  "models": [
    {"name": "deepseek-coder:33b", ...},
    {"name": "qwen2.5-coder:32b", ...},
    ...
  ]
}
```

### 3. Test database initialization

```powershell
# Check if database file is created
ls ~/.architect-mcp/insights.db
```

If file doesn't exist, the server will create it on first run.

---

## ✅ **Solution 3: Use NPX Instead**

### Option A: Install globally

```powershell
cd packages/architect-mcp
npm link
```

Then update config:

```json
{
  "mcpServers": {
    "architect-agent": {
      "command": "architect-mcp",
      "env": {
        "OLLAMA_BASE_URL": "http://localhost:11434",
        "ARCHITECT_MODEL": "deepseek-coder:33b"
      }
    }
  }
}
```

### Option B: Use npx with workspace

```json
{
  "mcpServers": {
    "architect-agent": {
      "command": "npx",
      "args": [
        "--workspace=packages/architect-mcp",
        "architect-mcp"
      ],
      "env": {
        "OLLAMA_BASE_URL": "http://localhost:11434",
        "ARCHITECT_MODEL": "deepseek-coder:33b"
      }
    }
  }
}
```

---

## ✅ **Solution 4: Check Augment Code Logs**

### Enable MCP Debug Logging

1. Open VS Code settings
2. Search for "Augment MCP"
3. Enable "MCP Debug Logging"
4. Restart VS Code
5. Check Output panel → "Augment Code MCP"

**Look for:**
- Server startup messages
- Tool registration messages
- Error messages

---

## ✅ **Solution 5: Compare with Working Servers**

### Check if other servers work

**Test Autonomous Agent:**
```json
{
  "mcpServers": {
    "autonomous-agent": {
      "command": "node",
      "args": [
        "c:/Users/chris/Git Local/robinsonai-mcp-servers/packages/autonomous-agent-mcp/dist/index.js"
      ]
    }
  }
}
```

**If Autonomous Agent works but Architect doesn't:**
- Compare package.json files
- Compare dist/index.js files
- Check for missing dependencies

**If neither works:**
- Issue is with `node` command in PATH
- Use full path to node.exe (Solution 1)

---

## ✅ **Solution 6: Rebuild from Scratch**

```powershell
cd packages/architect-mcp

# Clean build
rm -r dist
rm -r node_modules

# Reinstall dependencies
npm install

# Rebuild
npm run build

# Test
node dist/index.js
```

---

## ✅ **Solution 7: Check Environment Variables**

### Verify Ollama URL

```powershell
# Test Ollama connection
curl http://localhost:11434/api/tags

# If fails, check if Ollama is running
Get-Process ollama

# If not running, start it
ollama serve
```

### Verify Model

```powershell
# List available models
ollama list

# Should see:
# deepseek-coder:33b
# qwen2.5-coder:32b
# codellama:34b
```

---

## 🔍 **Diagnostic Checklist**

Run through this checklist:

- [ ] Ollama is running (`curl http://localhost:11434/api/tags`)
- [ ] Model is downloaded (`ollama list | grep deepseek-coder:33b`)
- [ ] Server starts manually (`node packages/architect-mcp/dist/index.js`)
- [ ] Database directory exists (`~/.architect-mcp/`)
- [ ] Node.js is in PATH (`node --version`)
- [ ] MCP config file is valid JSON
- [ ] Augment Code is restarted after config change
- [ ] Other MCP servers work (Autonomous Agent, Credit Optimizer)

---

## 📊 **Expected Behavior**

### When Working Correctly:

**In Augment Code:**
- Architect Agent appears in MCP servers list
- Shows 12 tools:
  1. index_repo
  2. get_repo_map
  3. plan_work
  4. revise_plan
  5. architecture_review
  6. generate_adr
  7. risk_register
  8. smell_scan
  9. security_review
  10. performance_review
  11. export_workplan_to_optimizer
  12. propose_patches

**When calling a tool:**
- Tool executes within 30-60 seconds
- Returns JSON or text response
- No errors in console

---

## 🚨 **Common Errors**

### Error: "Cannot find module 'better-sqlite3'"

**Solution:**
```powershell
cd packages/architect-mcp
npm install better-sqlite3
npm run build
```

### Error: "Cannot find module 'ollama'"

**Solution:**
```powershell
cd packages/architect-mcp
npm install ollama
npm run build
```

### Error: "ECONNREFUSED localhost:11434"

**Solution:**
```powershell
# Start Ollama
ollama serve
```

### Error: "Model not found: deepseek-coder:33b"

**Solution:**
```powershell
# Download model
ollama pull deepseek-coder:33b
```

---

## 📝 **Next Steps**

1. **Try Solution 1** (full path to node.exe) - Most likely fix
2. **Try Solution 2** (test manually) - Verify server works
3. **Try Solution 4** (check logs) - See actual error
4. **Report back** - Share error messages for further debugging

---

## 💡 **Quick Fix (Most Likely)**

**Replace this:**
```json
"command": "node"
```

**With this:**
```json
"command": "C:\\Program Files\\nodejs\\node.exe"
```

**Or find your Node.js path:**
```powershell
(Get-Command node).Path
```

Then use that path in the config!

---

**Last Updated:** 2025-10-21  
**Robinson AI Systems** - https://www.robinsonaisystems.com

