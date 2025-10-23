# 6-Server System Smoke Test

**Generated:** {{TIMESTAMP}}  
**Purpose:** Validate all 6 MCP servers are operational and configured correctly

---

## Test Plan

### 1. thinking-tools-mcp (Pure CPU)
- ✅ Devils advocate analysis
- ✅ Decision matrix
- ✅ SWOT analysis
- ✅ First principles thinking

### 2. autonomous-agent-mcp (Ollama)
- ✅ Diagnose environment
- ✅ Code generation
- ✅ Code analysis
- ✅ Test generation
- ✅ Stats tracking

### 3. architect-mcp (Planning)
- ✅ Spec submission
- ✅ Plan creation
- ✅ Plan status
- ✅ Cost forecasting
- ✅ Model catalog

### 4. openai-worker-mcp (Paid API)
- ✅ Cost estimation
- ✅ Job execution
- ✅ Spend tracking
- ✅ Budget enforcement

### 5. credit-optimizer-mcp (Workflows)
- ✅ Tool discovery
- ✅ Credit stats
- ✅ Recipe listing
- ✅ Blueprint listing
- ✅ Diagnosis

### 6. robinsons-toolkit-mcp (Broker)
- ✅ Environment diagnosis
- ✅ Tool discovery
- ✅ Broker stats
- ✅ Integration spawning

---

## Execution Instructions

Copy and paste these commands to Augment Code (Sonnet 4.5) one section at a time:

### Test 1: thinking-tools-mcp
```
Use tool devils_advocate_thinking-tools-mcp with {"context":"Use local LLMs to cut cloud spend by 90%","depth":"quick"}
Use tool decision_matrix_thinking-tools-mcp with {"options":["DeepSeek","Qwen","Llama"],"criteria":["speed","accuracy","VRAM"],"context":"Pick a default local model"}
Use tool swot_analysis_thinking-tools-mcp with {"subject":"6-server MCP architecture","perspective":"technical"}
Use tool first_principles_thinking-tools-mcp with {"problem":"How to minimize AI API costs while maintaining quality"}
```

### Test 2: autonomous-agent-mcp
```
Use tool diagnose_autonomous_agent_autonomous-agent-mcp with {}
Use tool delegate_code_generation_autonomous-agent-mcp with {"task":"Create a TypeScript function that validates email addresses","context":"No external deps, RFC 5322 compliant","complexity":"simple"}
Use tool delegate_code_analysis_autonomous-agent-mcp with {"code":"function add(a,b){return a+b}","question":"Find potential issues and suggest improvements"}
Use tool get_agent_stats_autonomous-agent-mcp with {"period":"all"}
```

### Test 3: architect-mcp
```
Use tool submit_spec_architect-mcp with {"title":"User Authentication System","text":"Build a secure authentication system with email/password and OAuth support. Include password reset, email verification, and session management."}
Use tool plan_work_architect-mcp with {"spec_id":SPEC_ID_FROM_PREV,"mode":"balanced"}
Use tool get_plan_status_architect-mcp with {"plan_id":PLAN_ID_FROM_PREV}
Use tool forecast_run_cost_architect-mcp with {"plan_id":PLAN_ID_FROM_PREV}
Use tool list_models_architect-mcp with {}
```

### Test 4: openai-worker-mcp
```
Use tool estimate_cost_openai-worker-mcp with {"agent":"mini-worker","estimated_input_tokens":2000,"estimated_output_tokens":1000}
Use tool run_job_openai-worker-mcp with {"agent":"mini-worker","task":"Write a concise JSDoc comment for this function","input_refs":["function calculateTax(amount, rate) { return amount * rate; }"]}
Use tool get_spend_stats_openai-worker-mcp with {}
Use tool get_token_analytics_openai-worker-mcp with {"period":"all"}
```

### Test 5: credit-optimizer-mcp
```
Use tool discover_tools_credit-optimizer-mcp with {"query":"github","limit":10}
Use tool get_credit_stats_credit-optimizer-mcp with {}
Use tool list_recipes_credit-optimizer-mcp with {}
Use tool list_blueprints_credit-optimizer-mcp with {}
Use tool diagnose_credit_optimizer_credit-optimizer-mcp with {}
```

### Test 6: robinsons-toolkit-mcp
```
Use tool diagnose_environment_robinsons-toolkit-mcp with {}
Use tool discover_tools_robinsons-toolkit-mcp with {"query":"vercel"}
Use tool broker_stats_robinsons-toolkit-mcp with {}
Use tool list_tools_by_server_credit-optimizer-mcp with {"server":"github-mcp"}
```

---

## Expected Results

### Success Criteria
- ✅ All 6 servers respond without errors
- ✅ Ollama models are accessible (qwen2.5:3b, deepseek-coder:33b, qwen2.5-coder:32b)
- ✅ OpenAI budget enforcement is active ($25 monthly limit)
- ✅ Broker can discover 1,197+ tools across 13 integrations
- ✅ Autonomous agent shows 62,500+ credits saved
- ✅ No connection errors or timeouts

### Performance Benchmarks
- thinking-tools-mcp: < 1s response time
- autonomous-agent-mcp: 30-60s for code generation (local Ollama)
- architect-mcp: 10-45s for planning (depends on spec complexity)
- openai-worker-mcp: 2-5s for API calls
- credit-optimizer-mcp: < 1s for queries
- robinsons-toolkit-mcp: < 1s for broker operations, 2-5s for spawning workers

### Cost Expectations
- thinking-tools-mcp: $0 (pure CPU)
- autonomous-agent-mcp: $0 (local Ollama)
- architect-mcp: $0 (local Ollama)
- openai-worker-mcp: ~$0.001 per test job
- credit-optimizer-mcp: $0 (no AI)
- robinsons-toolkit-mcp: $0 (broker only, integrations vary)

---

## Troubleshooting

### Ollama Connection Errors
```bash
# Check if Ollama is running
ollama --version
ollama list

# Restart Ollama service
# Windows: restart the Ollama app
# macOS: brew services restart ollama
# Linux: systemctl restart ollama
```

### OpenAI Budget Exceeded
```
# Check current spend
Use tool get_spend_stats_openai-worker-mcp with {}

# If over budget, wait until next month or increase MONTHLY_BUDGET in config
```

### Broker "Not Connected" Errors
```
# Restart VS Code completely
# Check Augment MCP panel for server errors
# Verify robinsons-toolkit-mcp has credentials in env section
```

### Model Not Found
```bash
# Pull missing models
ollama pull qwen2.5:3b
ollama pull deepseek-coder:33b
ollama pull qwen2.5-coder:32b
```

---

## Report Template

```markdown
## Smoke Test Results - {{DATE}}

### Server Status
- [ ] thinking-tools-mcp: PASS / FAIL
- [ ] autonomous-agent-mcp: PASS / FAIL
- [ ] architect-mcp: PASS / FAIL
- [ ] openai-worker-mcp: PASS / FAIL
- [ ] credit-optimizer-mcp: PASS / FAIL
- [ ] robinsons-toolkit-mcp: PASS / FAIL

### Performance
- Autonomous Agent Credits Saved: {{CREDITS_SAVED}}
- OpenAI Spend: ${{SPEND}} / $25
- Broker Active Workers: {{ACTIVE_WORKERS}}
- Total Tools Available: {{TOTAL_TOOLS}}

### Issues Found
{{LIST_ANY_ERRORS_OR_WARNINGS}}

### Notes
{{ADDITIONAL_OBSERVATIONS}}
```

---

## Maintenance Schedule

- **Daily:** Quick validation (run Test 1 & Test 6)
- **Weekly:** Full smoke test (all 6 tests)
- **Monthly:** Review OpenAI spend, update models, check for package updates
- **Quarterly:** Audit integration credentials, rotate API keys

---

**Last Updated:** {{TIMESTAMP}}  
**Maintained By:** Robinson AI Systems

