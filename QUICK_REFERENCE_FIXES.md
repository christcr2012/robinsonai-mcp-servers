# 🔧 Quick Reference: Remaining Fixes & Enhancements

**Last Updated:** 2025-11-01  
**Current Score:** 88/100 (B+)  
**Target Score:** 100/100 (A+)  

---

## 🚨 CRITICAL (Fix Now)

### **1. Credit Optimizer SQL Query** ⏱️ 30 min

**File:** `packages/credit-optimizer-mcp/src/tool-indexer.ts`

**Find:**
```typescript
const query = `
  SELECT * FROM tools
  WHERE keywords LIKE '%${searchTerm}%'
  OR description LIKE '%${searchTerm}%'
  LIMIT ${limit}
`;
```

**Replace with:**
```typescript
const query = `
  SELECT * FROM tools
  WHERE 
    keywords LIKE '%"' || ? || '"%'
    OR description LIKE '%' || ? || '%'
    OR tool_name LIKE '%' || ? || '%'
  ORDER BY 
    CASE 
      WHEN tool_name LIKE ? THEN 1
      WHEN description LIKE ? THEN 2
      ELSE 3
    END
  LIMIT ?
`;

const results = db.prepare(query).all(
  searchTerm, searchTerm, searchTerm,
  `%${searchTerm}%`, `%${searchTerm}%`,
  limit
);
```

**Then:**
```bash
cd packages/credit-optimizer-mcp
npm run build
npm version patch
npm publish --access public
```

**Update config:**
```json
"Credit Optimizer MCP": {
  "args": ["-y", "@robinson_ai_systems/credit-optimizer-mcp@0.1.6"]
}
```

**Test:**
```javascript
discover_tools({ query: "github create" })
// Should return: github_create_repo, github_create_issue, etc.
```

---

## ⚠️ HIGH PRIORITY (Fix Soon)

### **2. Robinson's Toolkit Discovery** ⏱️ 45 min

**File:** `packages/robinsons-toolkit-mcp/src/index.ts`

**Option 1 (Quick):**
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'toolkit_discover') {
    const { query, limit = 10 } = request.params.arguments as any;
    
    const allTools = [
      ...githubTools.map(t => ({ ...t, category: 'github' })),
      ...vercelTools.map(t => ({ ...t, category: 'vercel' })),
      ...neonTools.map(t => ({ ...t, category: 'neon' })),
      ...upstashTools.map(t => ({ ...t, category: 'upstash' })),
      ...googleTools.map(t => ({ ...t, category: 'google' }))
    ];
    
    const results = allTools.filter(tool => 
      tool.name.toLowerCase().includes(query.toLowerCase()) ||
      tool.description?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, limit);
    
    return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
  }
});
```

**Option 2 (Better - after fixing Credit Optimizer):**
- Redirect `toolkit_discover` to Credit Optimizer's `discover_tools`

---

### **3. Update Ollama Model Config** ⏱️ 5 min

**File:** `augment-mcp-config.json`

**Current:**
```json
{
  "FAST_MODEL": "qwen2.5:3b",
  "MEDIUM_MODEL": "codellama:34b",  // ❌ Not installed
  "COMPLEX_MODEL": "deepseek-coder:33b"  // ❌ Not installed
}
```

**Fixed:**
```json
{
  "FAST_MODEL": "qwen2.5:3b",
  "MEDIUM_MODEL": "qwen2.5-coder:7b",
  "COMPLEX_MODEL": "qwen2.5-coder:7b"
}
```

---

## 📊 MEDIUM PRIORITY (Enhance)

### **4. Improve Thinking Tools Context** ⏱️ 15 min

**When calling thinking tools, pass detailed context:**

```typescript
const context = `
Robinson AI MCP Architecture:
- 5 servers: Free Agent (Ollama), Paid Agent (OpenAI), Robinson's Toolkit (906 tools), Thinking Tools (24 frameworks), Credit Optimizer
- Goal: Reduce Augment Code credit usage by 70-85%
- Current status: 88/100 score, 52,000 credits saved
- Budget: $25/month for Paid Agent
- Models: qwen2.5-coder:7b, deepseek-coder:1.3b
- Issues: Credit Optimizer discovery broken (SQL query)
`;

swot_analysis({
  subject: "Current Robinson AI MCP 5-server architecture",
  context: context,
  perspective: "technical"
});
```

---

### **5. Add Cost Alerts** ⏱️ 30 min

**File:** `packages/paid-agent-mcp/src/index.ts`

**Add:**
```typescript
const alertsSent = new Set<string>();

async function checkBudgetAlerts(spent: number, limit: number) {
  const percentage = (spent / limit) * 100;
  
  if (percentage >= 80 && !alertsSent.has('80%')) {
    console.error('⚠️ WARNING: 80% of monthly budget used!');
    console.error(`Spent: $${spent.toFixed(4)} / $${limit}`);
    alertsSent.add('80%');
  } else if (percentage >= 50 && !alertsSent.has('50%')) {
    console.error('⚠️ NOTICE: 50% of monthly budget used.');
    console.error(`Spent: $${spent.toFixed(4)} / $${limit}`);
    alertsSent.add('50%');
  }
}

// Call after each request
await checkBudgetAlerts(totalSpent, monthlyBudget);
```

---

### **6. Add Fuzzy Search** ⏱️ 1 hour

**File:** `packages/credit-optimizer-mcp/package.json`

**Add dependency:**
```json
{
  "dependencies": {
    "fuse.js": "^7.0.0"
  }
}
```

**File:** `packages/credit-optimizer-mcp/src/tool-indexer.ts`

**Add:**
```typescript
import Fuse from 'fuse.js';

export async function discoverToolsFuzzy(query: string, limit: number = 10) {
  const allTools = db.prepare('SELECT * FROM tools').all();
  
  const fuse = new Fuse(allTools, {
    keys: ['tool_name', 'description', 'keywords'],
    threshold: 0.3,
    includeScore: true
  });
  
  const results = fuse.search(query).slice(0, limit);
  
  return results.map(r => ({
    ...r.item,
    score: r.score,
    suggestion: r.score > 0.5 ? `Did you mean "${r.item.tool_name}"?` : null
  }));
}
```

---

## 🎯 LOW PRIORITY (Nice to Have)

### **7. Health Dashboard** ⏱️ 2 hours

**Create new tool in Credit Optimizer:**

```typescript
{
  name: 'get_system_health',
  description: 'Get comprehensive system health dashboard',
  inputSchema: { type: 'object', properties: {} },
  handler: async () => {
    const freeAgentHealth = await fetch('http://localhost:11434/api/tags').then(r => r.ok);
    const paidAgentStats = await getPaidAgentStats();
    const toolkitHealth = await getToolkitHealth();
    
    return {
      timestamp: new Date().toISOString(),
      servers: {
        freeAgent: {
          status: freeAgentHealth ? 'healthy' : 'down',
          models: await getOllamaModels(),
          concurrency: await getConcurrency()
        },
        paidAgent: {
          status: 'healthy',
          budget: paidAgentStats.budget,
          workers: paidAgentStats.workers
        },
        robinsonsToolkit: {
          status: toolkitHealth.status,
          tools: toolkitHealth.totalTools,
          categories: toolkitHealth.categories
        }
      },
      performance: {
        avgResponseTime: calculateAvgResponseTime(),
        successRate: calculateSuccessRate(),
        totalRequests: getTotalRequests()
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

---

### **8. Model Selection Hints** ⏱️ 1 hour

**File:** `packages/paid-agent-mcp/src/index.ts`

**Add:**
```typescript
function suggestModel(task: string, complexity: string, maxCost: number) {
  // Analyze task
  const taskLength = task.length;
  const hasCodeKeywords = /code|function|class|implement/i.test(task);
  const hasComplexKeywords = /algorithm|optimize|refactor|architecture/i.test(task);
  
  // Suggest model
  if (complexity === 'simple' && maxCost >= 0.0001) {
    return {
      model: 'mini-worker',
      reason: 'Simple task, low cost',
      estimatedCost: 0.0001
    };
  } else if (complexity === 'medium' && maxCost >= 0.001) {
    return {
      model: 'balanced-worker',
      reason: 'Medium complexity, good balance',
      estimatedCost: 0.001
    };
  } else if (complexity === 'complex' && maxCost >= 0.01) {
    return {
      model: 'premium-worker',
      reason: 'Complex task, best quality',
      estimatedCost: 0.01
    };
  } else {
    return {
      model: 'FREE (Ollama)',
      reason: 'Try FREE agent first (0 cost)',
      estimatedCost: 0
    };
  }
}

// Use before running job
const suggestion = suggestModel(task, complexity, maxCost);
console.log(`💡 Suggested model: ${suggestion.model} (${suggestion.reason})`);
```

---

### **9. Improve Ollama Startup** ⏱️ 1 hour

**File:** `packages/free-agent-mcp/src/ollama-client.ts`

**Replace `startOllama()` with:**
```typescript
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
    throw new Error(`Ollama not found at ${ollamaPath}. Please install Ollama from https://ollama.ai`);
  }
  
  // 3. Check if port is in use
  const portInUse = await this.checkPort(11434);
  if (portInUse) {
    throw new Error('Port 11434 is in use but Ollama not responding. Check for port conflicts.');
  }
  
  // 4. Start Ollama if auto-start enabled
  if (this.autoStart) {
    await this.startOllama();
  } else {
    throw new Error('Ollama not running and auto-start disabled. Please start Ollama manually.');
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

---

## 📊 PRIORITY MATRIX

| Fix/Enhancement | Priority | Time | Impact | Difficulty |
|----------------|----------|------|--------|------------|
| Credit Optimizer SQL | 🚨 CRITICAL | 30m | HIGH | Easy |
| Toolkit Discovery | ⚠️ HIGH | 45m | MEDIUM | Medium |
| Model Config | ⚠️ HIGH | 5m | LOW | Easy |
| Thinking Tools Context | 📊 MEDIUM | 15m | MEDIUM | Easy |
| Cost Alerts | 📊 MEDIUM | 30m | MEDIUM | Easy |
| Fuzzy Search | 📊 MEDIUM | 1h | MEDIUM | Medium |
| Health Dashboard | 🎯 LOW | 2h | LOW | Medium |
| Model Selection | 🎯 LOW | 1h | LOW | Easy |
| Ollama Startup | 🎯 LOW | 1h | LOW | Medium |

---

## ✅ QUICK CHECKLIST

**Phase 1: Critical (1 hour)**
- [ ] Fix Credit Optimizer SQL query
- [ ] Update model config
- [ ] Test all fixes

**Phase 2: High Priority (1.5 hours)**
- [ ] Fix Toolkit discovery
- [ ] Test all enhancements

**Phase 3: Medium Priority (2.5 hours)**
- [ ] Improve Thinking Tools context
- [ ] Add cost alerts
- [ ] Add fuzzy search

**Phase 4: Low Priority (4 hours)**
- [ ] Health dashboard
- [ ] Model selection hints
- [ ] Improve Ollama startup

---

## 🎯 EXPECTED OUTCOMES

| Phase | Score | Grade | Time |
|-------|-------|-------|------|
| Current | 88/100 | B+ | - |
| After Phase 1 | 95/100 | A | 1h |
| After Phase 2 | 98/100 | A+ | 2.5h |
| After Phase 3 | 99/100 | A+ | 5h |
| After Phase 4 | 100/100 | A+ | 9h |

---

**Start with Phase 1 (1 hour) to get to 95/100!** 🚀

