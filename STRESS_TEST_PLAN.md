# 🔥 STRESS TEST PLAN - Agent Coordination System

**Date**: 2025-10-30  
**Purpose**: Test maximum concurrent agent capacity  
**Budget**: $1.00 per agent max ($15 total for OpenAI agents)

---

## 🎯 TEST OBJECTIVES

### Test 1: Ollama Agent Capacity Test
**Goal**: Find maximum number of simultaneous FREE Ollama agents  
**Hardware**: 32GB RAM, i7-13700F (16 cores), RTX 3070 8GB VRAM  
**Expected Limit**: 1-2 agents with deepseek-coder:33b (~20GB each)  
**Alternative**: 6 agents with qwen2.5-coder:7b (~4GB each)

### Test 2: OpenAI Agent Capacity Test
**Goal**: Test all 15 OpenAI agents on both servers (30 total)  
**Budget**: $1.00 per agent max ($15 total)  
**Expected**: All 15 agents should work simultaneously

### Test 3: Mixed Agent Coordination Test
**Goal**: Test parallel execution with mixed FREE + PAID agents  
**Expected**: Optimal work distribution (FREE first, PAID when needed)

---

## 📋 TEST 1: OLLAMA AGENT CAPACITY

### Test 1A: Maximum Concurrent Ollama Agents (deepseek-coder:33b)
**Task**: Generate 10 simple Redis tools simultaneously  
**Model**: deepseek-coder:33b (~20GB RAM each)  
**Expected Agents**: 1-2 agents max (RAM limited)

**Test Steps**:
1. Create plan with 10 independent tasks (no dependencies)
2. Execute with `execute_parallel_workflow_credit-optimizer-mcp`
3. Monitor RAM usage during execution
4. Record: How many agents ran simultaneously?
5. Record: Did system swap to disk?
6. Record: Total execution time

**Success Criteria**:
- ✅ At least 1 agent runs successfully
- ✅ No system crashes or OOM errors
- ✅ All 10 tasks complete successfully
- ✅ Cost: $0 (100% FREE Ollama)

---

### Test 1B: Maximum Concurrent Ollama Agents (qwen2.5-coder:7b)
**Task**: Generate 20 simple Redis tools simultaneously  
**Model**: qwen2.5-coder:7b (~4GB RAM each)  
**Expected Agents**: 5-6 agents max (RAM limited)

**Test Steps**:
1. Create plan with 20 independent tasks (no dependencies)
2. Execute with `execute_parallel_workflow_credit-optimizer-mcp`
3. Monitor RAM usage during execution
4. Record: How many agents ran simultaneously?
5. Record: Total execution time vs sequential
6. Calculate: Speedup factor

**Success Criteria**:
- ✅ At least 5 agents run simultaneously
- ✅ No system crashes or OOM errors
- ✅ All 20 tasks complete successfully
- ✅ Speedup: 3-5x vs sequential
- ✅ Cost: $0 (100% FREE Ollama)

---

## 📋 TEST 2: OPENAI AGENT CAPACITY

### Test 2A: OpenAI Worker MCP (15 agents)
**Task**: Generate 30 code analysis reports simultaneously  
**Model**: gpt-4o-mini (cheap, fast)  
**Expected Agents**: All 15 agents active
**Budget**: $1.00 per agent max ($15 total)

**Test Steps**:
1. Create plan with 30 independent analysis tasks
2. Each task: Analyze a different file from the codebase
3. Execute with `execute_parallel_workflow_credit-optimizer-mcp`
4. Monitor: How many agents run simultaneously?
5. Record: Total execution time
6. Record: Total cost

**Success Criteria**:
- ✅ All 15 agents run simultaneously
- ✅ All 30 tasks complete successfully
- ✅ Total cost < $15
- ✅ Cost per task < $0.50
- ✅ Speedup: 10-15x vs sequential

---

### Test 2B: Autonomous Agent MCP (15 agents with OpenAI fallback)
**Task**: Generate 30 simple utility functions simultaneously  
**Model**: Start with FREE Ollama, fallback to gpt-4o-mini if needed  
**Expected Agents**: Mix of FREE + PAID
**Budget**: $1.00 per agent max ($15 total)

**Test Steps**:
1. Create plan with 30 independent code generation tasks
2. Each task: Generate a simple utility function
3. Set `maxCost: 1.0` to allow OpenAI fallback
4. Execute with `execute_parallel_workflow_credit-optimizer-mcp`
5. Monitor: How many FREE vs PAID agents used?
6. Record: Total cost

**Success Criteria**:
- ✅ All 15 agents run simultaneously
- ✅ All 30 tasks complete successfully
- ✅ At least 50% use FREE Ollama
- ✅ Total cost < $15
- ✅ Speedup: 10-15x vs sequential

---

## 📋 TEST 3: MIXED AGENT COORDINATION

### Test 3A: Optimal Work Distribution
**Task**: Build complete feature (50 tasks with dependencies)  
**Tasks**:
- 20 simple tasks (FREE Ollama)
- 20 medium tasks (FREE Ollama or cheap OpenAI)
- 10 complex tasks (PAID OpenAI)

**Test Steps**:
1. Create plan with dependency graph
2. Simple tasks have no dependencies (run first)
3. Medium tasks depend on simple tasks
4. Complex tasks depend on medium tasks
5. Execute with `execute_parallel_workflow_credit-optimizer-mcp`
6. Monitor: Work distribution across agents
7. Record: Total cost and time

**Success Criteria**:
- ✅ Simple tasks use FREE Ollama (100%)
- ✅ Medium tasks use FREE Ollama (80%+)
- ✅ Complex tasks use PAID OpenAI (100%)
- ✅ Total cost < $10
- ✅ Speedup: 5-10x vs sequential

---

## 📊 METRICS TO COLLECT

### Performance Metrics
- **Concurrent Agents**: How many agents ran simultaneously?
- **Execution Time**: Total time vs sequential time
- **Speedup Factor**: Sequential time / Parallel time
- **Throughput**: Tasks completed per minute

### Cost Metrics
- **Total Cost**: Sum of all task costs
- **Cost per Task**: Average cost per task
- **FREE vs PAID**: Percentage of tasks using FREE Ollama
- **Cost Savings**: Savings vs all PAID OpenAI

### Resource Metrics
- **RAM Usage**: Peak RAM usage during execution
- **CPU Usage**: Average CPU usage
- **Swap Usage**: Did system swap to disk?
- **Agent Utilization**: Percentage of time agents were busy

---

## 🎯 EXPECTED RESULTS

### Test 1A: Ollama (deepseek-coder:33b)
- **Concurrent Agents**: 1-2
- **Execution Time**: 5-10 minutes (10 tasks)
- **Speedup**: 1-2x
- **Cost**: $0

### Test 1B: Ollama (qwen2.5-coder:7b)
- **Concurrent Agents**: 5-6
- **Execution Time**: 2-4 minutes (20 tasks)
- **Speedup**: 5-6x
- **Cost**: $0

### Test 2A: OpenAI Worker (15 agents)
- **Concurrent Agents**: 15
- **Execution Time**: 2-3 minutes (30 tasks)
- **Speedup**: 15x
- **Cost**: $5-10

### Test 2B: Autonomous Agent (15 agents mixed)
- **Concurrent Agents**: 15
- **Execution Time**: 3-5 minutes (30 tasks)
- **Speedup**: 10-15x
- **Cost**: $3-8 (50%+ FREE)

### Test 3A: Mixed Coordination (50 tasks)
- **Concurrent Agents**: 10-15
- **Execution Time**: 5-10 minutes
- **Speedup**: 8-12x
- **Cost**: $5-10

---

## 🚀 EXECUTION PLAN

### Phase 1: Setup (5 minutes)
1. Verify all servers are running
2. Check Ollama is running with models loaded
3. Verify OpenAI API key is configured
4. Check current budget status

### Phase 2: Test 1A - Ollama Capacity (deepseek-coder:33b)
**Time**: 10-15 minutes  
**Budget**: $0

1. Create plan for 10 simple Redis tools
2. Execute with parallel workflow
3. Monitor RAM usage
4. Record results

### Phase 3: Test 1B - Ollama Capacity (qwen2.5-coder:7b)
**Time**: 5-10 minutes  
**Budget**: $0

1. Create plan for 20 simple Redis tools
2. Execute with parallel workflow
3. Monitor RAM usage
4. Record results

### Phase 4: Test 2A - OpenAI Worker (15 agents)
**Time**: 5-10 minutes  
**Budget**: $5-10

1. Create plan for 30 code analysis tasks
2. Execute with parallel workflow
3. Monitor agent pool
4. Record results

### Phase 5: Test 2B - Autonomous Agent (15 agents mixed)
**Time**: 5-10 minutes  
**Budget**: $3-8

1. Create plan for 30 utility functions
2. Execute with parallel workflow
3. Monitor FREE vs PAID usage
4. Record results

### Phase 6: Test 3A - Mixed Coordination (50 tasks)
**Time**: 10-15 minutes  
**Budget**: $5-10

1. Create plan for complete feature
2. Execute with parallel workflow
3. Monitor work distribution
4. Record results

### Phase 7: Analysis (10 minutes)
1. Compile all metrics
2. Calculate speedup factors
3. Calculate cost savings
4. Generate final report

---

## 📈 SUCCESS CRITERIA

### Overall Success
- ✅ All tests complete without crashes
- ✅ Total cost < $25
- ✅ At least 50% of work done by FREE Ollama
- ✅ Speedup: 5-15x on parallel tasks
- ✅ All agents work correctly

### Performance Success
- ✅ Ollama agents: 1-6 concurrent (depending on model)
- ✅ OpenAI agents: 15 concurrent on each server
- ✅ Mixed agents: Optimal distribution (FREE first)

### Cost Success
- ✅ Test 1: $0 (100% FREE)
- ✅ Test 2: $5-15 (PAID but necessary)
- ✅ Test 3: $5-10 (50%+ FREE)
- ✅ Total: < $25

---

## 🎯 NEXT STEPS AFTER TESTING

1. **Update Documentation**
   - Document actual concurrent agent limits
   - Update cost estimates based on real data
   - Document optimal model selection

2. **Update Configuration**
   - Set MAX_OLLAMA_CONCURRENCY based on test results
   - Set MAX_OPENAI_CONCURRENCY to 15 (confirmed)
   - Update budget limits if needed

3. **Optimize System**
   - Tune agent pool based on results
   - Optimize model selection algorithm
   - Improve cost estimation accuracy

---

**READY TO START STRESS TESTING! 🔥**

