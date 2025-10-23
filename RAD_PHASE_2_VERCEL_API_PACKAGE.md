# RAD Phase 2: Vercel API Deployment Package

**Goal:** Create production-ready Vercel API package for RAD Crawler  
**Estimated Time:** 2-3 hours  
**Complexity:** Medium  
**Dependencies:** Phase 1 (Neon schema deployed)

---

## Objective

Create a complete Vercel serverless API package that exposes RAD Crawler functionality via HTTP endpoints.

---

## Scope

### Files to Create

1. **`packages/rad-vercel-api/package.json`**
   - New package for Vercel deployment
   - Dependencies: RAD crawler code, Vercel SDK
   - Build scripts

2. **`packages/rad-vercel-api/api/search.ts`**
   - POST /api/search endpoint
   - Accepts search query, returns results
   - Uses RAD search functionality

3. **`packages/rad-vercel-api/api/crawl.ts`**
   - POST /api/crawl endpoint
   - Accepts URLs, starts crawl job
   - Returns job_id

4. **`packages/rad-vercel-api/api/status.ts`**
   - GET /api/status?job_id=X endpoint
   - Returns job status and progress

5. **`packages/rad-vercel-api/api/webhook.ts`**
   - POST /api/webhook endpoint
   - Handles GitHub/Vercel deployment webhooks
   - Triggers repo ingestion

6. **`packages/rad-vercel-api/vercel.json`**
   - Vercel configuration
   - Route definitions
   - Environment variable requirements

7. **`packages/rad-vercel-api/README.md`**
   - Deployment instructions
   - API documentation
   - Environment setup

### Existing Files to Reference

- `packages/rad-crawler-mcp/vercel-api-example/` - Example implementations
- `packages/rad-crawler-mcp/src/rad/` - RAD core functionality

---

## Requirements

### 1. Package Structure

```
packages/rad-vercel-api/
├── package.json
├── vercel.json
├── README.md
├── api/
│   ├── search.ts
│   ├── crawl.ts
│   ├── status.ts
│   └── webhook.ts
└── lib/
    └── rad-client.ts  (wrapper around RAD functionality)
```

### 2. API Endpoints

**POST /api/search**
```typescript
Request: { q: string, top_k?: number, semantic?: boolean }
Response: { results: Array<{ doc_id, title, url, snippet, score }> }
```

**POST /api/crawl**
```typescript
Request: { urls: string[], max_depth?: number, max_pages?: number }
Response: { job_id: number, status: string }
```

**GET /api/status**
```typescript
Query: ?job_id=123
Response: { job_id, state, progress, error?, result? }
```

**POST /api/webhook**
```typescript
Request: GitHub/Vercel webhook payload
Response: { job_id: number, message: string }
```

### 3. Environment Variables

Required in Vercel:
- `NEON_DATABASE_URL` - Neon connection string
- `OLLAMA_BASE_URL` - Ollama server for embeddings
- `WEBHOOK_SECRET` - Secret for webhook verification (optional)

### 4. Error Handling

All endpoints must:
- Return proper HTTP status codes
- Include error messages in response
- Log errors to console
- Handle database connection failures gracefully

---

## Success Criteria

1. ✅ Package builds successfully
2. ✅ All 4 API endpoints work locally
3. ✅ Vercel deployment succeeds
4. ✅ Search endpoint returns results
5. ✅ Crawl endpoint creates jobs
6. ✅ Status endpoint returns job info
7. ✅ Webhook endpoint processes events
8. ✅ README has complete deployment instructions

---

## Testing

### Local Test
```bash
cd packages/rad-vercel-api
npm install
vercel dev

# Test search
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"q":"test query"}'

# Test crawl
curl -X POST http://localhost:3000/api/crawl \
  -H "Content-Type: application/json" \
  -d '{"urls":["https://example.com"]}'

# Test status
curl http://localhost:3000/api/status?job_id=1
```

### Deployment Test
```bash
vercel deploy
# Test deployed endpoints
```

---

## Constraints

- **Max files changed:** 8 new files
- **Max time:** 3 hours
- **No changes to RAD core code**
- **Must work with existing Neon schema**

---

## Deliverables

1. Complete Vercel API package
2. All 4 endpoints working
3. Deployment documentation
4. Local and production testing verified

---

## Next Phase

After Phase 2 completes, proceed to **Phase 3: Comprehensive Testing** which will create smoke tests for the entire RAD system.

