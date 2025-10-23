# RAD Phase 1: Neon Database Schema Deployment

**Goal:** Deploy RAD Crawler database schema to Neon PostgreSQL  
**Estimated Time:** 1-2 hours  
**Complexity:** Simple  
**Dependencies:** None

---

## Objective

Deploy the complete RAD Crawler database schema (tables, indexes, extensions) to Neon PostgreSQL and verify connectivity.

---

## Scope

### Files to Create/Modify

1. **`packages/rad-crawler-mcp/docs/NEON_DEPLOYMENT_GUIDE.md`**
   - Step-by-step Neon setup instructions
   - Schema deployment commands
   - Connection verification steps
   - Troubleshooting guide

2. **`packages/rad-crawler-mcp/scripts/deploy-schema.mjs`**
   - Automated schema deployment script
   - Reads from `src/rad/schema.sql`
   - Connects to Neon via `NEON_DATABASE_URL`
   - Verifies all tables/indexes created
   - Reports success/failure

3. **`packages/rad-crawler-mcp/scripts/verify-schema.mjs`**
   - Schema verification script
   - Checks all tables exist
   - Checks all indexes exist
   - Checks pgvector extension enabled
   - Returns detailed status report

### Existing Files to Reference

- `packages/rad-crawler-mcp/src/rad/schema.sql` - Complete schema definition
- `packages/rad-crawler-mcp/src/rad/db.ts` - Database connection logic

---

## Requirements

### 1. Neon Deployment Guide

**File:** `packages/rad-crawler-mcp/docs/NEON_DEPLOYMENT_GUIDE.md`

**Must Include:**
- Prerequisites (Neon account, connection string)
- How to enable pgvector extension in Neon
- How to run deployment script
- How to verify deployment
- Common errors and fixes
- Rollback instructions

### 2. Deployment Script

**File:** `packages/rad-crawler-mcp/scripts/deploy-schema.mjs`

**Must:**
- Read `NEON_DATABASE_URL` from environment
- Read schema from `src/rad/schema.sql`
- Execute schema in transaction
- Enable pgvector extension
- Create all tables in correct order
- Create all indexes
- Verify deployment
- Print clear success/error messages

**Error Handling:**
- Rollback on any error
- Print specific error details
- Exit with non-zero code on failure

### 3. Verification Script

**File:** `packages/rad-crawler-mcp/scripts/verify-schema.mjs`

**Must Check:**
- pgvector extension enabled
- All 6 tables exist (jobs, pages, repos, chunks, governance, index_stats)
- All indexes exist
- Table schemas match expected structure
- Print detailed status report

---

## Success Criteria

1. ✅ Deployment guide is complete and clear
2. ✅ Deployment script runs without errors
3. ✅ All tables created in Neon
4. ✅ All indexes created
5. ✅ pgvector extension enabled
6. ✅ Verification script confirms schema is correct
7. ✅ Connection from RAD worker succeeds

---

## Testing

### Manual Test
```bash
# Set connection string
export NEON_DATABASE_URL="postgresql://user:pass@host.neon.tech/dbname?sslmode=require"

# Deploy schema
node packages/rad-crawler-mcp/scripts/deploy-schema.mjs

# Verify deployment
node packages/rad-crawler-mcp/scripts/verify-schema.mjs
```

### Expected Output
```
✅ pgvector extension enabled
✅ Table 'jobs' exists (8 columns)
✅ Table 'pages' exists (10 columns)
✅ Table 'repos' exists (9 columns)
✅ Table 'chunks' exists (8 columns)
✅ Table 'governance' exists (5 columns)
✅ Table 'index_stats' exists (6 columns)
✅ All indexes created (12 total)

Schema deployment successful!
```

---

## Constraints

- **Max files changed:** 3 new files
- **Max time:** 2 hours
- **No changes to existing RAD code**
- **No changes to MCP server code**

---

## Deliverables

1. Complete Neon deployment guide
2. Working deployment script
3. Working verification script
4. All scripts tested and verified

---

## Next Phase

After Phase 1 completes, proceed to **Phase 2: Vercel API Package** which will create the serverless API deployment for RAD Crawler.

