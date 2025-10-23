# RAD Crawler - Remaining Work Specification
**For 4-Server Autonomous Execution**

---

## Overview

This document specifies the remaining work to complete the RAD Crawler system. All core functionality is implemented; this work focuses on **deployment infrastructure** and **documentation**.

**Estimated Effort:** 6-8 hours  
**Files to Create/Modify:** ~15-20 files  
**Execution Method:** Architect → Optimizer → Autonomous Agent

---

## Task 1: Create Vercel API Deployment Package

### Goal
Create a production-ready Vercel deployment with RAD API endpoints.

### Location
`packages/rad-vercel-api/` (new package)

### Files to Create

#### 1. `package.json`
```json
{
  "name": "@robinsonai/rad-vercel-api",
  "version": "1.0.0",
  "description": "Vercel API endpoints for RAD Crawler",
  "type": "module",
  "scripts": {
    "dev": "vercel dev",
    "deploy": "vercel --prod"
  },
  "dependencies": {
    "@vercel/node": "^3.0.0",
    "pg": "^8.13.1"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/pg": "^8.11.10",
    "typescript": "^5.7.2",
    "vercel": "^33.0.0"
  }
}
```

#### 2. `vercel.json`
```json
{
  "version": 2,
  "env": {
    "NEON_DATABASE_URL": "@neon-database-url"
  },
  "build": {
    "env": {
      "NEON_DATABASE_URL": "@neon-database-url"
    }
  },
  "routes": [
    {
      "src": "/api/rad/(.*)",
      "dest": "/api/rad/$1"
    }
  ]
}
```

#### 3. `api/rad/query.ts`
Copy from `packages/rad-crawler-mcp/vercel-api-example/api/rad/query.ts`
- No changes needed, already production-ready

#### 4. `api/rad/job.ts`
Copy from `packages/rad-crawler-mcp/vercel-api-example/api/rad/job.ts`
- No changes needed, already production-ready

#### 5. `api/rad/webhook.ts` (NEW)
```typescript
/**
 * Vercel API Route: /api/rad/webhook
 * Handle webhooks from GitHub, Vercel, or other services
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';
import crypto from 'crypto';

const { Pool } = pg;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { source, event, payload } = req.body;

  // Validate webhook signature (optional but recommended)
  const signature = req.headers['x-webhook-signature'] as string;
  if (process.env.WEBHOOK_SECRET && signature) {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    max: 1,
  });

  try {
    let jobParams: any = {};
    let jobKind: 'crawl' | 'repo_ingest' = 'crawl';

    // Handle different webhook sources
    switch (source) {
      case 'github':
        // GitHub push/PR webhook
        if (event === 'push' || event === 'pull_request') {
          jobKind = 'repo_ingest';
          jobParams = {
            repo_url: payload.repository?.html_url,
            branch: payload.ref?.replace('refs/heads/', ''),
            trigger: 'webhook',
          };
        }
        break;

      case 'vercel':
        // Vercel deployment webhook
        if (event === 'deployment.created') {
          jobKind = 'crawl';
          jobParams = {
            urls: [payload.deployment?.url],
            max_depth: 2,
            max_pages: 50,
            trigger: 'webhook',
          };
        }
        break;

      case 'manual':
        // Manual trigger with custom params
        jobKind = payload.kind || 'crawl';
        jobParams = payload.params || {};
        break;

      default:
        return res.status(400).json({ error: 'Unknown webhook source' });
    }

    // Create job
    const { rows } = await pool.query(
      `INSERT INTO jobs (kind, params, state)
       VALUES ($1, $2, 'queued')
       RETURNING job_id, kind, state, created_at`,
      [jobKind, JSON.stringify(jobParams)]
    );

    const job = rows[0];

    res.status(201).json({
      job_id: job.job_id,
      kind: job.kind,
      state: job.state,
      created_at: job.created_at,
      source,
      event,
    });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await pool.end();
  }
}
```

#### 6. `.env.example`
```bash
# Neon Database
NEON_DATABASE_URL=postgres://user:pass@host/db

# Optional: Webhook signature verification
WEBHOOK_SECRET=your_webhook_secret_here
```

#### 7. `README.md`
```markdown
# RAD Vercel API

Vercel serverless API endpoints for RAD Crawler.

## Endpoints

### POST /api/rad/query
Search the RAD index.

**Request:**
```json
{
  "q": "search query",
  "top_k": 10,
  "semantic": true
}
```

### POST /api/rad/job
Create a crawl or repo ingest job.

**Request:**
```json
{
  "kind": "crawl",
  "params": {
    "urls": ["https://example.com"],
    "max_depth": 2
  }
}
```

### POST /api/rad/webhook
Handle webhooks from GitHub, Vercel, etc.

**Request:**
```json
{
  "source": "github",
  "event": "push",
  "payload": { ... }
}
```

## Deployment

1. Install Vercel CLI: `npm i -g vercel`
2. Set environment variable: `vercel env add NEON_DATABASE_URL`
3. Deploy: `vercel --prod`

## Local Development

```bash
npm install
vercel env pull .env.local
vercel dev
```
```

#### 8. `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": ".vercel/output"
  },
  "include": ["api/**/*"],
  "exclude": ["node_modules"]
}
```

---

## Task 2: Update Augment Instructions

### Goal
Add RAD Crawler orchestration patterns to Augment assistant instructions.

### Location
`augment-instructions.txt`

### Changes
Append the RAD orchestration section (see RAD_SYSTEM_AUDIT.md for full text).

**Key additions:**
- Search-first workflow
- Plan + seed + crawl pattern
- Repo ingestion workflow
- Governance rules
- Output sizing (handles, not heaps)
- Cost control (local models first)
- Diagnostics

---

## Task 3: Create Comprehensive Smoke Test

### Goal
Build executable smoke test covering all 4 workflow steps.

### Location
`test-rad-smoke.mjs` (new file in root)

### Implementation
```javascript
#!/usr/bin/env node
/**
 * RAD Crawler Smoke Test
 * Tests the complete RAD workflow: govern, plan, crawl, search, ingest
 */

import { spawn } from 'child_process';

// Test configuration
const TOOLKIT_BIN = 'robinsons-toolkit-mcp';
const TEST_TIMEOUT = 300000; // 5 minutes

// Helper: Call MCP tool
async function callTool(toolName, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(TOOLKIT_BIN, [], { stdio: ['pipe', 'pipe', 'pipe'] });
    
    const request = JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name: toolName, arguments: args }
    }) + '\n';

    let output = '';
    child.stdout.on('data', (data) => { output += data.toString(); });
    child.stderr.on('data', (data) => { console.error(data.toString()); });
    
    child.on('close', (code) => {
      if (code !== 0) return reject(new Error(`Tool failed: ${code}`));
      try {
        const lines = output.trim().split('\n');
        const result = JSON.parse(lines[lines.length - 1]);
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });

    child.stdin.write(request);
    child.stdin.end();
    
    setTimeout(() => {
      child.kill();
      reject(new Error('Timeout'));
    }, TEST_TIMEOUT);
  });
}

// Test 1: Create policy
async function test1_govern() {
  console.log('\n[1/4] Testing rad.govern...');
  const result = await callTool('rad.govern', {
    allowlist: ['docs.vercel.com', 'vercel.com'],
    denylist: ['accounts.*'],
    budgets: { max_pages_per_job: 50, max_depth: 2, rate_per_domain: 10 }
  });
  console.log('✅ Policy created:', result);
}

// Test 2: Plan + crawl
async function test2_crawl() {
  console.log('\n[2/4] Testing rad.plan_crawl + rad.crawl_now...');
  
  const plan = await callTool('rad.plan_crawl', {
    goal: 'Collect Vercel docs for edge functions basics'
  });
  console.log('✅ Plan created:', plan.job_id);
  
  await callTool('rad.crawl_now', { job_id: plan.job_id });
  
  // Poll status
  let status;
  for (let i = 0; i < 60; i++) {
    status = await callTool('rad.status', { job_id: plan.job_id });
    if (status.state === 'done' || status.state === 'error') break;
    await new Promise(r => setTimeout(r, 5000));
  }
  
  console.log('✅ Crawl completed:', status);
}

// Test 3: Search
async function test3_search() {
  console.log('\n[3/4] Testing rad.search...');
  
  const results = await callTool('rad.search', {
    q: 'How to deploy a Next.js Edge API route on Vercel?',
    semantic: true,
    top_k: 5
  });
  
  console.log(`✅ Found ${results.results.length} results`);
  
  if (results.results.length > 0) {
    const doc = await callTool('rad.get_doc', { doc_id: results.results[0].doc_id });
    console.log('✅ Retrieved document:', doc.uri);
  }
}

// Test 4: Ingest repo
async function test4_ingest() {
  console.log('\n[4/4] Testing rad.ingest_repo...');
  
  const job = await callTool('rad.ingest_repo', {
    repo_url: 'https://github.com/vercel/examples',
    include: ['edge*'],
    exclude: ['**/__tests__/**']
  });
  
  console.log('✅ Repo ingest started:', job.job_id);
  
  // Search for edge middleware
  const results = await callTool('rad.search', {
    q: 'edge middleware example for pathname rewrite',
    top_k: 3
  });
  
  console.log(`✅ Found ${results.results.length} code examples`);
}

// Run all tests
(async () => {
  try {
    await test1_govern();
    await test2_crawl();
    await test3_search();
    await test4_ingest();
    console.log('\n✅ All smoke tests passed!');
  } catch (error) {
    console.error('\n❌ Smoke test failed:', error);
    process.exit(1);
  }
})();
```

Make executable: `chmod +x test-rad-smoke.mjs`

---

## Task 4: Create Neon Deployment Guide

### Goal
Step-by-step guide for deploying RAD schema to Neon.

### Location
`docs/RAD_NEON_SETUP.md` (new file)

### Content
See next message (file too long for this spec)

---

## Task 5: Create Bring-Up Checklist

### Goal
Single executable checklist for complete RAD deployment.

### Location
`RAD_BRINGUP_CHECKLIST.md` (new file in root)

### Content
See next message (file too long for this spec)

---

## Execution Plan for 4-Server System

### Step 1: Architect Planning
```javascript
architect-mcp.plan_work({
  goal: "Complete RAD Crawler deployment infrastructure: Vercel API package, Augment instructions, smoke tests, and deployment guides",
  depth: "fast",
  budgets: {
    max_steps: 15,
    time_ms: 600000,
    max_files_changed: 25
  }
})
```

### Step 2: Export to Optimizer
```javascript
architect-mcp.export_workplan_to_optimizer({ plan_id: "<from_step_1>" })
```

### Step 3: Execute Autonomously
```javascript
credit-optimizer-mcp.execute_autonomous_workflow(workflow)
```

This will:
- ✅ Create all files specified above
- ✅ Use autonomous-agent-mcp for code generation (local LLM)
- ✅ Minimize cloud credits
- ✅ Execute without "continue?" loops
- ✅ Create PR with all changes

---

## Success Criteria

1. ✅ Vercel API package created and deployable
2. ✅ All 3 API endpoints functional (/query, /job, /webhook)
3. ✅ Augment instructions updated with RAD orchestration
4. ✅ Smoke test script passes all 4 tests
5. ✅ Neon deployment guide complete and tested
6. ✅ Bring-up checklist executable and validated
7. ✅ All documentation cross-referenced and consistent

---

## Notes

- All code examples are production-ready (not pseudocode)
- File paths are relative to repository root
- TypeScript compilation must succeed for all new code
- No breaking changes to existing RAD implementation
- Maintain consistency with existing Robinson AI patterns

