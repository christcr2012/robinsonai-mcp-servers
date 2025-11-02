# MCP Servers Troubleshooting Guide

## 🚨 Problem: MCP Servers Show No Tools Available

This guide will help you fix the issue where Augment Code shows no MCP tools available.

## 🔍 Root Cause Analysis

Based on the diagnostic information, the main issues are:

1. **WSL Configuration Problem**: The system is trying to use WSL but it's not properly configured
2. **MCP Server Installation**: Servers may not be properly installed globally
3. **Augment Configuration**: Incorrect or missing MCP server configuration in VS Code settings
4. **Command Path Issues**: Different configuration files using different command approaches

## 🛠️ Complete Solution

### Step 1: Run the Fix Script

Choose one of these options:

**Option A: PowerShell Script (Recommended)**
```powershell
.\Fix-MCP-Servers.ps1
```

**Option B: Batch File**
```cmd
.\FIX_MCP_SERVERS_COMPLETE.bat
```

### Step 2: Verify Installation

After running the fix script, test the installation:

```powershell
.\Test-MCP-Servers.ps1
```

### Step 3: Manual Verification

If the scripts don't work, manually verify:

1. **Check Global Installation**:
   ```cmd
   npm list -g @robinsonai/free-agent-mcp
   npm list -g @robinsonai/paid-agent-mcp
   npm list -g @robinsonai/robinsons-toolkit-mcp
   npm list -g @robinsonai/thinking-tools-mcp
   npm list -g @robinsonai/credit-optimizer-mcp
   npm list -g @robinsonai/openai-mcp
   ```

2. **Test Server Commands**:
   ```cmd
   npx @robinsonai/free-agent-mcp --help
   npx @robinsonai/paid-agent-mcp --help
   ```

3. **Check Ollama**:
   ```cmd
   curl http://127.0.0.1:11434/api/tags
   ```

### Step 4: Configure Augment Code

The fix script should automatically configure Augment Code, but if needed, manually add this to your VS Code settings.json:

**Location**: `%APPDATA%\Code\User\settings.json`

**Configuration**:
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
        "NEON_API_KEY": "your-neon-key"
      }
    },
    "thinking-tools-mcp": {
      "command": "npx",
      "args": ["@robinsonai/thinking-tools-mcp"],
      "env": {}
    },
    "credit-optimizer-mcp": {
      "command": "npx",
      "args": ["@robinsonai/credit-optimizer-mcp"],
      "env": {
        "AUGMENT_CREDITS_PER_MONTH": "208000",
        "AUGMENT_COST_PER_MONTH": "100",
        "OPTIMIZER_DB": "optimizer-stats.db"
      }
    },
    "openai-mcp": {
      "command": "npx",
      "args": ["@robinsonai/openai-mcp"],
      "env": {
        "OPENAI_API_KEY": "your-openai-key"
      }
    }
  }
}
```

## 🎯 Expected Results

After fixing, you should see these tools in Augment Code:

### FREE Agent MCP (17 tools - 0 credits!)
- `delegate_code_generation_free-agent-mcp`
- `delegate_code_analysis_free-agent-mcp`
- `delegate_code_refactoring_free-agent-mcp`
- `delegate_test_generation_free-agent-mcp`
- `execute_versatile_task_autonomous-agent-mcp`

### PAID Agent MCP (17 tools - use sparingly)
- `execute_versatile_task_paid-agent-mcp`
- `openai_worker_run_job_paid-agent-mcp`
- `openai_worker_estimate_cost_paid-agent-mcp`

### Robinson's Toolkit MCP (5 broker tools - 906 integrations)
- `toolkit_discover_robinsons-toolkit-mcp`
- `toolkit_list_tools_robinsons-toolkit-mcp`
- `toolkit_get_tool_schema_robinsons-toolkit-mcp`
- `toolkit_call_robinsons-toolkit-mcp`

### Thinking Tools MCP (24 cognitive frameworks)
- `sequential_thinking_thinking-tools-mcp`
- `devils_advocate_thinking-tools-mcp`
- `first_principles_thinking-tools-mcp`
- `swot_analysis_thinking-tools-mcp`

### Credit Optimizer MCP (40+ optimization tools)
- `discover_tools_credit-optimizer-mcp`
- `scaffold_feature_credit-optimizer-mcp`
- `execute_autonomous_workflow_credit-optimizer-mcp`

### OpenAI MCP (200+ direct API tools)
- `openai_chat_completions_openai-mcp`
- `openai_embeddings_openai-mcp`
- `openai_images_generate_openai-mcp`

## 🔧 Common Issues & Solutions

### Issue 1: WSL Error
**Error**: `WSL (8572 - Relay) ERROR: CreateProcessCommon:798: execvpe(/bin/bash) failed`

**Solution**: This is a Windows/WSL configuration issue. The fix scripts use native Windows commands to avoid this problem.

### Issue 2: NPM Permission Errors
**Error**: Permission denied when installing globally

**Solution**: 
```cmd
npm config set prefix %APPDATA%\npm
```

### Issue 3: Ollama Not Running
**Error**: Cannot connect to Ollama

**Solution**:
```cmd
ollama serve
```

### Issue 4: API Keys Missing
**Error**: Authentication errors

**Solution**: Update the API keys in the configuration with your actual keys.

## 📞 Support

If you continue to have issues:

1. Run the test script: `.\Test-MCP-Servers.ps1`
2. Check the output for specific error messages
3. Ensure all prerequisites are installed (Node.js, npm, Ollama)
4. Restart VS Code completely after configuration changes

## 💰 Cost Optimization

Once working, you'll save 96% in costs by using the FREE agent for most tasks:

- **Before**: 13,000 credits per task (you doing it)
- **After**: 0 credits per task (FREE agent doing it)
- **Savings**: $13 per 10 tasks → $0 per 10 tasks
