# Comprehensive Tool Testing Checklist

Based on the ChatGPT document (lines 5725-5760), here's the complete verification sequence:

## 1. Build
```bash
pnpm -w build
```

## 2. Health Check
**Tool:** `thinking_tools_health_check`
**Args:** `{}`
**Expected:** Large tool count (64+ tools), all names listed

## 3. Fresh Index
**Tool:** `ensure_fresh_index`
**Args:** `{}`
**Expected:** Index updated or skipped if fresh

**Tool:** `context_stats`
**Args:** `{}`
**Expected:** Chunk count, file count, index stats

## 4. Docs Audit
**Tool:** `docs_audit_repo`
**Args:** `{}`
**Expected:** JSON buckets (plans, finals, missing, stale, conflicts) - NO "path must be string" error

## 5. Web Search (Free Fallback)
**Tool:** `context_web_search`
**Args:** `{"query": "Ollama client retry backoff best practices", "k": 6}`
**Expected:** Non-empty results even with no API keys

**Tool:** `context_web_search_and_import`
**Args:** `{"query": "Ollama client retry backoff best practices", "k": 6, "group": "external/research"}`
**Expected:** Results imported into evidence

## 6. Context7 Ingest
**Tool:** `context7_adapter`
**Args:** `{"from": "file", "file": "./.context7.json"}`
**Expected:** "Context7 fresh/cache; imported N items" - NO hard error on missing file

## 7. Blend + Sequential Thinking
**Tool:** `ctx_merge_config`
**Args:** `{"mode": "blend"}`
**Expected:** Ranking mode set to blend

**Tool:** `sequential_thinking`
**Args:** `{"goal": "Decide best retry strategy for OllamaClient generate()", "k": 10, "useWeb": true}`
**Expected:** Rich markdown with sections (Executive Summary, Options, Risks, Recommendations, Evidence) and linked sources

## 8. Code Implementation Check
**Tool:** `context_query`
**Args:** `{"query": "OllamaClient generate method implementation", "k": 6}`
**Expected:** .ts/.js implementation files near top (not only docs)

## 9. Evidence Collection & Deduplication
**Tool:** `ctx_import_evidence`
**Args:** `{"group": "external/test", "items": [{"source":"context7", "title":"X", "uri":"https://ex", "snippet":"...", "score":0.8}]}`
**Expected:** Items imported

**Tool:** `ctx_import_evidence` (repeat same args)
**Args:** `{"group": "external/test", "items": [{"source":"context7", "title":"X", "uri":"https://ex", "snippet":"...", "score":0.8}]}`
**Expected:** No duplicates (upsert working)

## 10. Incremental Indexing
**Tool:** `ensure_fresh_index`
**Args:** `{}`
**Expected:** Fast (within TTL)

**Tool:** `context_stats`
**Args:** `{}`
**Expected:** Stats shown

*Edit a file locally*

**Tool:** `ensure_fresh_index`
**Args:** `{}`
**Expected:** "changed: 1" style update, not full rebuild

**Tool:** `context_stats`
**Args:** `{}`
**Expected:** Updated stats

## Success Criteria

✅ Every tool returns valid JSON/text (no errors)
✅ docs_audit_repo: NO "path must be string" error
✅ context_web_search: Non-empty results with no API keys
✅ sequential_thinking: Rich markdown output with evidence
✅ context_query: Code files prioritized over docs
✅ ctx_import_evidence: Deduplication working
✅ ensure_fresh_index: Incremental updates, not full rebuilds

## Notes

- All tests should work with NO API keys (free-first approach)
- Optional paid providers (Brave, Bing, SerpAPI) improve quality but aren't required
- Embedding provider should be OpenAI or Voyage for speed (not Ollama)
- Set environment variables:
  ```bash
  RCE_INDEX_TTL_MINUTES=20
  RCE_MAX_CHANGED_PER_RUN=800
  RCE_EMBED_MODEL=text-embedding-3-small
  RCE_IGNORE=**/node_modules/**,**/.git/**,**/dist/**,**/build/**,**/.rce_index/**
  ```

