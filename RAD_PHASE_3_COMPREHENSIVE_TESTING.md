# RAD Phase 3: Comprehensive Testing & Smoke Tests

**Goal:** Create complete test suite for RAD Crawler system  
**Estimated Time:** 2 hours  
**Complexity:** Simple  
**Dependencies:** Phase 1 (Neon schema), Phase 2 (Vercel API)

---

## Objective

Expand existing smoke test to cover all RAD functionality and create end-to-end workflow tests.

---

## Scope

### Files to Create/Modify

1. **`packages/rad-crawler-mcp/test/smoke-test-complete.mjs`**
   - Expand existing `test-rad-smoke.mjs`
   - Test all 10 MCP tools
   - Test end-to-end workflows
   - Verify database operations

2. **`packages/rad-crawler-mcp/test/test-vercel-api.mjs`**
   - Test all Vercel API endpoints
   - Verify responses
   - Test error handling

3. **`packages/rad-crawler-mcp/test/test-database.mjs`**
   - Test database schema
   - Test CRUD operations
   - Test vector search
   - Test governance policies

4. **`packages/rad-crawler-mcp/docs/TESTING_GUIDE.md`**
   - How to run tests
   - What each test covers
   - Expected outputs
   - Troubleshooting

### Existing Files to Reference

- `packages/rad-crawler-mcp/test-rad-smoke.mjs` - Current smoke test (30% complete)
- `packages/rad-crawler-mcp/src/rad/` - All RAD functionality

---

## Requirements

### 1. Complete Smoke Test

**File:** `packages/rad-crawler-mcp/test/smoke-test-complete.mjs`

**Must Test:**
1. `rad.plan_crawl` - Plan a crawl from goal
2. `rad.seed` - Seed a crawl job
3. `rad.crawl_now` - Force start a job
4. `rad.ingest_repo` - Ingest a GitHub repo
5. `rad.status` - Get job status
6. `rad.search` - FTS and semantic search
7. `rad.get_doc` - Retrieve document
8. `rad.get_doc_chunk` - Retrieve document chunk
9. `rad.govern` - Update governance policy
10. `rad.index_stats` - Get index statistics
11. `rad.diagnose` - System diagnostics

**Test Workflow:**
```javascript
// 1. Diagnose system
// 2. Plan a crawl
// 3. Seed the crawl
// 4. Start crawl
// 5. Check status
// 6. Search results
// 7. Get document
// 8. Update governance
// 9. Check stats
```

### 2. Vercel API Test

**File:** `packages/rad-crawler-mcp/test/test-vercel-api.mjs`

**Must Test:**
- POST /api/search with various queries
- POST /api/crawl with different URL sets
- GET /api/status for different job states
- POST /api/webhook with sample payloads
- Error responses (400, 404, 500)
- Rate limiting (if implemented)

### 3. Database Test

**File:** `packages/rad-crawler-mcp/test/test-database.mjs`

**Must Test:**
- Connection to Neon
- Insert/update/delete operations
- Vector similarity search
- Full-text search
- Governance policy enforcement
- Index statistics calculation

### 4. Testing Guide

**File:** `packages/rad-crawler-mcp/docs/TESTING_GUIDE.md`

**Must Include:**
- Prerequisites (Neon connection, Ollama running)
- How to run each test
- Expected output for each test
- How to interpret results
- Common failures and fixes

---

## Success Criteria

1. ✅ All 10 MCP tools tested
2. ✅ End-to-end workflow test passes
3. ✅ All Vercel API endpoints tested
4. ✅ Database operations verified
5. ✅ Tests run without errors
6. ✅ Testing guide is complete
7. ✅ All tests documented

---

## Testing

### Run All Tests
```bash
# Set environment
export NEON_DATABASE_URL="postgresql://..."
export OLLAMA_BASE_URL="http://localhost:11434"

# Run smoke test
node packages/rad-crawler-mcp/test/smoke-test-complete.mjs

# Run API test
node packages/rad-crawler-mcp/test/test-vercel-api.mjs

# Run database test
node packages/rad-crawler-mcp/test/test-database.mjs
```

### Expected Output
```
✅ rad.diagnose - System healthy
✅ rad.plan_crawl - Plan created
✅ rad.seed - Job seeded (job_id: 1)
✅ rad.crawl_now - Crawl started
✅ rad.status - Job running (progress: 25%)
✅ rad.search - 5 results found
✅ rad.get_doc - Document retrieved
✅ rad.get_doc_chunk - Chunk retrieved
✅ rad.govern - Policy updated
✅ rad.index_stats - Stats retrieved

All tests passed! ✅
```

---

## Constraints

- **Max files changed:** 4 new files
- **Max time:** 2 hours
- **No changes to RAD core code**
- **Tests must be runnable locally**

---

## Deliverables

1. Complete smoke test covering all 10 tools
2. Vercel API test suite
3. Database test suite
4. Testing guide documentation
5. All tests passing

---

## Next Phase

After Phase 3 completes, proceed to **Phase 4: Documentation & Deployment Guides** which will create final deployment documentation and bring-up checklist.

