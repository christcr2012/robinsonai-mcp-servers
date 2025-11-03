# Context Engine Comparison: Thinking Tools MCP vs Augment

**Date:** 2025-11-03  
**Purpose:** Comprehensive comparison to identify gaps and improvements

---

## 🎯 Executive Summary

Both context engines serve similar purposes (semantic code search) but with different approaches:

- **Augment:** Proprietary, real-time, production-grade, optimized for speed and accuracy
- **Thinking Tools MCP:** Open-source, customizable, hybrid approach, evidence tracking

**Key Finding:** Augment excels at core retrieval quality and speed. Thinking Tools MCP excels at extensibility and evidence management.

---

## 📊 Feature Comparison Matrix

| Feature | Thinking Tools MCP | Augment | Winner |
|---------|-------------------|---------|--------|
| **Real-time Indexing** | ❌ Manual (`context_index_repo`) | ✅ Automatic | **Augment** |
| **Cross-Language Support** | ✅ Yes (via embeddings) | ✅ Yes (optimized) | **Tie** |
| **Embedding Quality** | 🟡 Ollama (nomic-embed-text) or OpenAI | ✅ Proprietary (best-in-class) | **Augment** |
| **Search Speed** | 🟡 Moderate (loads all chunks) | ✅ Fast (optimized index) | **Augment** |
| **Integration Ease** | 🟡 Requires setup | ✅ Built-in | **Augment** |
| **Evidence Tracking** | ✅ EvidenceStore, persistence | ❌ Not available | **Thinking Tools** |
| **Cost** | ✅ FREE (Ollama) | 🟡 Uses Augment credits | **Thinking Tools** |
| **Customizability** | ✅ Full control | ❌ Black box | **Thinking Tools** |
| **Web Integration** | ✅ URL ingestion, crawling | ❌ Not available | **Thinking Tools** |
| **External Docs** | ✅ Context7 adapter | ❌ Not available | **Thinking Tools** |
| **Blended Search** | ✅ Local + imported | ❌ Local only | **Thinking Tools** |
| **Git History** | ❌ Current state only | ✅ Via git-commit-retrieval | **Augment** |
| **Memory Efficiency** | 🟡 Had overflow bugs (fixed) | ✅ Production-grade | **Augment** |

**Overall Score:**
- **Augment:** 6 wins (core retrieval excellence)
- **Thinking Tools MCP:** 5 wins (extensibility & evidence)
- **Tie:** 1

---

## 💪 Augment's Strengths

### 1. **Real-Time Indexing** ⭐⭐⭐
- Automatically updates as code changes
- No manual `context_index_repo` needed
- Always reflects current state

### 2. **Proprietary Embedding Model** ⭐⭐⭐
- "Highest-quality recall of relevant code snippets"
- Optimized for code understanding
- Better than generic embeddings (nomic-embed-text)

### 3. **Production-Grade Performance** ⭐⭐⭐
- Fast response times
- Memory-efficient
- No overflow bugs

### 4. **Zero Setup** ⭐⭐
- Works out of the box
- No configuration needed
- Integrated into Augment workflow

### 5. **Git History Awareness** ⭐⭐
- `git-commit-retrieval` tool
- Understand how code evolved
- Find similar past changes

---

## 💪 Thinking Tools MCP's Strengths

### 1. **Evidence Tracking** ⭐⭐⭐
- `EvidenceStore` class tracks all findings
- Persistent storage in `.robctx/evidence/`
- Query by source, group, tag, text
- Upsert capability (avoid duplicates)
- **Augment doesn't have this!**

### 2. **Blended Search** ⭐⭐⭐
- Combine local repo + external evidence
- Ranking modes: `local`, `imported`, `blend`
- Interleave results by score
- **Augment doesn't have this!**

### 3. **Web Integration** ⭐⭐⭐
- `context_web_search` - DuckDuckGo search
- `context_ingest_urls` - Fetch and index URLs
- `context_web_crawl_step` - Multi-page crawling
- **Augment doesn't have this!**

### 4. **Context7 Integration** ⭐⭐
- Import external library docs
- `context7_adapter` normalizes responses
- Merge with local context
- **Augment doesn't have this!**

### 5. **Full Customizability** ⭐⭐
- Control embedding provider (Ollama/OpenAI)
- Adjust hybrid search weights (80/20 split)
- Custom chunking logic
- Open-source, hackable

### 6. **FREE** ⭐⭐
- Uses local Ollama (0 credits)
- No API costs
- Unlimited usage

---

## 🚨 Critical Gaps in Thinking Tools MCP

### Gap 1: **No Real-Time Indexing** (HIGH PRIORITY)
**Problem:** Must manually call `context_index_repo` to update index  
**Impact:** Stale results if code changes  
**Augment's Approach:** Automatic real-time updates  

**Recommendation:**
```typescript
// Add file watcher to auto-reindex on changes
import chokidar from 'chokidar';

export class ContextEngine {
  private watcher?: chokidar.FSWatcher;
  
  async enableAutoIndex(): Promise<void> {
    this.watcher = chokidar.watch(this.root, {
      ignored: /node_modules|\.git/,
      persistent: true
    });
    
    this.watcher.on('change', async (path) => {
      await this.reindexFile(path);
    });
  }
  
  private async reindexFile(filePath: string): Promise<void> {
    // Incremental reindex (only changed file)
    // Update chunks.jsonl and embeddings.jsonl
  }
}
```

### Gap 2: **Memory Overflow on Large Repos** (PARTIALLY FIXED)
**Problem:** `context_query` crashes with "Cannot create a string longer than 0x1fffffe8 characters"  
**Status:** Fixed in `context_stats` (v1.6.1) but NOT in `context_query`  
**Augment's Approach:** Streaming, pagination, optimized data structures  

**Recommendation:**
```typescript
// Fix context_query to use streaming
export async function hybridQuery(query: string, topK = 8): Promise<Hit[]> {
  // ❌ OLD: const chunks = loadChunks(); // Loads ALL into memory
  
  // ✅ NEW: Stream chunks and score incrementally
  const scored: Hit[] = [];
  const { embedBatch } = await import('./embedding.js');
  const [qvec] = await embedBatch([query]);
  
  for (const chunk of readJSONL<Chunk>(getPaths().chunks)) {
    const embedding = await getEmbedding(chunk.id); // Lazy load
    const score = embedding ? cosine(qvec, embedding) : 0;
    scored.push({ score, chunk, id: chunk.id });
  }
  
  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}
```

### Gap 3: **Embedding Quality** (MEDIUM PRIORITY)
**Problem:** Using generic `nomic-embed-text` model  
**Impact:** Lower quality than Augment's code-optimized embeddings  
**Augment's Approach:** Proprietary model trained on code  

**Recommendation:**
- Use OpenAI `text-embedding-3-large` for better quality (costs money)
- OR fine-tune `nomic-embed-text` on code corpus
- OR use `voyage-code-2` (specialized for code)

### Gap 4: **No Incremental Indexing** (MEDIUM PRIORITY)
**Problem:** Re-indexes entire repo every time  
**Impact:** Slow on large repos  
**Augment's Approach:** Only index changed files  

**Recommendation:**
```typescript
// Track file hashes and only reindex if changed
const stats = fs.statSync(filePath);
const currentHash = sha(filePath + ':' + stats.mtimeMs);
const previousHash = await getStoredHash(filePath);

if (currentHash !== previousHash) {
  await reindexFile(filePath);
  await storeHash(filePath, currentHash);
}
```

### Gap 5: **No Query Caching** (LOW PRIORITY)
**Problem:** Same query re-computes embeddings and search  
**Impact:** Slower than necessary  
**Augment's Approach:** Likely caches recent queries  

**Recommendation:**
```typescript
const queryCache = new Map<string, Hit[]>();

export async function hybridQuery(query: string, topK = 8): Promise<Hit[]> {
  const cacheKey = `${query}:${topK}`;
  if (queryCache.has(cacheKey)) {
    return queryCache.get(cacheKey)!;
  }
  
  const results = await performSearch(query, topK);
  queryCache.set(cacheKey, results);
  return results;
}
```

---

## 🌟 Unique Features in Thinking Tools MCP

### Feature 1: **Evidence Store** (Augment should add this!)
**What it does:** Tracks all findings from thinking tools  
**Why it's valuable:**
- Persistent memory across sessions
- Query historical evidence
- Avoid duplicate work
- Build knowledge graph over time

**Example Use Case:**
```typescript
// Sequential thinking creates evidence
await evidence.add('sequential_thinking', {
  thought: 'Quality gates need execReport fix',
  thoughtNumber: 6,
  convoId: 'quality-gates-fix-2025-11-03'
});

// Later, query evidence
const pastThoughts = await evidence.find({
  source: 'sequential_thinking',
  text: 'quality gates'
});
```

### Feature 2: **Blended Search** (Augment should add this!)
**What it does:** Combines local repo + external sources  
**Why it's valuable:**
- Search across repo + documentation simultaneously
- Rank by relevance across all sources
- One query, comprehensive results

**Example Use Case:**
```typescript
// Search both local code AND React docs
const results = await blendedSearch('useState hook examples', 10);
// Returns: [
//   { source: 'repo', path: 'src/hooks/useAuth.ts', score: 0.95 },
//   { source: 'context7', uri: 'https://react.dev/...', score: 0.92 },
//   ...
// ]
```

### Feature 3: **Web Crawling** (Augment should add this!)
**What it does:** Ingest web pages into context  
**Why it's valuable:**
- Index documentation sites
- Search across docs + code
- Keep docs up-to-date

---

## 🎯 Recommendations

### For Thinking Tools MCP (Close Gaps)

**Priority 1: Fix Memory Overflow in context_query** ⚠️ CRITICAL
- Use streaming instead of loading all chunks
- Implement pagination
- Add memory limits

**Priority 2: Add Real-Time Indexing** ⚠️ HIGH
- File watcher with chokidar
- Incremental reindexing
- Debounce rapid changes

**Priority 3: Improve Embedding Quality** 🟡 MEDIUM
- Support multiple embedding providers
- Add `voyage-code-2` option
- Allow custom models

**Priority 4: Add Incremental Indexing** 🟡 MEDIUM
- Track file hashes
- Only reindex changed files
- Faster updates

**Priority 5: Add Query Caching** 🟢 LOW
- LRU cache for recent queries
- Configurable TTL
- Clear on index update

### For Augment (Add Unique Features)

**Recommendation 1: Add Evidence Store**
- Track findings across tools
- Persistent memory
- Query historical context

**Recommendation 2: Add Blended Search**
- Combine codebase-retrieval + web-search
- Unified ranking
- One query, all sources

**Recommendation 3: Add Web Crawling**
- Ingest documentation sites
- Index external resources
- Search across all context

---

## 📈 Success Metrics

**For Thinking Tools MCP:**
- [ ] `context_query` works on repos with 10,000+ files
- [ ] Real-time indexing updates within 1 second of file change
- [ ] Search speed < 500ms for typical queries
- [ ] Embedding quality matches OpenAI text-embedding-3-small
- [ ] Query cache hit rate > 50%

**For Augment:**
- [ ] Evidence store available via MCP tool
- [ ] Blended search combines codebase + web results
- [ ] Web crawling tool available

---

## 🏆 Conclusion

**Augment wins on core retrieval:**
- Real-time indexing
- Embedding quality
- Performance
- Zero setup

**Thinking Tools MCP wins on extensibility:**
- Evidence tracking
- Blended search
- Web integration
- Customizability
- FREE

**Best Strategy:**
1. Use Augment for primary code search (it's better)
2. Use Thinking Tools MCP for evidence tracking and web integration
3. Close critical gaps in Thinking Tools MCP (memory overflow, real-time indexing)
4. Consider adding Thinking Tools' unique features to Augment

**Overall Assessment:** Both engines are valuable. Augment is production-ready for code search. Thinking Tools MCP offers unique capabilities that complement Augment.

