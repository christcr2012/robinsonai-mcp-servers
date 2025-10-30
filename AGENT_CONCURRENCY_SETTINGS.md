# Agent Concurrency Settings - Configuration Guide

**Date:** 2025-10-30
**Purpose:** Configure agent pool sizes for parallel execution

---

## 🎯 **Current Settings**

### **OpenAI Worker MCP**
- **Current:** `MAX_CONCURRENCY = 10` (hardcoded max)
- **Your Request:** 15 agents
- **Status:** ⚠️ **NEEDS UPDATE** - Currently capped at 10

**Code Location:** `packages/openai-worker-mcp/src/policy.ts`
```typescript
MAX_CONCURRENCY: Math.min(parseInt(process.env.MAX_OPENAI_CONCURRENCY || '10', 10), 10),
//                                                                                  ^^
//                                                                          Hardcoded max: 10
```

### **Autonomous Agent MCP**
- **Current:** `MAX_CONCURRENCY = 5` (hardcoded max)
- **Your Request:** 12 agents
- **Status:** ⚠️ **NEEDS UPDATE** - Currently capped at 5

**Code Location:** `packages/autonomous-agent-mcp/src/index.ts`
```typescript
this.maxConcurrency = parseInt(process.env.MAX_OLLAMA_CONCURRENCY || '1', 10);
if (this.maxConcurrency < 1) this.maxConcurrency = 1;
if (this.maxConcurrency > 5) this.maxConcurrency = 5;  // ← Hardcoded max: 5
```

---

## 🔧 **How to Update**

### **Option 1: Quick Fix (Environment Variables Only)**

**Current Limits:**
- OpenAI Worker: Max 10 agents (even if you set env var higher)
- Autonomous Agent: Max 5 agents (even if you set env var higher)

**To Use Current Limits:**
Add to your `.env.local`:
```bash
# OpenAI Worker (max 10 agents)
MAX_OPENAI_CONCURRENCY=10

# Autonomous Agent (max 5 agents)
MAX_OLLAMA_CONCURRENCY=5
```

**Limitation:** This won't give you 15 and 12 agents - you'll get 10 and 5.

---

### **Option 2: Code Update (Recommended)**

To get **15 OpenAI agents** and **12 Autonomous agents**, we need to update the code:

#### **Step 1: Update OpenAI Worker MCP**

**File:** `packages/openai-worker-mcp/src/policy.ts`

**Change line 13 from:**
```typescript
MAX_CONCURRENCY: Math.min(parseInt(process.env.MAX_OPENAI_CONCURRENCY || '10', 10), 10),
```

**To:**
```typescript
MAX_CONCURRENCY: Math.min(parseInt(process.env.MAX_OPENAI_CONCURRENCY || '10', 10), 20),
```

**Explanation:** Changes hardcoded max from 10 → 20 (allows up to 20 agents)

#### **Step 2: Update Autonomous Agent MCP**

**File:** `packages/autonomous-agent-mcp/src/index.ts`

**Change lines 71-73 from:**
```typescript
this.maxConcurrency = parseInt(process.env.MAX_OLLAMA_CONCURRENCY || '1', 10);
if (this.maxConcurrency < 1) this.maxConcurrency = 1;
if (this.maxConcurrency > 5) this.maxConcurrency = 5;
```

**To:**
```typescript
this.maxConcurrency = parseInt(process.env.MAX_OLLAMA_CONCURRENCY || '1', 10);
if (this.maxConcurrency < 1) this.maxConcurrency = 1;
if (this.maxConcurrency > 15) this.maxConcurrency = 15;
```

**Explanation:** Changes hardcoded max from 5 → 15 (allows up to 15 agents)

#### **Step 3: Update Environment Variables**

Add to `.env.local`:
```bash
# OpenAI Worker - 15 concurrent agents
MAX_OPENAI_CONCURRENCY=15

# Autonomous Agent - 12 concurrent agents
MAX_OLLAMA_CONCURRENCY=12
```

#### **Step 4: Rebuild**

```bash
# Rebuild OpenAI Worker
cd packages/openai-worker-mcp
npm run build

# Rebuild Autonomous Agent
cd ../autonomous-agent-mcp
npm run build

# Return to root
cd ../..
```

---

## ⚠️ **Important Considerations**

### **1. OpenAI Worker (15 agents)**

**Cost Impact:**
- 15 concurrent OpenAI API calls = 15x cost multiplier
- If each agent uses gpt-4o-mini: ~$0.15/1M tokens input, ~$0.60/1M tokens output
- 15 agents running simultaneously could hit rate limits or budget quickly

**Rate Limits:**
- OpenAI has rate limits (requests per minute, tokens per minute)
- 15 concurrent agents may hit these limits
- Consider your OpenAI tier (free, pay-as-you-go, enterprise)

**Budget Protection:**
- Current monthly budget: $25
- With 15 agents, you could burn through this quickly
- Consider increasing `MONTHLY_BUDGET` or adding per-agent limits

**Recommendation:**
- Start with 10 agents (current max)
- Monitor costs and rate limits
- Increase to 15 only if needed

---

### **2. Autonomous Agent (12 agents)**

**Resource Impact:**
- 12 concurrent Ollama instances = 12x RAM/CPU usage
- Each Ollama model (deepseek-coder:33b) uses ~20GB RAM
- 12 agents = ~240GB RAM required!

**Realistic Limits:**
- Most PCs: 2-3 agents max (32-64GB RAM)
- High-end workstation: 5-6 agents (128GB RAM)
- Server: 10+ agents (256GB+ RAM)

**Current Default:**
- Default: 1 agent (safe for all PCs)
- Max: 5 agents (assumes 128GB RAM)

**Recommendation:**
- Check your available RAM: `wmic ComputerSystem get TotalPhysicalMemory`
- Calculate: Available RAM / 20GB = Max agents
- Example: 64GB RAM / 20GB = 3 agents max
- Don't exceed your hardware capacity!

---

## 📊 **Recommended Settings by Hardware**

### **Low-End PC (16-32GB RAM)**
```bash
MAX_OPENAI_CONCURRENCY=5
MAX_OLLAMA_CONCURRENCY=1
```

### **Mid-Range PC (64GB RAM)**
```bash
MAX_OPENAI_CONCURRENCY=10
MAX_OLLAMA_CONCURRENCY=3
```

### **High-End Workstation (128GB RAM)**
```bash
MAX_OPENAI_CONCURRENCY=15
MAX_OLLAMA_CONCURRENCY=5
```

### **Server (256GB+ RAM)**
```bash
MAX_OPENAI_CONCURRENCY=20
MAX_OLLAMA_CONCURRENCY=12
```

---

## 🚀 **Quick Implementation**

Want me to update the code for you? I can:

1. ✅ Update `packages/openai-worker-mcp/src/policy.ts` (max 10 → 20)
2. ✅ Update `packages/autonomous-agent-mcp/src/index.ts` (max 5 → 15)
3. ✅ Rebuild both packages
4. ✅ Update `.env.local` with your desired settings

**Just confirm:**
- How much RAM does your PC have?
- What's your OpenAI rate limit tier?
- Do you want me to make these changes?

---

## 📋 **Current vs Requested**

| Server | Current Max | Your Request | Feasible? |
|--------|-------------|--------------|-----------|
| **OpenAI Worker** | 10 agents | 15 agents | ✅ Yes (code update needed) |
| **Autonomous Agent** | 5 agents | 12 agents | ⚠️ Depends on RAM (code update needed) |

**To achieve your request:**
1. Update code (2 files)
2. Rebuild (2 packages)
3. Set environment variables
4. Verify hardware capacity (especially RAM for Ollama)

---

## 🎯 **Summary**

**Current State:**
- ❌ OpenAI Worker: Capped at 10 agents (you want 15)
- ❌ Autonomous Agent: Capped at 5 agents (you want 12)

**To Fix:**
- Update 2 lines of code
- Rebuild 2 packages
- Set environment variables
- Verify hardware capacity

**Want me to do it?** Just say the word! 🚀

