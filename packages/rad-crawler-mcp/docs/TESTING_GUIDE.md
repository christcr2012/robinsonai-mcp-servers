# RAD Crawler - Testing Guide

## Overview

Comprehensive testing strategy for RAD Crawler covering all 10 MCP tools, Vercel API endpoints, and database operations.

---

## Test Suites

### 1. MCP Tools Smoke Test

**File:** `test/smoke-test-complete.mjs`

Tests all 10 MCP tools:
- `rad.govern` - Update governance policy
- `rad.plan_crawl` - AI-generated crawl plan
- `rad.seed` - Manual crawl seeding
- `rad.crawl_now` - Force start crawl
- `rad.ingest_repo` - Repository ingestion
- `rad.search` - Semantic + FTS search
- `rad.get_doc` - Document retrieval
- `rad.get_job` - Job status
- `rad.index_stats` - Index statistics
- `rad.diagnose` - Health check

**Run:**
```bash
cd packages/rad-crawler-mcp
npm run build
node test/smoke-test-complete.mjs
```

**Expected output:**
```
✓ MCP server started
✓ rad.govern: Policy updated
✓ rad.plan_crawl: Plan created
✓ rad.seed: Job queued
✓ rad.search: Found 10 results
✓ rad.index_stats: 500 documents indexed
✅ All 10 tools passed
```

### 2. Vercel API Tests

**File:** `packages/rad-vercel-api/test/api-test.mjs`

Tests all 4 API endpoints:
- POST /api/search
- POST /api/crawl
- GET /api/status
- GET /api/stats

**Run:**
```bash
cd packages/rad-vercel-api
npm test
```

**Expected output:**
```
✓ POST /api/search: 200 OK, 10 results
✓ POST /api/crawl: 201 Created, job_id=123
✓ GET /api/status: 200 OK, state=queued
✓ GET /api/stats: 200 OK, cache hit rate 75%
✅ All API tests passed
```

### 3. Database Tests

**File:** `packages/rad-crawler-mcp/test/database-test.mjs`

Tests database operations:
- Schema deployment
- CRUD operations
- FTS search
- Vector search (when embeddings available)
- Governance policy
- Job management

**Run:**
```bash
cd packages/rad-crawler-mcp
node test/database-test.mjs
```

### 4. Integration Tests

**File:** `packages/rad-crawler-mcp/test/integration-test.mjs`

End-to-end workflow tests:
1. Seed crawl job
2. Execute crawl (mock)
3. Index documents
4. Generate embeddings
5. Search indexed content
6. Verify results

---

## Test Data

### Sample Documents
```javascript
const testDocs = [
  {
    uri: 'https://example.com/page1',
    title: 'Test Page 1',
    content: 'This is test content about databases and schemas.',
  },
  {
    uri: 'https://example.com/page2',
    title: 'Test Page 2',
    content: 'This page discusses API design and REST principles.',
  },
];
```

### Sample Queries
```javascript
const testQueries = [
  'database schema',
  'API design',
  'REST principles',
  'semantic search',
];
```

---

## Performance Benchmarks

### Search Performance
- **FTS search:** <50ms (keyword-based)
- **Hybrid search:** <300ms (FTS + semantic)
- **Cached search:** <10ms (95% faster)

### Crawl Performance
- **Pages/second:** 5-10 (with rate limiting)
- **Indexing speed:** 100 chunks/second
- **Embedding generation:** 50 chunks/second (batch mode)

### Cache Performance
- **Hit rate target:** >60%
- **Memory usage:** <100 MB (for 100 cached queries)
- **TTL:** 5 min (search), 10 min (docs), 1 min (stats)

---

## Continuous Testing

### Pre-commit Checks
```bash
# Run before committing
npm run test:all
```

### CI/CD Pipeline
```yaml
# .github/workflows/test.yml
name: Test RAD Crawler
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: npm test
```

---

## Troubleshooting

### Test Failures

**Problem:** MCP server won't start
**Solution:** Check Ollama is running: `curl http://localhost:11434/api/tags`

**Problem:** Database connection fails
**Solution:** Verify NEON_DATABASE_URL is set: `echo $NEON_DATABASE_URL`

**Problem:** Search returns no results
**Solution:** Check index stats: `rad.index_stats()` - ensure documents are indexed

**Problem:** Cache hit rate is low
**Solution:** Increase cache TTL in `lib/cache.ts`

---

## Test Coverage Goals

- **MCP Tools:** 100% (all 10 tools)
- **API Endpoints:** 100% (all 4 endpoints)
- **Database Operations:** >90%
- **Error Handling:** >80%
- **Edge Cases:** >70%

---

## Next Steps

1. ✅ Smoke tests implemented
2. → Add unit tests for individual functions
3. → Add integration tests for full workflows
4. → Add performance benchmarks
5. → Set up CI/CD pipeline
6. → Add test coverage reporting

