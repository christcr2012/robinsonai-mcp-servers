# 🔧 Complete MCP Servers Fix Instructions for Augment Code

**MISSION**: Fix all 5 MCP servers and update published packages to ensure 100% functionality.

**CURRENT STATUS**: 3/5 servers working, 2 need fixes + package updates required.

---

## 📋 **PRIORITY ORDER (Execute in this sequence)**

### **PHASE 1: Fix Critical Code Issues**

#### **1.1 Fix Robinson's Toolkit MCP Broker Pattern Bug** ⚠️ **CRITICAL**
**Issue**: Parameter name mismatch causing "Tool not found: undefined" errors
**Location**: `packages/robinsons-toolkit-mcp/src/index.ts` lines 308 and 336
**Status**: ✅ Code already fixed, needs rebuild

**Actions**:
```bash
cd packages/robinsons-toolkit-mcp
npm run build
npm version patch
npm publish --access public
```

**Verification**: Test with:
```javascript
toolkit_get_tool_schema_robinsons-toolkit-mcp({
  category: "github", 
  tool_name: "github_list_repos"
})
```

#### **1.2 Fix Credit Optimizer MCP Empty Results** ⚠️ **CRITICAL**
**Issue**: Tool indexing disabled by default, causing empty search results
**Root Cause**: `CREDIT_OPTIMIZER_SKIP_INDEX=1` in configuration

**Actions**:
1. **Update MCP Configuration**: Change environment variable
```json
{
  "credit-optimizer-mcp": {
    "env": {
      "CREDIT_OPTIMIZER_SKIP_INDEX": "0"
    }
  }
}
```

2. **Rebuild and republish**:
```bash
cd packages/credit-optimizer-mcp
npm run build
npm version patch
npm publish --access public
```

**Verification**: Test with:
```javascript
discover_tools_credit-optimizer-mcp({
  query: "github",
  limit: 5
})
```

### **PHASE 2: Fix System Dependencies**

#### **2.1 Fix Free Agent MCP Ollama Issue** ⚠️ **SYSTEM LEVEL**
**Issue**: WSL configuration preventing Ollama startup
**Error**: `CreateProcessCommon:798: execvpe(/bin/bash) failed: No such file or directory`

**Actions**:
1. **Try manual Ollama startup**:
```powershell
# Option 1: Direct executable
C:\Users\chris\AppData\Local\Programs\Ollama\ollama.exe serve

# Option 2: PowerShell script
powershell -ExecutionPolicy Bypass -File "start-ollama-hidden.ps1"

# Option 3: Check if already running
Get-Process -Name "ollama" -ErrorAction SilentlyContinue
```

2. **If WSL issue persists**: 
   - Fix WSL installation or
   - Configure Free Agent MCP to use direct PowerShell commands instead of bash

**Verification**: Test Ollama connection:
```powershell
Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get
```

### **PHASE 3: Update All Published Packages**

#### **3.1 Rebuild All Packages**
```bash
# Build all packages in dependency order
cd packages/shared-llm && npm run build
cd ../robinsons-toolkit-mcp && npm run build  
cd ../free-agent-mcp && npm run build
cd ../paid-agent-mcp && npm run build
cd ../thinking-tools-mcp && npm run build
cd ../credit-optimizer-mcp && npm run build
cd ../openai-mcp && npm run build
```

#### **3.2 Version Bump All Packages**
```bash
# Bump patch version for all fixed packages
cd packages/robinsons-toolkit-mcp && npm version patch
cd ../credit-optimizer-mcp && npm version patch
cd ../free-agent-mcp && npm version patch
```

#### **3.3 Publish All Updated Packages**
```bash
# Publish with correct scope
cd packages/robinsons-toolkit-mcp && npm publish --access public
cd ../credit-optimizer-mcp && npm publish --access public  
cd ../free-agent-mcp && npm publish --access public
cd ../paid-agent-mcp && npm publish --access public
cd ../thinking-tools-mcp && npm publish --access public
cd ../openai-mcp && npm publish --access public
```

### **PHASE 4: Update MCP Configuration**

#### **4.1 Generate New Configuration**
```bash
node tools/generate-augment-mcp-import.mjs
```

#### **4.2 Update Augment Code Settings**
1. Copy the generated configuration
2. Update VS Code settings.json with new package versions
3. Ensure `CREDIT_OPTIMIZER_SKIP_INDEX=0` is set
4. Restart Augment Code extension

### **PHASE 5: Comprehensive Testing**

#### **5.1 Test Each Server**
```bash
node test-5-servers.mjs
```

#### **5.2 Verify Specific Functionality**
- **Paid Agent**: Code generation test
- **Thinking Tools**: devils_advocate test  
- **Robinson's Toolkit**: toolkit_call test
- **Free Agent**: Ollama connection test
- **Credit Optimizer**: discover_tools test

---

## 🎯 **SUCCESS CRITERIA**

✅ **All 5 servers connect successfully**
✅ **Robinson's Toolkit broker pattern works**  
✅ **Credit Optimizer returns tool results**
✅ **Free Agent connects to Ollama**
✅ **All packages published with latest fixes**
✅ **Augment Code can use all 906+ tools**

---

## 🚨 **CRITICAL NOTES**

1. **Execute phases in order** - dependencies matter
2. **Test after each phase** - don't proceed if tests fail
3. **WSL issue may require system admin** - Free Agent might need manual intervention
4. **Backup current config** before making changes
5. **Restart Augment Code** after configuration updates

---

## 📞 **If Issues Persist**

1. Check console logs in Augment Code
2. Verify environment variables are set correctly
3. Ensure all packages built without errors
4. Test individual MCP servers with direct node commands
5. Check network connectivity for package publishing

**Expected Result**: 5/5 servers working, 906+ tools available, 0-credit operations enabled.

---

## 🔍 **DETAILED TROUBLESHOOTING GUIDE**

### **Robinson's Toolkit MCP Issues**
**Symptom**: "Tool not found: undefined" or "Unknown tool: undefined"
**Cause**: Parameter name mismatch in broker pattern
**Fix**: Code already fixed, just needs rebuild and republish
**Test Command**:
```javascript
toolkit_get_tool_schema_robinsons-toolkit-mcp({
  category: "github",
  tool_name: "github_list_repos"
})
```
**Expected**: Returns tool schema, not error

### **Credit Optimizer MCP Issues**
**Symptom**: Empty results from discover_tools
**Cause**: Indexing disabled by default (CREDIT_OPTIMIZER_SKIP_INDEX=1)
**Fix**: Set CREDIT_OPTIMIZER_SKIP_INDEX=0 in MCP config
**Test Command**:
```javascript
discover_tools_credit-optimizer-mcp({
  query: "github",
  limit: 5
})
```
**Expected**: Returns array of GitHub-related tools

### **Free Agent MCP Issues**
**Symptom**: "Ollama started but not ready within 30 seconds"
**Cause**: WSL configuration issue preventing bash execution
**Fix Options**:
1. **Manual Ollama Start**: Run `C:\Users\chris\AppData\Local\Programs\Ollama\ollama.exe serve`
2. **PowerShell Script**: Use `start-ollama-hidden.ps1`
3. **Check Running**: `Get-Process -Name "ollama"`
**Test Command**: HTTP request to `http://localhost:11434/api/tags`
**Expected**: Returns list of available models

### **Package Publishing Issues**
**Symptom**: npm publish fails or packages not found
**Cause**: Scope or access issues
**Fix**: Always use `npm publish --access public`
**Verification**: Check https://www.npmjs.com/package/@robinsonai/[package-name]

### **Augment Code Connection Issues**
**Symptom**: MCP servers not connecting after restart
**Cause**: Configuration not updated or cached
**Fix**:
1. Clear VS Code cache
2. Restart VS Code completely
3. Check settings.json syntax
4. Verify package versions match published versions

---

## 📊 **EXPECTED PERFORMANCE AFTER FIXES**

### **Cost Savings**
- **Before**: All work done by Augment (13,000 credits per task)
- **After**:
  - Simple tasks: FREE Agent (0 credits)
  - Complex tasks: PAID Agent (500-2,000 credits)
  - **Savings**: 85-100% cost reduction

### **Capabilities Unlocked**
- **906+ Integration Tools**: GitHub, Vercel, Neon, Upstash, Google Workspace
- **0-Credit Operations**: Code generation, analysis, refactoring via Ollama
- **Smart Tool Discovery**: Find tools without AI credits
- **Autonomous Workflows**: Multi-step operations without confirmation
- **24 Thinking Frameworks**: Advanced planning and decision-making

### **Performance Metrics**
- **Tool Discovery**: Instant (0 credits)
- **Simple Code Gen**: 2-5 seconds (0 credits)
- **Complex Code Gen**: 10-30 seconds (500-2,000 credits)
- **Integration Tasks**: 1-3 seconds (100 credits)

---

## 🎯 **POST-FIX VALIDATION CHECKLIST**

### **Server Connectivity** ✅
- [ ] Paid Agent MCP connects
- [ ] Thinking Tools MCP connects
- [ ] Robinson's Toolkit MCP connects
- [ ] Free Agent MCP connects
- [ ] Credit Optimizer MCP connects

### **Core Functionality** ✅
- [ ] toolkit_call executes GitHub tools
- [ ] discover_tools returns results
- [ ] Free Agent generates code (0 credits)
- [ ] Paid Agent handles complex tasks
- [ ] Thinking tools provide analysis

### **Integration Tests** ✅
- [ ] Create GitHub repo via toolkit
- [ ] Deploy to Vercel via toolkit
- [ ] Query database via Neon tools
- [ ] Send email via Google Workspace
- [ ] Generate code via Free Agent

### **Cost Optimization** ✅
- [ ] Simple tasks use 0 credits
- [ ] Complex tasks use PAID agent (not Augment)
- [ ] Tool discovery uses 0 credits
- [ ] Workflow execution minimizes confirmations

**SUCCESS**: All checkboxes ✅ = System fully operational with maximum cost savings!

---

## 🚀 **QUICK START COMMANDS (Copy & Paste)**

### **Phase 1: Fix & Rebuild Critical Packages**
```bash
# Fix Robinson's Toolkit (broker pattern already fixed)
cd packages/robinsons-toolkit-mcp
npm run build
npm version patch
npm publish --access public

# Fix Credit Optimizer (enable indexing)
cd ../credit-optimizer-mcp
# First update the config to set CREDIT_OPTIMIZER_SKIP_INDEX=0
npm run build
npm version patch
npm publish --access public

# Rebuild Free Agent
cd ../free-agent-mcp
npm run build
npm version patch
npm publish --access public
```

### **Phase 2: Start Ollama (for Free Agent)**
```powershell
# Check if Ollama is running
Get-Process -Name "ollama" -ErrorAction SilentlyContinue

# If not running, start it
C:\Users\chris\AppData\Local\Programs\Ollama\ollama.exe serve

# Or use the PowerShell script
powershell -ExecutionPolicy Bypass -File "start-ollama-hidden.ps1"

# Verify it's working
Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get
```

### **Phase 3: Update MCP Configuration**
```bash
# Generate new config with latest package versions
node tools/generate-augment-mcp-import.mjs

# Manual config update needed:
# 1. Copy generated config to VS Code settings.json
# 2. Ensure CREDIT_OPTIMIZER_SKIP_INDEX=0
# 3. Restart Augment Code extension
```

### **Phase 4: Test Everything**
```bash
# Run comprehensive test
node test-5-servers.mjs

# Or test individual servers
node test-mcp-servers.mjs
```

---

## 📋 **CONFIGURATION TEMPLATE (Ready to Use)**

```json
{
  "augment.mcpServers": {
    "free-agent-mcp": {
      "command": "npx",
      "args": ["@robinsonai/free-agent-mcp"],
      "env": {
        "OLLAMA_BASE_URL": "http://127.0.0.1:11434",
        "MAX_OLLAMA_CONCURRENCY": "15",
        "AGENT_STATS_DB": "agent-stats.db"
      }
    },
    "paid-agent-mcp": {
      "command": "npx",
      "args": ["@robinsonai/paid-agent-mcp"],
      "env": {
        "OPENAI_API_KEY": "your-openai-key",
        "ANTHROPIC_API_KEY": "your-anthropic-key",
        "MAX_WORKER_CONCURRENCY": "15",
        "MONTHLY_BUDGET_USD": "25",
        "WORKER_STATS_DB": "worker-stats.db"
      }
    },
    "robinsons-toolkit-mcp": {
      "command": "npx",
      "args": ["@robinsonai/robinsons-toolkit-mcp"],
      "env": {
        "GITHUB_TOKEN": "your-github-token",
        "VERCEL_TOKEN": "your-vercel-token",
        "NEON_API_KEY": "your-neon-key",
        "UPSTASH_REDIS_REST_URL": "your-upstash-url",
        "UPSTASH_REDIS_REST_TOKEN": "your-upstash-token",
        "GOOGLE_SERVICE_ACCOUNT_KEY": "your-google-key",
        "GOOGLE_USER_EMAIL": "your-email"
      }
    },
    "thinking-tools-mcp": {
      "command": "npx",
      "args": ["@robinsonai/thinking-tools-mcp"]
    },
    "credit-optimizer-mcp": {
      "command": "npx",
      "args": ["@robinsonai/credit-optimizer-mcp"],
      "env": {
        "CREDIT_OPTIMIZER_SKIP_INDEX": "0"
      }
    }
  }
}
```

---

## ⚡ **EMERGENCY ROLLBACK PLAN**

If fixes cause issues:

1. **Revert to previous package versions**:
```bash
npm install @robinsonai/robinsons-toolkit-mcp@1.0.0
npm install @robinsonai/credit-optimizer-mcp@0.1.0
```

2. **Restore original configuration**:
```json
{
  "credit-optimizer-mcp": {
    "env": {
      "CREDIT_OPTIMIZER_SKIP_INDEX": "1"
    }
  }
}
```

3. **Restart Augment Code**

4. **Test basic functionality**

---

## 🎉 **FINAL RESULT**

After following these instructions, you will have:

✅ **5/5 MCP servers fully operational**
✅ **906+ integration tools available**
✅ **0-credit code generation via Ollama**
✅ **Smart tool discovery (0 credits)**
✅ **85-100% cost savings on AI operations**
✅ **Autonomous workflow execution**
✅ **24 cognitive frameworks for planning**

**Total Setup Time**: 15-30 minutes
**Cost Savings**: $10-50+ per month
**Productivity Boost**: 3-5x faster development

🚀 **Ready to revolutionize your development workflow!**
