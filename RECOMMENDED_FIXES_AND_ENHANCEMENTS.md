# 🔧 Recommended Fixes and Enhancements

**Date:** 2025-11-01  
**Priority:** CRITICAL → HIGH → MEDIUM → LOW  
**Estimated Time:** 4-6 hours total  

---

## 🚨 CRITICAL FIXES (Do First)

### **Fix #1: Free Agent Base URL Mismatch** ⏱️ 5 minutes

**Problem:**
- Config has: `http://localhost:11434/v1`
- Ollama expects: `http://localhost:11434`
- `pingOllama()` fails because `/v1` endpoint doesn't exist

**Solution:**
```json
// augment-mcp-config.json
{
  "Free Agent MCP": {
    "env": {
      "OLLAMA_BASE_URL": "http://localhost:11434",  // ← Remove /v1
      "OLLAMA_START_TIMEOUT": "120"  // ← Increase timeout
    }
  }
}
```

**Expected Outcome:**
- ✅ Auto-start detection works
- ✅ Code generation works
- ✅ 0 credits for all tasks

**Testing:**
```bash
# After fix, test:
curl http://localhost:11434/api/tags  # Should work
```

---

### **Fix #2: Credit Optimizer Search Query** ⏱️ 30 minutes

**Problem:**
- `discover_tools` returns empty for all queries
- Keywords stored as JSON: `"[\"github\",\"create\",\"repo\"]"`
- SQL LIKE query doesn't match JSON format

**Current Code (Broken):**
```typescript
// packages/credit-optimizer-mcp/src/tool-indexer.ts
const query = `
  SELECT * FROM tools
  WHERE keywords LIKE '%${searchTerm}%'
  OR description LIKE '%${searchTerm}%'
  LIMIT ${limit}
`;
```

**Fixed Code:**
```typescript
// packages/credit-optimizer-mcp/src/tool-indexer.ts
const query = `
  SELECT * FROM tools
  WHERE 
    -- Match JSON keywords (e.g., ["github","create"])
    keywords LIKE '%"' || ? || '"%'
    -- Match description
    OR description LIKE '%' || ? || '%'
    -- Match tool name
    OR tool_name LIKE '%' || ? || '%'
  ORDER BY 
    -- Prioritize exact matches
    CASE 
      WHEN tool_name LIKE ? THEN 1
      WHEN description LIKE ? THEN 2
      ELSE 3
    END
  LIMIT ?
`;

// Use parameterized query to prevent SQL injection
const results = db.prepare(query).all(
  searchTerm, searchTerm, searchTerm,
  `%${searchTerm}%`, `%${searchTerm}%`,
  limit
);
```

**Expected Outcome:**
- ✅ `discover_tools({ query: "github" })` returns GitHub tools
- ✅ `discover_tools({ query: "deploy" })` returns Vercel tools
- ✅ Search works across all 906 tools

**Testing:**
```javascript
discover_tools({ query: "github create", limit: 5 })
// Should return: github_create_repo, github_create_issue, etc.

discover_tools({ query: "vercel deploy", limit: 5 })
// Should return: vercel_create_deployment, etc.
```

---

### **Fix #3: Pull Missing Ollama Models** ⏱️ 15 minutes

**Problem:**
- Config expects: `deepseek-coder:33b`, `codellama:34b`
- Available: `deepseek-coder:1.3b`, `qwen2.5:3b`, `qwen2.5-coder:7b`

**Solution:**
```bash
# Pull missing models
ollama pull deepseek-coder:33b  # ~18GB, 10-15 min
ollama pull codellama:34b       # ~19GB, 10-15 min

# Or update config to use available models
```

**Alternative (Faster):**
```json
// augment-mcp-config.json
{
  "Free Agent MCP": {
    "env": {
      "DEFAULT_OLLAMA_MODEL": "qwen2.5-coder:7b",  // ← Use available model
      "FAST_MODEL": "qwen2.5:3b",
      "MEDIUM_MODEL": "qwen2.5-coder:7b",
      "COMPLEX_MODEL": "qwen2.5-coder:7b"  // ← Use 7b instead of 33b
    }
  }
}
```

**Expected Outcome:**
- ✅ Models available for all complexity levels
- ✅ Code generation works

---

## ⚠️ HIGH PRIORITY FIXES (Do Next)

### **Fix #4: Robinson's Toolkit Discovery** ⏱️ 45 minutes

**Problem:**
- `toolkit_discover` returns empty array
- Broker pattern doesn't implement search

**Solution Option 1 (Quick):**
```typescript
// packages/robinsons-toolkit-mcp/src/index.ts
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'toolkit_discover') {
    const { query, limit = 10 } = request.params.arguments as any;
    
    // Delegate to Credit Optimizer's discover_tools
    // Or implement local search:
    const allTools = [
      ...githubTools.map(t => ({ ...t, category: 'github' })),
      ...vercelTools.map(t => ({ ...t, category: 'vercel' })),
      ...neonTools.map(t => ({ ...t, category: 'neon' })),
      ...upstashTools.map(t => ({ ...t, category: 'upstash' })),
      ...googleTools.map(t => ({ ...t, category: 'google' })),
      ...openaiTools.map(t => ({ ...t, category: 'openai' }))
    ];
    
    const results = allTools.filter(tool => 
      tool.name.toLowerCase().includes(query.toLowerCase()) ||
      tool.description?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, limit);
    
    return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
  }
  // ... rest of handler
});
```

**Solution Option 2 (Better):**
- Use Credit Optimizer's static index
- Copy `tools-index.json` to Robinson's Toolkit
- Implement same search logic

**Expected Outcome:**
- ✅ `toolkit_discover({ query: "github" })` returns results
- ✅ Consistent discovery across servers

---

### **Fix #5: Improve Ollama Startup Logic** ⏱️ 1 hour

**Problem:**
- Auto-start still times out even with fixes
- No retry logic for transient failures
- No health check before spawning

**Enhanced Solution:**
```typescript
// packages/free-agent-mcp/src/ollama-client.ts
private async ensureRunning(): Promise<void> {
  // 1. Check if already running (multiple attempts)
  for (let i = 0; i < 3; i++) {
    const isRunning = await this.pingOllama(5000);
    if (isRunning) {
      console.error('✅ Ollama is already running!');
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 2. Check if Ollama is installed
  const ollamaPath = this.getOllamaPath();
  if (!fs.existsSync(ollamaPath)) {
    throw new Error(`Ollama not found at ${ollamaPath}. Please install Ollama.`);
  }
  
  // 3. Check if port is in use
  const portInUse = await this.checkPort(11434);
  if (portInUse) {
    throw new Error('Port 11434 is in use but Ollama not responding. Check for conflicts.');
  }
  
  // 4. Start Ollama if auto-start enabled
  if (this.autoStart) {
    await this.startOllama();
  } else {
    throw new Error('Ollama not running and auto-start disabled.');
  }
}

private async checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(true));  // Port in use
    server.once('listening', () => {
      server.close();
      resolve(false);  // Port available
    });
    server.listen(port);
  });
}
```

**Expected Outcome:**
- ✅ Better error messages
- ✅ Detect port conflicts
- ✅ Retry logic for transient failures

---

## 📊 MEDIUM PRIORITY ENHANCEMENTS (Do Later)

### **Enhancement #1: Add Cost Alerts** ⏱️ 30 minutes

**Feature:**
- Alert when 50% of monthly budget used
- Alert when 80% of monthly budget used
- Alert when approaching rate limits

**Implementation:**
```typescript
// packages/paid-agent-mcp/src/index.ts
async function checkBudgetAlerts(spent: number, limit: number) {
  const percentage = (spent / limit) * 100;
  
  if (percentage >= 80 && !alertsSent.has('80%')) {
    console.error('⚠️ WARNING: 80% of monthly budget used!');
    alertsSent.add('80%');
  } else if (percentage >= 50 && !alertsSent.has('50%')) {
    console.error('⚠️ NOTICE: 50% of monthly budget used.');
    alertsSent.add('50%');
  }
}
```

**Benefit:**
- Prevent overspending
- Better budget management

---

### **Enhancement #2: Improve Thinking Tools Context** ⏱️ 45 minutes

**Problem:**
- Responses are generic
- Not specific to Robinson AI architecture

**Solution:**
```typescript
// When calling thinking tools, pass detailed context:
const context = `
Robinson AI MCP Architecture:
- 5 servers: Free Agent (Ollama), Paid Agent (OpenAI), Robinson's Toolkit (906 tools), Thinking Tools (24 frameworks), Credit Optimizer
- Goal: Reduce Augment Code credit usage by 70-85%
- Current issues: Free Agent timeout, Credit Optimizer search broken
- Budget: $25/month for Paid Agent
- Models: qwen2.5-coder:7b, deepseek-coder:1.3b
`;

swot_analysis({
  subject: "Current Robinson AI MCP 5-server architecture",
  context: context,
  perspective: "technical"
});
```

**Benefit:**
- More actionable insights
- Better decision-making

---

### **Enhancement #3: Add Fuzzy Search** ⏱️ 1 hour

**Feature:**
- Support typos: "githb" → "github"
- Support partial matches: "cre repo" → "create_repo"
- Suggest corrections: "Did you mean 'github'?"

**Implementation:**
```typescript
// packages/credit-optimizer-mcp/src/tool-indexer.ts
import Fuse from 'fuse.js';

const fuse = new Fuse(allTools, {
  keys: ['tool_name', 'description', 'keywords'],
  threshold: 0.3,  // 0 = exact, 1 = match anything
  includeScore: true
});

const results = fuse.search(query).slice(0, limit);
```

**Benefit:**
- Better UX
- More forgiving search

---

## 🎯 LOW PRIORITY ENHANCEMENTS (Nice to Have)

### **Enhancement #4: Health Dashboard** ⏱️ 2 hours

**Feature:**
- Real-time server status
- Performance metrics
- Cost tracking
- Error logs

**Implementation:**
```typescript
// Create new tool: get_system_health
{
  name: 'get_system_health',
  description: 'Get comprehensive system health dashboard',
  inputSchema: { type: 'object', properties: {} },
  handler: async () => {
    return {
      servers: {
        freeAgent: await checkFreeAgentHealth(),
        paidAgent: await checkPaidAgentHealth(),
        robinsonsToolkit: await checkToolkitHealth(),
        thinkingTools: await checkThinkingToolsHealth(),
        creditOptimizer: await checkOptimizerHealth()
      },
      performance: {
        avgResponseTime: calculateAvgResponseTime(),
        successRate: calculateSuccessRate()
      },
      costs: {
        spent: getTotalSpent(),
        saved: getTotalSaved(),
        roi: calculateROI()
      }
    };
  }
}
```

**Benefit:**
- Single pane of glass
- Easy monitoring

---

### **Enhancement #5: Model Selection Hints** ⏱️ 1 hour

**Feature:**
- Suggest best model for task
- Optimize cost/quality tradeoff

**Implementation:**
```typescript
// packages/paid-agent-mcp/src/index.ts
function suggestModel(task: string, complexity: string, maxCost: number) {
  if (complexity === 'simple' && maxCost >= 0.0001) {
    return 'mini-worker';  // Cheapest
  } else if (complexity === 'medium' && maxCost >= 0.001) {
    return 'balanced-worker';  // Good balance
  } else if (complexity === 'complex' && maxCost >= 0.01) {
    return 'premium-worker';  // Best quality
  } else {
    return 'Try FREE agent first (0 cost)';
  }
}
```

**Benefit:**
- Optimize cost
- Better quality

---

## 📋 Implementation Plan

### **Phase 1: Critical Fixes** (1 hour)
1. ✅ Fix Free Agent base URL (5 min)
2. ✅ Fix Credit Optimizer search (30 min)
3. ✅ Pull Ollama models OR update config (15 min)
4. ✅ Test all fixes (10 min)

### **Phase 2: High Priority** (2 hours)
5. ✅ Fix Robinson's Toolkit discovery (45 min)
6. ✅ Improve Ollama startup logic (1 hour)
7. ✅ Test all enhancements (15 min)

### **Phase 3: Medium Priority** (2 hours)
8. ✅ Add cost alerts (30 min)
9. ✅ Improve thinking tools context (45 min)
10. ✅ Add fuzzy search (1 hour)

### **Phase 4: Low Priority** (3 hours)
11. ✅ Health dashboard (2 hours)
12. ✅ Model selection hints (1 hour)

**Total Time:** 8 hours (can be done in 2 days)

---

## ✅ Success Metrics

After all fixes:
- [ ] Free Agent: 100% success rate
- [ ] Credit Optimizer: 100% discovery success
- [ ] Robinson's Toolkit: 100% discovery success
- [ ] All servers: < 5s response time
- [ ] Cost tracking: 100% accurate
- [ ] Overall score: 95%+

---

## 🚀 Quick Start

**To fix immediately:**

1. **Update config:**
```bash
# Edit augment-mcp-config.json
"OLLAMA_BASE_URL": "http://localhost:11434"  # Remove /v1
"OLLAMA_START_TIMEOUT": "120"
"DEFAULT_OLLAMA_MODEL": "qwen2.5-coder:7b"
```

2. **Fix Credit Optimizer:**
```bash
cd packages/credit-optimizer-mcp
# Edit src/tool-indexer.ts (see Fix #2 above)
npm run build
npm version patch
npm publish --access public
```

3. **Update config to use new version:**
```json
"Credit Optimizer MCP": {
  "args": ["-y", "@robinson_ai_systems/credit-optimizer-mcp@0.1.6"]
}
```

4. **Restart Augment**

5. **Test:**
```javascript
// Should work now:
delegate_code_generation_free-agent-mcp({ task: "hello world", context: "TypeScript" })
discover_tools({ query: "github create" })
toolkit_discover({ query: "vercel deploy" })
```

---

**Ready to implement? Let me know which fixes to start with!**

