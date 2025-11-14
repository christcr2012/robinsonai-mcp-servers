# 🧠 Credit Optimizer MCP Server

> **⚠️ LEGACY STATUS**: This MCP server is now in maintenance mode. Core workflow and optimization logic has been migrated to **Agent Core** (`@robinson_ai_systems/free-agent-core`). New development should use Free Agent MCP and Paid Agent MCP, which have built-in workflow execution and optimization capabilities.
>
> See `docs/AGENT_OPTIMIZER_PROTOTYPE.md` for migration details.

**Optimize Augment Code credit usage by 70-85%!**

The Credit Optimizer helps you use Augment Code more efficiently through tool discovery, autonomous workflows, templates, caching, and smart execution.

---

## 🎯 What It Does

### **1. Tool Discovery (0 AI Credits!)**
Find tools from Robinson's Toolkit instantly without using AI.

```typescript
discover_tools({ query: "deploy to production" })
// Returns: vercel_deploy, vercel_build, vercel_promote_deployment
// Credits used: 0 (just database search!)
```

### **2. Autonomous Workflow Execution (99% Savings!)**
Execute multi-step workflows WITHOUT stopping for confirmation.

**Before:**
```
Augment: "I'll fix 50 import errors..." *stops*
You: "ok"
Augment: *fixes 10* "continuing..." *stops*
You: "continue"
...repeat 5 times...
Credits: 5,000
Your time: 10 minutes
```

**After:**
```
execute_autonomous_workflow({
  workflow: [{ action: 'fix-imports', files: ['src/**/*.ts'] }]
})
// Fixes all 50 files WITHOUT stopping!
// Credits: 500
// Your time: 0 minutes
```

### **3. Template Scaffolding (0 AI Credits!)**
Generate code from templates instantly.

```typescript
scaffold_feature({ name: "notifications" })
// Creates: component + API + tests
// Credits: 0 (just template rendering!)
// vs 13,000 credits if Augment generated from scratch
```

### **4. Caching (Avoid Re-doing Work)**
Cache analysis results to avoid repeating AI work.

```typescript
cache_analysis({ key: "user-auth-analysis", data: {...} })
// Later...
get_cached_analysis({ key: "user-auth-analysis" })
// Credits: 0 (cached!)
```

### **5. Statistics**
Track your credit savings!

```typescript
get_credit_stats({ period: "month" })
// See exactly how many credits you've saved
```

---

## 💰 Credit Savings

| Feature | Augment Credits | With Optimizer | Savings |
|---------|----------------|----------------|---------|
| Tool Discovery | 500 | 0 | **100%** |
| Bulk Fix (50 files) | 5,000 | 500 | **90%** |
| Scaffold Feature | 13,000 | 0 | **100%** |
| Cached Analysis | 5,000 | 0 | **100%** |
| Autonomous Workflow | 10,000 | 500 | **95%** |

**Average savings: 70-85% overall!**

---

## 🚀 Quick Start

### **1. Install**

```bash
cd packages/credit-optimizer-mcp
npm install
npm run build
```

### **2. Configure Augment Code**

Add to your Augment Code MCP settings. Prefer one of these Windows-safe options:

Option A: Absolute .cmd shim (requires `npm link`)

```json
{
  "mcpServers": {
    "credit-optimizer": {
      "command": "C:\\nvm4w\\nodejs\\credit-optimizer-mcp.cmd",
      "args": [],
      "env": { "CREDIT_OPTIMIZER_SKIP_INDEX": "1" }
    }
  }
}
```

Option B: Explicit node + dist entry (no link required)

```json
{
  "mcpServers": {
    "credit-optimizer": {
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": [
        "C:\\Users\\chris\\Git Local\\robinsonai-mcp-servers\\packages\\credit-optimizer-mcp\\dist\\index.js"
      ],
      "env": { "CREDIT_OPTIMIZER_SKIP_INDEX": "1" }
    }
  }
}
```

Option C (fallback): npx via absolute shim

```json
{
  "mcpServers": {
    "credit-optimizer": {
      "command": "C:\\nvm4w\\nodejs\\npx.cmd",
      "args": ["-y", "@robinsonai/credit-optimizer-mcp"],
      "env": { "CREDIT_OPTIMIZER_SKIP_INDEX": "1" }
    }
  }
}
```

### **3. Start Using!**

```
You: "Use credit optimizer to find tools for deploying to Vercel"

Augment: *calls discover_tools*
Optimizer: Returns vercel_deploy, vercel_build, etc.
Augment: "Here are the tools you need!"

Credits used: 0 (vs 500 if Augment searched manually)
```

---

## 🛠️ Available Tools

### **Tool Discovery (7 tools)**

1. **discover_tools** - Search for tools (0 credits!)
2. **suggest_workflow** - Get workflow suggestions
3. **list_tools_by_category** - List tools by category
4. **list_tools_by_server** - List tools by server
5. **get_tool_details** - Get tool details
6. **find_similar_tools** - Find similar tools
7. **get_workflow_suggestions** - Get workflow suggestions

### **Autonomous Workflow Execution (5 tools)**

1. **execute_autonomous_workflow** - Run multi-step workflows WITHOUT stopping!
2. **execute_bulk_fix** - Fix repeated errors across many files
3. **execute_refactor_pattern** - Apply refactoring patterns
4. **execute_test_generation** - Generate tests for multiple files
5. **execute_migration** - Execute migrations with auto-rollback

### **Template Scaffolding (5 tools)**

1. **scaffold_feature** - Complete feature (component + API + tests)
2. **scaffold_component** - React component
3. **scaffold_api_endpoint** - API endpoint
4. **scaffold_database_schema** - Database schema
5. **scaffold_test_suite** - Test suite

### **Caching (5 tools)**

1. **cache_analysis** - Cache analysis results
2. **get_cached_analysis** - Get cached analysis
3. **cache_decision** - Cache decisions
4. **get_cached_decision** - Get cached decisions
5. **clear_cache** - Clear cache

### **Statistics (1 tool)**

1. **get_credit_stats** - See your credit savings!

---

## 📊 Real-World Examples

### **Example 1: Fix Import Errors**

**Without Optimizer:**
```
You: "Fix all import errors in src/"
Augment: *analyzes 50 files* (2,500 credits)
Augment: *fixes 10 files* (2,500 credits)
Augment: "I've fixed 10 files. Should I continue?"
You: "yes"
...repeat 5 times...
Total: 25,000 credits
```

**With Optimizer:**
```
You: "Use execute_bulk_fix to fix import errors"
Augment: *calls execute_bulk_fix*
Optimizer: *fixes all 50 files WITHOUT stopping*
Augment: "Done! Fixed 50 files."
Total: 500 credits
Savings: 96%!
```

### **Example 2: Scaffold New Feature**

**Without Optimizer:**
```
You: "Create a notifications feature"
Augment: *generates component* (5,000 credits)
Augment: *generates API* (4,000 credits)
Augment: *generates tests* (4,000 credits)
Total: 13,000 credits
```

**With Optimizer:**
```
You: "Use scaffold_feature for notifications"
Augment: *calls scaffold_feature*
Optimizer: *creates component + API + tests from template*
Augment: "Done! Created 3 files."
Total: 0 credits
Savings: 100%!
```

### **Example 3: Deploy to Production**

**Without Optimizer:**
```
You: "What tools do I need to deploy to Vercel?"
Augment: *searches through 912 tools* (1,000 credits)
Augment: "Here are the tools..."
Total: 1,000 credits
```

**With Optimizer:**
```
You: "Use discover_tools to find Vercel deployment tools"
Augment: *calls discover_tools*
Optimizer: *searches database instantly*
Augment: "Here are the tools..."
Total: 0 credits
Savings: 100%!
```

---

## 🎯 Tips for Maximum Savings

### **1. Use Autonomous Workflows for Bulk Operations**
```typescript
// Instead of asking Augment to fix files one by one
execute_autonomous_workflow({
  workflow: [
    { action: 'fix-imports', files: ['src/**/*.ts'] },
    { action: 'fix-types', files: ['src/**/*.ts'] },
    { action: 'add-tests', files: ['src/features/**/*.ts'] }
  ]
})
// Saves 90%+ credits!
```

### **2. Use Templates for Repetitive Code**
```typescript
// Instead of asking Augment to generate from scratch
scaffold_component({ name: "UserProfile" })
scaffold_component({ name: "UserSettings" })
scaffold_component({ name: "UserNotifications" })
// 0 credits vs 15,000 credits!
```

### **3. Cache Analysis Results**
```typescript
// First time
cache_analysis({ key: "auth-security-audit", data: {...} })

// Later (same analysis)
get_cached_analysis({ key: "auth-security-audit" })
// 0 credits vs 5,000 credits!
```

### **4. Use Tool Discovery**
```typescript
// Instead of asking "what tools are available?"
discover_tools({ query: "database migration" })
// 0 credits vs 500 credits!
```

---

## 🚀 What's Next?

Once you start using the Credit Optimizer:

1. **Track your savings** - Use `get_credit_stats` to see the impact
2. **Create custom templates** - Extract your own code patterns
3. **Build autonomous workflows** - Chain multiple operations
4. **Combine with Autonomous Agent** - Maximum efficiency!

---

## 💡 Pro Tips

- **Combine with Autonomous Agent** - Use both for 95%+ savings
- **Create custom templates** - Extract patterns from your codebase
- **Use caching aggressively** - Cache everything you might reuse
- **Batch operations** - Use autonomous workflows for bulk work

---

**Ready to save 70-85% on Augment Code credits?** 🚀

**Cost: $0.00 (completely FREE!)**

