# Phase 4: Cloud-Based Coding Agent System

## 🎯 Vision

Build a **production-grade cloud coding agent platform** that extends the local MCP framework with:
- Feature flag integration for gradual rollouts
- Continuous evaluation and regression tracking
- Shared model performance learning
- Human feedback loops
- Knowledge base integration

**This is a REALISTIC, ACHIEVABLE system** that you can actually build and deploy.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloud Platform (AWS/GCP/Azure)            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Feature Flag │  │ Eval Harness │  │ Model        │      │
│  │ Service      │  │ & Leaderboard│  │ Portfolio    │      │
│  │              │  │              │  │ Tuner        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │  API Gateway   │                        │
│                    │  (REST/GraphQL)│                        │
│                    └───────┬────────┘                        │
└────────────────────────────┼──────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Local MCP      │
                    │  Servers        │
                    │  (Your Machine) │
                    └─────────────────┘
```

---

## 📦 Component 1: Feature Flag Service

### Purpose
Enable gradual rollouts of new agent features without redeploying code.

### Tech Stack
- **Runtime:** Node.js/Bun (TypeScript)
- **Database:** PostgreSQL (Neon serverless)
- **Cache:** Redis (Upstash)
- **Deployment:** Vercel Edge Functions or AWS Lambda

### Core Features
1. **Flag Management**
   - Create/update/delete feature flags
   - Target by user, repo, or percentage
   - Schedule flag changes

2. **Evaluation**
   - Fast flag evaluation (<10ms)
   - Client-side caching
   - Fallback to defaults on failure

3. **Analytics**
   - Track flag usage
   - A/B test results
   - Rollout progress

### API Design
```typescript
// REST API
GET  /api/flags/:flagName/evaluate?userId=...&repoId=...
POST /api/flags
PUT  /api/flags/:flagName
DELETE /api/flags/:flagName

// Response
{
  "enabled": true,
  "variant": "new-fixer-prompt",
  "metadata": { "rolloutPercentage": 25 }
}
```

### Integration with MCP
```typescript
// In agent-cli.ts
import { evaluateFlag } from './cloud-client.js';

const useNewFixer = await evaluateFlag('new-fixer-prompt', {
  userId: process.env.USER,
  repoId: getRepoId(root),
});

if (useNewFixer) {
  // Use new fixer prompt
} else {
  // Use old fixer prompt
}
```

### Estimated Effort
- **Backend:** 2-3 days (API + DB schema)
- **Frontend:** 2 days (Admin UI for flag management)
- **Integration:** 1 day (MCP client library)
- **Total:** ~1 week

### Cost
- **Neon DB:** Free tier (512MB)
- **Upstash Redis:** Free tier (10K commands/day)
- **Vercel:** Free tier (100GB bandwidth)
- **Total:** $0/month for MVP, ~$20/month at scale

---

## 📦 Component 2: Eval Harness & Leaderboard

### Purpose
Continuous evaluation of agent quality with regression tracking.

### Tech Stack
- **Runtime:** Node.js (TypeScript)
- **Database:** PostgreSQL (Neon)
- **Queue:** BullMQ + Redis (Upstash)
- **Frontend:** Next.js + Tailwind
- **Deployment:** Vercel (frontend) + Railway (workers)

### Core Features
1. **Benchmark Datasets**
   - HumanEval (164 Python problems)
   - MBPP (974 Python problems)
   - SWE-bench-lite (300 real GitHub issues)
   - Custom repo-specific tests

2. **Evaluation Pipeline**
   - Scheduled runs (nightly, weekly)
   - On-demand evaluation
   - Parallel execution (10-50 workers)
   - Sandbox isolation

3. **Leaderboard**
   - Pass rate by model
   - Cost per solved problem
   - Time per problem
   - Trend charts

4. **Regression Detection**
   - Alert on pass rate drop >5%
   - Bisect to find breaking commit
   - Auto-rollback on critical regression

### API Design
```typescript
// REST API
POST /api/eval/run
GET  /api/eval/results/:runId
GET  /api/leaderboard?dataset=humaneval&timeRange=7d

// WebSocket for live updates
ws://api/eval/live/:runId
```

### Database Schema
```sql
CREATE TABLE eval_runs (
  id UUID PRIMARY KEY,
  dataset VARCHAR(50),
  model VARCHAR(100),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  pass_rate DECIMAL(5,2),
  avg_cost DECIMAL(10,4),
  avg_time_ms INTEGER
);

CREATE TABLE eval_results (
  id UUID PRIMARY KEY,
  run_id UUID REFERENCES eval_runs(id),
  problem_id VARCHAR(100),
  passed BOOLEAN,
  cost DECIMAL(10,4),
  time_ms INTEGER,
  error_message TEXT,
  generated_code TEXT
);
```

### Integration with MCP
```typescript
// In agent-cli.ts
import { submitEvalRun } from './cloud-client.js';

// After successful task completion
await submitEvalRun({
  model: 'qwen2.5-coder:7b',
  problem: card.name,
  passed: verdict.verdict === 'accept',
  cost: calculateCost(iterations),
  timeMs: Date.now() - startTime,
  code: patch.ops,
});
```

### Estimated Effort
- **Backend:** 3-4 days (API + workers + DB)
- **Frontend:** 3-4 days (Leaderboard UI + charts)
- **Datasets:** 2 days (HumanEval/MBPP integration)
- **Integration:** 1 day (MCP client)
- **Total:** ~2 weeks

### Cost
- **Neon DB:** Free tier
- **Upstash Redis:** Free tier
- **Railway:** $5/month (workers)
- **Vercel:** Free tier
- **Total:** ~$5/month for MVP, ~$50/month at scale

---

## 📦 Component 3: Model Portfolio Tuner

### Purpose
Learn which models work best for which tasks across all repos.

### Tech Stack
- **Runtime:** Python (FastAPI) or Node.js
- **Database:** PostgreSQL (Neon)
- **ML:** scikit-learn or TensorFlow.js
- **Cache:** Redis (Upstash)
- **Deployment:** Railway or Fly.io

### Core Features
1. **Performance Tracking**
   - Record model performance per task type
   - Track cost, time, success rate
   - Store across all repos (shared learning)

2. **Recommendation Engine**
   - Collaborative filtering
   - Task similarity matching
   - Cost-quality tradeoff optimization

3. **Auto-Tuning**
   - Suggest model for new task
   - Fall back on failure
   - A/B test new models

### API Design
```typescript
// REST API
POST /api/portfolio/record
GET  /api/portfolio/recommend?taskType=refactor&maxCost=0.10

// Response
{
  "model": "qwen2.5-coder:7b",
  "confidence": 0.85,
  "estimatedCost": 0.05,
  "estimatedSuccessRate": 0.92,
  "reason": "Similar tasks succeeded 92% of the time"
}
```

### ML Algorithm
```python
# Collaborative filtering for model recommendation
from sklearn.neighbors import NearestNeighbors

# Features: task type, complexity, repo size, language
X = [[task_type_id, complexity, repo_size, language_id], ...]
y = [model_id, ...]

# Train k-NN model
knn = NearestNeighbors(n_neighbors=5)
knn.fit(X)

# Recommend model for new task
neighbors = knn.kneighbors([new_task_features])
recommended_models = [y[i] for i in neighbors[1][0]]
```

### Integration with MCP
```typescript
// In cost-budgeter.ts
import { recommendModel } from './cloud-client.js';

const recommendation = await recommendModel({
  taskType: 'refactor',
  complexity: 'medium',
  repoSize: 50000,
  language: 'typescript',
  maxCost: 0.10,
});

// Use recommended model
const model = recommendation.model;
```

### Estimated Effort
- **Backend:** 3-4 days (API + ML model)
- **Data Collection:** 2 days (Schema + ingestion)
- **ML Training:** 2-3 days (Algorithm + tuning)
- **Integration:** 1 day (MCP client)
- **Total:** ~2 weeks

### Cost
- **Neon DB:** Free tier
- **Railway/Fly.io:** $5/month
- **Total:** ~$5/month

---

## 📦 Component 4: Human Feedback Flywheel

### Purpose
Learn from human corrections to improve agent quality over time.

### Tech Stack
- **Runtime:** Node.js (TypeScript)
- **Database:** PostgreSQL (Neon)
- **Frontend:** Next.js + Tailwind
- **Deployment:** Vercel

### Core Features
1. **Feedback Collection**
   - Capture when user edits agent output
   - Track rejected patches
   - Record manual fixes

2. **Feedback Analysis**
   - Identify common failure patterns
   - Extract correction patterns
   - Generate few-shot examples

3. **Continuous Improvement**
   - Update prompts based on feedback
   - Add examples to context
   - Retrain models (future)

### API Design
```typescript
// REST API
POST /api/feedback/capture
GET  /api/feedback/patterns?taskType=refactor
GET  /api/feedback/examples?taskType=refactor&limit=5

// Feedback payload
{
  "taskId": "uuid",
  "originalPatch": {...},
  "correctedPatch": {...},
  "userComment": "Should use async/await instead of promises",
  "timestamp": "2025-10-31T..."
}
```

### Integration with MCP
```typescript
// In agent-cli.ts
import { captureFeedback, getFeedbackExamples } from './cloud-client.js';

// Before running task, get examples
const examples = await getFeedbackExamples({
  taskType: 'refactor',
  limit: 3,
});

// Include in prompt
const prompt = `${basePrompt}\n\nExamples of good solutions:\n${examples}`;

// After user edits output
await captureFeedback({
  taskId,
  originalPatch: generatedPatch,
  correctedPatch: userEditedPatch,
  userComment: getUserComment(),
});
```

### Estimated Effort
- **Backend:** 2-3 days (API + DB)
- **Frontend:** 2-3 days (Feedback UI)
- **Analysis:** 2 days (Pattern detection)
- **Integration:** 1 day (MCP client)
- **Total:** ~1.5 weeks

### Cost
- **Neon DB:** Free tier
- **Vercel:** Free tier
- **Total:** $0/month

---

## 📦 Component 5: Knowledge Base Integration

### Purpose
Provide agents with up-to-date API documentation and best practices.

### Tech Stack
- **Runtime:** Node.js (TypeScript)
- **Vector DB:** Pinecone (free tier) or Weaviate (self-hosted)
- **Embeddings:** OpenAI text-embedding-3-small
- **Cache:** Redis (Upstash)
- **Deployment:** Vercel Edge Functions

### Core Features
1. **Doc Scraping**
   - Scrape official docs (MDN, TypeScript, React, etc.)
   - Update weekly
   - Version-aware

2. **Semantic Search**
   - Embed doc snippets
   - Vector similarity search
   - Return top-k relevant snippets

3. **Citation Tracking**
   - Track which docs were used
   - Verify citations in output
   - Update stale docs

### API Design
```typescript
// REST API
POST /api/knowledge/search
GET  /api/knowledge/docs/:library/:version

// Search request
{
  "query": "How to use React hooks?",
  "library": "react",
  "version": "18.2.0",
  "limit": 5
}

// Response
{
  "results": [
    {
      "snippet": "...",
      "url": "https://react.dev/reference/react/useState",
      "relevance": 0.95
    }
  ]
}
```

### Integration with MCP
```typescript
// In context-packing.ts
import { searchKnowledge } from './cloud-client.js';

// Before generating code
const docs = await searchKnowledge({
  query: `How to ${card.goals[0]}`,
  library: detectLibrary(card),
  limit: 3,
});

// Include in context
const context = `${baseContext}\n\nRelevant documentation:\n${docs}`;
```

### Estimated Effort
- **Backend:** 3-4 days (API + vector DB)
- **Scraping:** 2-3 days (Scrapers for top 10 libraries)
- **Embeddings:** 1 day (Batch embedding pipeline)
- **Integration:** 1 day (MCP client)
- **Total:** ~2 weeks

### Cost
- **Pinecone:** Free tier (1M vectors)
- **OpenAI Embeddings:** ~$0.10/1M tokens
- **Vercel:** Free tier
- **Total:** ~$5/month

---

## 🚀 Deployment Strategy

### Phase 1: MVP (Weeks 1-4)
1. **Week 1:** Feature Flag Service
2. **Week 2:** Eval Harness (HumanEval only)
3. **Week 3:** Model Portfolio Tuner
4. **Week 4:** Integration + Testing

### Phase 2: Production (Weeks 5-8)
5. **Week 5:** Human Feedback Flywheel
6. **Week 6:** Knowledge Base Integration
7. **Week 7:** Full Eval Harness (MBPP, SWE-bench)
8. **Week 8:** Polish + Documentation

### Phase 3: Scale (Weeks 9-12)
9. **Week 9:** Performance optimization
10. **Week 10:** Multi-tenancy
11. **Week 11:** Enterprise features (SSO, RBAC)
12. **Week 12:** Launch! 🚀

---

## 💰 Total Cost Estimate

### Development
- **Solo developer:** 12 weeks @ $100/hr = $48,000
- **Small team (2 devs):** 8 weeks @ $200/hr = $64,000

### Infrastructure (Monthly)
- **Neon DB:** $0 (free tier) → $20 (pro)
- **Upstash Redis:** $0 (free tier) → $10 (pro)
- **Vercel:** $0 (free tier) → $20 (pro)
- **Railway:** $5 → $50
- **Pinecone:** $0 (free tier) → $70 (standard)
- **OpenAI API:** $50-200/month
- **Total:** $55-370/month

### First Year
- **Development:** $48K-64K (one-time)
- **Infrastructure:** $660-4,440/year
- **Total:** ~$50K-70K

---

## ✅ Why This Is Achievable

1. **Proven Tech Stack**
   - All technologies are battle-tested
   - Free tiers cover MVP
   - Easy to scale

2. **Incremental Delivery**
   - Each component is independent
   - Can ship one at a time
   - Immediate value from each

3. **Realistic Scope**
   - No custom ML models (use existing)
   - No complex infrastructure
   - Standard CRUD + API patterns

4. **Clear ROI**
   - Feature flags → faster iteration
   - Eval harness → quality assurance
   - Model tuner → cost savings
   - Feedback → continuous improvement

---

## 🎯 Success Metrics

### Feature Flags
- Flag evaluation latency <10ms
- 99.9% uptime
- 100% rollback success rate

### Eval Harness
- Run HumanEval in <30 minutes
- Track 10+ models
- Detect regressions within 24 hours

### Model Portfolio Tuner
- Recommendation accuracy >80%
- Cost savings >20%
- Success rate improvement >10%

### Human Feedback
- Capture 50%+ of corrections
- Generate 100+ examples/month
- Improve pass rate by 5%/month

### Knowledge Base
- Search latency <100ms
- 95%+ citation accuracy
- Cover top 20 libraries

---

**Last Updated:** 2025-10-31  
**Status:** Ready to build! 🚀

