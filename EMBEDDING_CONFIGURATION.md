# Robinson's Context Engine - Embedding Configuration

**Date:** 2025-11-03  
**Status:** ✅ CONFIGURED  

---

## 🎯 Current Configuration

### Augment MCP Config (`augment-mcp-config.json`)

**Thinking Tools MCP** is now configured with:

```json
{
  "EMBED_PROVIDER": "auto",              // Auto-select: OpenAI → Voyage → Ollama → None
  "EMBED_PREFER_QUALITY": "1",           // Use best model available
  "EMBED_MAX_COST_PER_1M": "0.15",      // Max $0.15 per 1M tokens
  "OPENAI_API_KEY": "sk-proj-...",      // From .env.local
  "ANTHROPIC_API_KEY": "sk-ant-..."     // From .env.local (for Voyage)
}
```

### How It Works

**Auto Provider Selection:**
1. **First Try:** OpenAI (if `OPENAI_API_KEY` is set)
   - Model: `text-embedding-3-small` ($0.02/1M) or `text-embedding-3-large` ($0.13/1M)
   - Selection: Based on `EMBED_PREFER_QUALITY` and `EMBED_MAX_COST_PER_1M`

2. **Second Try:** Voyage/Claude (if `ANTHROPIC_API_KEY` is set)
   - Model: `voyage-code-2` ($0.10/1M) or `voyage-3` ($0.12/1M)
   - Best for code-heavy repositories

3. **Third Try:** Ollama (if running on localhost:11434)
   - Model: `nomic-embed-text` (FREE)
   - Requires local Ollama installation

4. **Fallback:** None (lexical search only)
   - Uses BM25 algorithm
   - No embeddings required

---

## 💰 Cost Estimates

### For This Repository (~2,500 files, ~12,000 chunks)

| Provider | Model | Cost | Quality | Speed |
|----------|-------|------|---------|-------|
| **OpenAI** | text-embedding-3-small | **$0.024** | ⭐⭐⭐⭐ | ⚡⚡⚡ |
| **OpenAI** | text-embedding-3-large | $0.156 | ⭐⭐⭐⭐⭐ | ⚡⚡ |
| **Voyage** | voyage-code-2 | $0.120 | ⭐⭐⭐⭐⭐ | ⚡⚡ |
| **Ollama** | nomic-embed-text | **$0.00** | ⭐⭐⭐ | ⚡ |

**Current Configuration Will Use:**
- **Primary:** OpenAI text-embedding-3-large ($0.156) - Because `EMBED_PREFER_QUALITY=1`
- **Fallback:** Voyage voyage-code-2 ($0.120) - If OpenAI fails
- **Last Resort:** Ollama nomic-embed-text ($0.00) - If both fail

---

## 🎛️ Configuration Options

### Option 1: Best Quality (Current)
```bash
EMBED_PROVIDER=auto
EMBED_PREFER_QUALITY=1
EMBED_MAX_COST_PER_1M=0.15
```
**Result:** Uses OpenAI text-embedding-3-large ($0.156 for this repo)

### Option 2: Best Value
```bash
EMBED_PROVIDER=auto
EMBED_PREFER_QUALITY=0
EMBED_MAX_COST_PER_1M=0.05
```
**Result:** Uses OpenAI text-embedding-3-small ($0.024 for this repo)

### Option 3: FREE Only
```bash
EMBED_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
```
**Result:** Uses Ollama nomic-embed-text ($0.00)

### Option 4: OpenAI Only
```bash
EMBED_PROVIDER=openai
OPENAI_API_KEY=sk-proj-...
EMBED_MODEL=text-embedding-3-small
```
**Result:** Uses OpenAI text-embedding-3-small ($0.024 for this repo)

### Option 5: Voyage/Claude Only
```bash
EMBED_PROVIDER=voyage
VOYAGE_API_KEY=...
EMBED_MODEL=voyage-code-2
```
**Result:** Uses Voyage voyage-code-2 ($0.120 for this repo)

---

## 📊 API Keys Configured

From `.env.local`:

✅ **OpenAI**
```bash
OPENAI_API_KEY="sk-proj-YOUR_OPENAI_API_KEY_HERE"
```

✅ **Anthropic/Claude** (for Voyage AI)
```bash
ANTHROPIC_API_KEY="sk-ant-YOUR_ANTHROPIC_API_KEY_HERE"
```

✅ **Ollama**
```bash
OLLAMA_BASE_URL="http://localhost:11434"
```

---

## 🚀 Testing the Configuration

### 1. Restart VS Code
Close and reopen VS Code to reload the MCP configuration.

### 2. Test Indexing
```typescript
// In Augment chat:
context_index_repo()
```

**Expected Output:**
```
✅ Indexed!

Sources: 2500
Chunks: 12000
Vectors: 12000
Provider: openai
Model: text-embedding-3-large
Cost: $0.1560
```

### 3. Check Stats
```typescript
context_stats()
```

**Expected Output:**
```json
{
  "sources": 2500,
  "chunks": 12000,
  "vectors": 12000,
  "mode": "openai",
  "model": "text-embedding-3-large",
  "dimensions": 3072,
  "totalCost": 0.156,
  "indexedAt": "2025-11-03T..."
}
```

### 4. Test Search
```typescript
context_query({ query: "quality gates implementation" })
```

**Expected Output:**
```json
[
  {
    "uri": "packages/free-agent-mcp/src/quality-gates.ts",
    "title": "quality-gates.ts",
    "snippet": "export async function executeWithQualityGates(...",
    "score": 0.92,
    "_provider": "vector+lexical",
    "_method": "hybrid"
  },
  ...
]
```

---

## 🔧 Troubleshooting

### Issue: "No chunks created"
**Cause:** Workspace root detection failed  
**Fix:** Check `WORKSPACE_ROOT` and `AUGMENT_WORKSPACE_ROOT` env vars

### Issue: "Embedding failed"
**Cause:** API key invalid or rate limit  
**Fix:** Check API key in `.env.local`, verify it's not expired

### Issue: "Using lexical search only"
**Cause:** No embedding provider available  
**Fix:** 
1. Check API keys are set
2. Verify Ollama is running (if using Ollama)
3. Check network connectivity

### Issue: "Cost too high"
**Cause:** Using expensive model  
**Fix:** Set `EMBED_PREFER_QUALITY=0` or `EMBED_MAX_COST_PER_1M=0.05`

---

## 📈 Monitoring Costs

### View Total Cost
```typescript
context_stats()
// Look at "totalCost" field
```

### Estimate Before Indexing
```typescript
// Rough estimate:
// - 2,500 files × ~5 chunks/file = 12,500 chunks
// - 12,500 chunks × ~100 tokens/chunk = 1.25M tokens
// - 1.25M tokens × $0.02/1M = $0.025 (text-embedding-3-small)
// - 1.25M tokens × $0.13/1M = $0.163 (text-embedding-3-large)
```

---

## 🎯 Recommendations

### For Development (Your Current Setup)
```bash
EMBED_PROVIDER=auto
EMBED_PREFER_QUALITY=1
EMBED_MAX_COST_PER_1M=0.15
```
**Why:** Best quality for testing, reasonable cost (~$0.16 per index)

### For Production (Published Package)
```bash
EMBED_PROVIDER=auto
EMBED_PREFER_QUALITY=0
EMBED_MAX_COST_PER_1M=0.05
```
**Why:** Best value, works for most users, falls back gracefully

### For FREE Users
```bash
EMBED_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
```
**Why:** No API keys required, completely free

---

## 📝 Summary

**Current Configuration:**
- ✅ Auto provider selection enabled
- ✅ Quality preference enabled (will use best model)
- ✅ Max cost: $0.15/1M tokens
- ✅ OpenAI API key configured
- ✅ Anthropic API key configured (for Voyage)
- ✅ Ollama fallback available

**Expected Behavior:**
1. Try OpenAI text-embedding-3-large first ($0.156 for this repo)
2. Fall back to Voyage voyage-code-2 if OpenAI fails ($0.120)
3. Fall back to Ollama if both fail ($0.00)
4. Fall back to lexical search if all fail (no embeddings)

**Ready to test!** 🚀

Restart VS Code and run `context_index_repo()` to see it in action.

