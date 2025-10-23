# RAD Crawler - Augment Integration Guide

## Overview

How to use RAD Crawler from Augment Code for zero-cost semantic search and documentation retrieval.

---

## Quick Start

### 1. Ensure RAD is Running

RAD Crawler MCP should be configured in your Augment settings:

```json
{
  "mcpServers": {
    "rad-crawler-mcp": {
      "command": "rad-crawler-mcp",
      "args": [],
      "env": {
        "NEON_DATABASE_URL": "postgresql://...",
        "OLLAMA_BASE_URL": "http://localhost:11434"
      }
    }
  }
}
```

### 2. Verify RAD is Available

In Augment, ask:
```
Check if RAD Crawler is available
```

Augment will call `rad.diagnose()` and confirm:
```
✅ RAD Crawler MCP running
✅ Neon database connected
✅ Ollama available
✅ 500 documents indexed
```

---

## Common Use Cases

### Use Case 1: Search Documentation

**Prompt:**
```
Search RAD index for "Next.js routing patterns"
```

**What Augment does:**
```javascript
rad.search({
  q: "Next.js routing patterns",
  top_k: 10,
  semantic: true
})
```

**Result:**
```
Found 10 results:
1. Next.js App Router - File-based routing (score: 0.92)
2. Dynamic Routes in Next.js (score: 0.88)
3. Route Groups and Layouts (score: 0.85)
...
```

### Use Case 2: Index New Documentation

**Prompt:**
```
Crawl and index the Vercel documentation at https://vercel.com/docs
```

**What Augment does:**
```javascript
// 1. Create crawl plan
rad.plan_crawl({
  goal: "Index Vercel documentation",
  scope: "vercel.com/docs"
})

// 2. Seed crawl
rad.seed({
  urls: ["https://vercel.com/docs"],
  allow: ["vercel.com"],
  max_depth: 3,
  max_pages: 200
})

// 3. Start crawl
rad.crawl_now({ job_id: 123 })
```

### Use Case 3: Search Code Repositories

**Prompt:**
```
Ingest the RAD Crawler repository and search for "embedding generation"
```

**What Augment does:**
```javascript
// 1. Ingest repo
rad.ingest_repo({
  repo_path: "packages/rad-crawler-mcp",
  include_patterns: ["**/*.ts", "**/*.md"],
  exclude_patterns: ["node_modules/**", "dist/**"]
})

// 2. Search
rad.search({
  q: "embedding generation",
  top_k: 5
})
```

### Use Case 4: Get Document Details

**Prompt:**
```
Show me the full content of document 123
```

**What Augment does:**
```javascript
rad.get_doc({ doc_id: 123 })
```

**Result:**
```
Document: Next.js Routing Guide
URI: https://nextjs.org/docs/routing
Chunks: 15
Content: [full document text]
```

### Use Case 5: Monitor Crawl Progress

**Prompt:**
```
Check status of crawl job 123
```

**What Augment does:**
```javascript
rad.get_job({ job_id: 123 })
```

**Result:**
```
Job 123: crawl
State: running
Progress: 45/200 pages crawled
Started: 2025-10-22 14:30:00
```

### Use Case 6: Update Governance Policy

**Prompt:**
```
Update RAD governance to allow crawling github.com and deny login pages
```

**What Augment does:**
```javascript
rad.govern({
  allowlist: ["github.com", "docs.github.com"],
  denylist: ["*/login", "*/logout", "*/signin"],
  budgets: {
    max_pages_per_job: 500,
    max_depth: 4
  }
})
```

---

## Example Workflows

### Workflow 1: Research a Topic

**Prompt:**
```
I need to learn about PostgreSQL full-text search. 
Search RAD index and summarize the top 5 results.
```

**Augment's actions:**
1. `rad.search({ q: "PostgreSQL full-text search", top_k: 5 })`
2. Retrieve top 5 chunks
3. Summarize findings
4. Present to user

### Workflow 2: Index Project Documentation

**Prompt:**
```
Index all documentation from our project's docs/ folder
```

**Augment's actions:**
1. `rad.ingest_repo({ repo_path: "docs/", include_patterns: ["**/*.md"] })`
2. Wait for completion
3. `rad.index_stats()` to confirm
4. Report: "Indexed 50 documents, 500 chunks"

### Workflow 3: Find Similar Code

**Prompt:**
```
Find code similar to this authentication pattern: [paste code]
```

**Augment's actions:**
1. `rad.search({ q: "[code snippet]", top_k: 10, semantic: true })`
2. Filter results to code files only
3. Present similar implementations
4. Highlight differences

---

## Best Practices

### 1. Use Semantic Search for Concepts
```
✅ "database migration strategies"
❌ "ALTER TABLE ADD COLUMN" (use FTS for exact matches)
```

### 2. Specify Scope for Crawls
```
✅ rad.seed({ urls: [...], allow: ["docs.example.com"] })
❌ rad.seed({ urls: [...] }) // May crawl entire internet
```

### 3. Monitor Index Size
```
rad.index_stats()
// Check: documents_count, chunks_count, db_size
// Neon free tier: 512 MB limit
```

### 4. Use Governance to Prevent Accidents
```
rad.govern({
  budgets: {
    max_pages_per_job: 1000,  // Safety limit
    max_depth: 5               // Prevent infinite crawls
  }
})
```

### 5. Cache-Friendly Queries
```
✅ Repeat searches benefit from cache (10ms vs 300ms)
✅ Cache hit rate typically 60-80%
```

---

## Advanced Usage

### Hybrid Search (Best Results)
```
rad.search({
  q: "API authentication patterns",
  top_k: 10,
  semantic: true  // Combines FTS + vector search
})
```

### FTS-Only Search (Faster)
```
rad.search({
  q: "exact keyword match",
  top_k: 10,
  semantic: false  // Keyword-only, <50ms
})
```

### Incremental Crawling
```
// First crawl
rad.seed({ urls: ["https://docs.example.com"], recrawl_days: 7 })

// 7 days later, only changed pages are re-crawled
rad.crawl_now({ job_id: 123 })
```

---

## Troubleshooting

### No Results Found
**Problem:** `rad.search()` returns 0 results
**Solution:** 
1. Check index: `rad.index_stats()`
2. If empty, ingest content: `rad.ingest_repo()` or `rad.seed()`
3. Try broader query

### Slow Searches
**Problem:** Searches take >1 second
**Solution:**
1. Use `semantic: false` for keyword-only search
2. Check cache hit rate: `rad.index_stats()`
3. Reduce `top_k` parameter

### Crawl Stuck
**Problem:** Crawl job shows "running" but no progress
**Solution:**
1. Check job: `rad.get_job({ job_id: 123 })`
2. Look for errors in job.error field
3. Restart: `rad.crawl_now({ job_id: 123 })`

### Database Full
**Problem:** Neon database approaching 512 MB limit
**Solution:**
1. Check size: `rad.index_stats()` → db_size
2. Delete old sources/documents
3. Optimize: Remove duplicate content

---

## Integration with 4-Server System

### Use RAD in Planning
```
Architect searches RAD index first before planning:
1. rad.search({ q: "similar implementations" })
2. Use results to inform plan
3. Only crawl if results are thin
```

### Use RAD in Execution
```
Credit Optimizer uses RAD for context:
1. rad.search({ q: "code patterns" })
2. Attach relevant chunks to prompts
3. Keep prompts small (chunk IDs, not full pages)
```

---

## Next Steps

1. ✅ RAD integrated with Augment
2. → Use RAD for project documentation
3. → Index external docs (Next.js, React, etc.)
4. → Monitor cache performance
5. → Optimize based on usage patterns

