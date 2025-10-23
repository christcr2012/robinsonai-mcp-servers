# Neon Database Deployment Guide - RAD Crawler

**Last Updated:** 2025-10-22  
**Status:** Production Ready

---

## Prerequisites

1. **Neon Account**
   - Sign up at https://neon.tech
   - Free tier: 512 MB storage, 1 database

2. **Node.js**
   - Version 18+ required
   - Check: `node --version`

3. **Environment Variables**
   - `NEON_DATABASE_URL` - Your Neon connection string

---

## Step 1: Create Neon Database

### 1.1 Create Project
1. Log into Neon console
2. Click "New Project"
3. Name: `rad-crawler`
4. Region: Choose closest to you
5. Click "Create Project"

### 1.2 Get Connection String
1. In project dashboard, click "Connection Details"
2. Copy the connection string (looks like):
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. Save this - you'll need it

### 1.3 Enable pgvector Extension
1. In Neon console, go to "SQL Editor"
2. Run this command:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Verify:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```
4. Should return 1 row

---

## Step 2: Set Environment Variable

### Windows (PowerShell)
```powershell
$env:NEON_DATABASE_URL="postgresql://user:password@host.neon.tech/neondb?sslmode=require"
```

### Linux/Mac
```bash
export NEON_DATABASE_URL="postgresql://user:password@host.neon.tech/neondb?sslmode=require"
```

### Permanent (add to .env file)
```bash
# In project root
echo 'NEON_DATABASE_URL="your_connection_string"' >> .env
```

---

## Step 3: Deploy Schema

### 3.1 Run Deployment Script
```bash
cd packages/rad-crawler-mcp
node scripts/deploy-schema.mjs
```

### Expected Output
```
🚀 Deploying RAD Crawler schema to Neon...
✅ Connected to Neon database
✅ pgvector extension enabled
✅ Created table: sources
✅ Created table: documents
✅ Created table: doc_blobs
✅ Created table: chunks
✅ Created table: jobs
✅ Created table: policy
✅ Created indexes (12 total)
✅ Inserted default governance policy
✅ Created vector index on chunks.embedding

🎉 Schema deployment successful!
```

### 3.2 Verify Deployment
```bash
node scripts/verify-schema.mjs
```

### Expected Output
```
🔍 Verifying RAD Crawler schema...
✅ pgvector extension enabled
✅ Table 'sources' exists (6 columns)
✅ Table 'documents' exists (9 columns)
✅ Table 'doc_blobs' exists (3 columns)
✅ Table 'chunks' exists (6 columns)
✅ Table 'jobs' exists (9 columns)
✅ Table 'policy' exists (5 columns)
✅ All indexes created (12 total)
✅ Default governance policy exists

🎉 Schema verification successful!
```

---

## Step 4: Test Connection

### 4.1 Test from RAD Worker
```bash
# In packages/rad-crawler-mcp
node -e "import('./dist/db.js').then(m => m.testConnection())"
```

### Expected Output
```
✅ Connected to Neon database
✅ pgvector extension available
✅ All tables exist
Connection test passed!
```

---

## Troubleshooting

### Error: "relation does not exist"
**Problem:** Schema not deployed  
**Solution:** Run `node scripts/deploy-schema.mjs`

### Error: "extension 'vector' does not exist"
**Problem:** pgvector not enabled  
**Solution:** 
1. Go to Neon SQL Editor
2. Run: `CREATE EXTENSION IF NOT EXISTS vector;`
3. Re-run deployment script

### Error: "connection timeout"
**Problem:** Wrong connection string or network issue  
**Solution:**
1. Verify `NEON_DATABASE_URL` is correct
2. Check internet connection
3. Verify Neon project is active

### Error: "SSL required"
**Problem:** Connection string missing `?sslmode=require`  
**Solution:** Add `?sslmode=require` to end of connection string

### Error: "database does not exist"
**Problem:** Database name in connection string is wrong  
**Solution:** 
1. Check Neon console for correct database name
2. Update connection string

---

## Safety Limits (Default Governance Policy)

The deployment script creates a default governance policy with these safety limits:

```json
{
  "max_pages_per_job": 1000,
  "max_depth": 5,
  "max_time_minutes": 120,
  "max_repo_files": 5000,
  "max_chunk_size_kb": 100
}
```

**Why these limits?**
- Prevents accidental infinite crawls
- Keeps database under 512 MB (Neon free tier)
- Prevents stuck jobs
- Protects against circular links

**To adjust limits:**
```javascript
// Use rad.govern tool in Augment
rad.govern({
  budgets: {
    max_pages_per_job: 5000  // Increase if needed
  }
})
```

---

## Schema Overview

### Tables Created

| Table | Purpose | Rows (typical) |
|-------|---------|----------------|
| sources | Web domains, repos | 10-50 |
| documents | Individual pages/files | 100-5000 |
| doc_blobs | Raw page content | 100-5000 |
| chunks | Searchable text chunks | 500-50000 |
| jobs | Crawl/ingest jobs | 10-100 |
| policy | Governance rules | 1-5 |

### Indexes Created

- FTS (full-text search) on chunks.ts
- Vector similarity on chunks.embedding
- Foreign key indexes
- State/status indexes for fast queries

---

## Next Steps

After successful deployment:

1. ✅ Schema deployed
2. ✅ Verification passed
3. ✅ Connection tested
4. → **Next:** Deploy Vercel API (Phase 2)
5. → **Next:** Run comprehensive tests (Phase 3)
6. → **Next:** Add to Augment (Phase 4)

---

## Rollback

If you need to start over:

```sql
-- In Neon SQL Editor
DROP TABLE IF EXISTS chunks CASCADE;
DROP TABLE IF EXISTS doc_blobs CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS sources CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS policy CASCADE;
```

Then re-run deployment script.

---

## Production Considerations

### Database Size Monitoring
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Cleanup Old Data
```sql
-- Delete jobs older than 30 days
DELETE FROM jobs WHERE created_at < NOW() - INTERVAL '30 days';

-- Delete inactive documents
DELETE FROM documents WHERE is_active = FALSE AND updated_at < NOW() - INTERVAL '7 days';
```

### Backup
Neon provides automatic backups. To export manually:
```bash
pg_dump $NEON_DATABASE_URL > rad_backup.sql
```

---

## Support

- Neon Docs: https://neon.tech/docs
- pgvector Docs: https://github.com/pgvector/pgvector
- RAD Issues: File in robinsonai-mcp-servers repo

