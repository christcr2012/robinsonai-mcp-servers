# Multi-Agent Stress Test Plan

## Objective
Test all 6 MCP servers working simultaneously with realistic code generation tasks.
- **Budget**: Max $5 (target: $1-2)
- **Duration**: 5-10 minutes
- **Agents**: 4 Ollama (FREE) + 1 OpenAI (paid)

## Test Scenario: Build a Mini Feature
Create a simple "User Notifications" feature with:
1. React component (Ollama - qwen2.5:3b)
2. API endpoint (Ollama - codellama:34b)
3. Database schema (Ollama - deepseek-coder:33b)
4. Test suite (Ollama - qwen2.5:3b)
5. Architecture review (OpenAI - gpt-4o-mini for quality)

## Agent Assignments

### Ollama Agents (FREE - $0)
**Agent 1: React Component Generator**
- Model: qwen2.5:3b (fast, 1.9GB)
- Task: Generate NotificationBell.tsx component
- Complexity: simple
- Estimated tokens: ~2000 input, ~1500 output
- Cost: $0

**Agent 2: API Endpoint Generator**
- Model: codellama:34b (medium, 19GB)
- Task: Generate /api/notifications endpoint
- Complexity: medium
- Estimated tokens: ~2500 input, ~2000 output
- Cost: $0

**Agent 3: Database Schema Generator**
- Model: deepseek-coder:33b (complex, 18GB)
- Task: Generate notifications table schema
- Complexity: medium
- Estimated tokens: ~2000 input, ~1500 output
- Cost: $0

**Agent 4: Test Suite Generator**
- Model: qwen2.5:3b (fast, 1.9GB)
- Task: Generate Jest tests for component
- Complexity: simple
- Estimated tokens: ~2000 input, ~1500 output
- Cost: $0

### OpenAI Agent (PAID)
**Agent 5: Architecture Reviewer**
- Model: gpt-4o-mini
- Task: Review all generated code, find issues, suggest improvements
- Estimated tokens: ~8000 input, ~2000 output
- Cost estimate: ~$0.0024 (input) + ~$0.0012 (output) = **~$0.004**

## Execution Plan

### Phase 1: Parallel Ollama Generation (2-3 min)
```
Architect → Plan work (4 parallel tasks)
  ↓
Credit Optimizer → Execute workflow
  ↓
Autonomous Agent → Spawn 4 Ollama workers
  ├─ Worker 1: React component
  ├─ Worker 2: API endpoint
  ├─ Worker 3: Database schema
  └─ Worker 4: Test suite
```

### Phase 2: OpenAI Review (1-2 min)
```
OpenAI Worker → Review all 4 outputs
  ↓
Generate comprehensive critique + improvements
```

### Phase 3: Integration Test (1 min)
```
Thinking Tools → Critical analysis of architecture
Robinson's Toolkit → Simulate GitHub PR creation (dry run)
```

## Success Criteria
- ✅ All 4 Ollama agents complete successfully
- ✅ OpenAI agent provides quality review
- ✅ Total cost < $0.01 (target: $0.004)
- ✅ All code is syntactically valid
- ✅ No agent crashes or timeouts
- ✅ Concurrency limits respected (2 Ollama max, 1 OpenAI max)

## Metrics to Collect
1. **Performance**
   - Total execution time
   - Per-agent execution time
   - Queue wait times
   - Concurrent agents peak

2. **Cost**
   - Ollama: $0 (verify)
   - OpenAI: actual vs estimated
   - Total: should be < $0.01

3. **Quality**
   - Code validity (syntax check)
   - Test coverage
   - Architecture review score

4. **Reliability**
   - Success rate per agent
   - Error count
   - Retry count

## Output Files
All generated code will be saved to `tests/stress-test-output/`:
- `NotificationBell.tsx` - React component
- `notifications.ts` - API endpoint
- `schema.sql` - Database schema
- `NotificationBell.test.tsx` - Test suite
- `architecture-review.md` - OpenAI review
- `metrics.json` - Performance metrics

## Rollback Plan
If any agent fails:
1. Check diagnostics on failed server
2. Reduce concurrency (MAX_OLLAMA_CONCURRENCY=1)
3. Retry with simpler tasks
4. Report findings

## Expected Timeline
- 00:00 - Start test, verify all servers
- 00:30 - Architect creates plan
- 01:00 - Credit Optimizer starts workflow
- 01:30 - Ollama agents spawn (2 concurrent)
- 04:00 - First 2 agents complete
- 06:00 - Last 2 agents complete
- 07:00 - OpenAI review starts
- 09:00 - OpenAI review completes
- 10:00 - Final metrics compiled

**Total: ~10 minutes, ~$0.004 cost**

