# Tool Parity Analysis: Free Agent vs Paid Agent

## Tool Counts (VERIFIED)
- **Free Agent:** 29 tools (26 explicit + 3 imported)
- **Paid Agent:** 39 tools (36 explicit + 3 imported)
- **Difference:** 10 extra tools in Paid Agent

## Tools ONLY in Paid Agent (7 tools)

### OpenAI Worker Tools (8 tools - PAID ONLY)
1. `openai_worker_run_job` - Execute job with OpenAI workers
2. `openai_worker_queue_batch` - Queue batch jobs
3. `openai_worker_get_job_status` - Get job status
4. `openai_worker_get_spend_stats` - Get spend statistics
5. `openai_worker_estimate_cost` - Estimate cost before running
6. `openai_worker_get_capacity` - Get worker capacity
7. `openai_worker_refresh_pricing` - Refresh pricing data
8. `openai_worker_get_token_analytics` - Get token analytics (DUPLICATE!)

### Toolkit Discovery Tools (2 tools - DIFFERENT NAMESPACES)
9. `discover_toolkit_tools_openai-worker-mcp` (Paid uses this)
   - Free Agent uses: `discover_toolkit_tools_autonomous-agent-mcp`
10. `list_toolkit_categories_openai-worker-mcp` (Paid uses this)
   - Free Agent uses: `list_toolkit_categories_autonomous-agent-mcp`
11. `list_toolkit_tools_openai-worker-mcp` (Paid uses this)
   - Free Agent uses: `list_toolkit_tools_autonomous-agent-mcp`

### Thinking Tools Discovery (2 tools - PAID ONLY)
12. `discover_thinking_tools_paid-agent-mcp`
13. `list_thinking_tools_paid-agent-mcp`

## Shared Tools (Both Agents Have These)

**Batch Execution & Debugging (3 tools):**
1. `run_parallel` - Run many free_agent_run jobs concurrently (NOT a debugging tool - it's for batch operations!)
2. `paths_probe` - Resolve repo + registry paths for debugging
3. `generator_probe` - Show which generator module resolves

## Deprecated Tools

### Free Agent
- `delegate_code_generation` - **DEPRECATED** (marked in description: "Use free_agent_run instead")

## Duplicate/Overlapping Tools

### Token Analytics (DUPLICATE!)
- Paid Agent has TWO token analytics tools:
  1. `openai_worker_get_token_analytics` (OpenAI worker specific)
  2. `get_token_analytics` (general agent analytics)
- Free Agent has ONE:
  1. `get_token_analytics` (general agent analytics)

## Recommendations

### 1. Remove Deprecated Tools
**Safe to remove:**
- `delegate_code_generation` from Free Agent (marked DEPRECATED, forwards to free_agent_run)

### 2. Add Missing Tools to Paid Agent
**Should add to Paid Agent:**
- `run_parallel` - Useful for batch operations
- `paths_probe` - Useful for debugging
- `generator_probe` - Useful for debugging

### 3. Namespace Consistency
**Issue:** Toolkit discovery tools use different namespaces
- Free Agent: `*_autonomous-agent-mcp`
- Paid Agent: `*_openai-worker-mcp`

**Recommendation:** Standardize to agent-specific namespaces:
- Free Agent: `*_free-agent-mcp`
- Paid Agent: `*_paid-agent-mcp`

### 4. Thinking Tools Discovery
**Issue:** Only Paid Agent has thinking tools discovery
**Recommendation:** Add to Free Agent for consistency

## Summary

**Current State:**
- Paid Agent: 36 tools (8 OpenAI-specific, 28 general)
- Free Agent: 29 tools (1 deprecated, 28 active)

**After Cleanup:**
- Remove 1 deprecated tool from Free Agent → 28 tools
- Add 3 missing tools to Paid Agent (run_parallel, paths_probe, generator_probe) → 39 tools
- Add 2 thinking tools discovery to Free Agent → 30 tools

**Final State:**
- Free Agent: 30 tools (all active, no deprecated)
- Paid Agent: 39 tools (8 OpenAI-specific + 31 general)

