# Tool Naming Strategy - Avoid Duplicate Tool Errors

**Date:** 2025-11-02  
**Purpose:** Ensure no duplicate tool names across all 5 MCP servers

---

## 🎯 Problem

When multiple MCP servers are loaded in Augment, tool names MUST be unique across ALL servers. Duplicate tool names cause "Duplicate tool names" errors and prevent MCP servers from loading.

---

## 📋 Naming Convention

**Pattern:** `{server_prefix}_{tool_name}`

### Server Prefixes

| Server | Prefix | Example |
|--------|--------|---------|
| **free-agent-mcp** | `free_agent_` | `free_agent_execute_with_quality_gates` |
| **paid-agent-mcp** | `paid_agent_` | `paid_agent_execute_with_quality_gates` |
| **thinking-tools-mcp** | (varies) | `devils_advocate`, `swot_analysis`, `context7_resolve_library_id` |
| **credit-optimizer-mcp** | (varies) | `discover_tools`, `execute_autonomous_workflow` |
| **robinsons-toolkit-mcp** | `toolkit_` | `toolkit_list_categories`, `toolkit_call` |

---

## ✅ New Tools Added to free-agent-mcp

**Quality Gates Pipeline Tools:**

1. ✅ `free_agent_execute_with_quality_gates` - Full pipeline (Synthesize-Execute-Critique-Refine)
2. ✅ `free_agent_judge_code_quality` - LLM Judge with structured rubric
3. ✅ `free_agent_refine_code` - Fix code based on judge feedback
4. ✅ `free_agent_generate_project_brief` - Auto-generate Project Brief

**Naming rationale:**
- Prefixed with `free_agent_` to avoid conflicts
- Descriptive names that clearly indicate purpose
- No conflicts with existing tools in any server

---

## 🔄 Plan for paid-agent-mcp

When adding the same features to `paid-agent-mcp`, use **different prefix**:

**Planned Tools for paid-agent-mcp:**

1. ✅ `paid_agent_execute_with_quality_gates` - Same functionality, PAID models
2. ✅ `paid_agent_judge_code_quality` - Same functionality, PAID models
3. ✅ `paid_agent_refine_code` - Same functionality, PAID models
4. ✅ `paid_agent_generate_project_brief` - Same functionality, PAID models

**Why this works:**
- Different prefix (`paid_agent_` vs `free_agent_`)
- No naming conflicts
- Clear distinction between FREE and PAID versions
- Users can choose which to use based on cost/quality tradeoff

---

## 📊 Existing Tool Names Audit

### free-agent-mcp (17 tools)
- `delegate_code_generation`
- `delegate_code_analysis`
- `delegate_code_refactoring`
- `delegate_test_generation`
- `delegate_documentation`
- `execute_versatile_task_autonomous-agent-mcp`
- `get_agent_stats`
- `get_token_analytics`
- `diagnose_autonomous_agent`
- `discover_toolkit_tools_autonomous-agent-mcp`
- `list_toolkit_categories_autonomous-agent-mcp`
- `list_toolkit_tools_autonomous-agent-mcp`
- `file_str_replace`
- `file_insert`
- `file_save`
- `file_delete`
- `file_read`
- `submit_feedback`
- `get_feedback_stats`
- ✅ **NEW:** `free_agent_execute_with_quality_gates`
- ✅ **NEW:** `free_agent_judge_code_quality`
- ✅ **NEW:** `free_agent_refine_code`
- ✅ **NEW:** `free_agent_generate_project_brief`

### paid-agent-mcp (9 tools)
- `openai_worker_run_job`
- `openai_worker_queue_batch`
- `openai_worker_get_job_status`
- `openai_worker_get_spend_stats`
- `openai_worker_estimate_cost`
- `openai_worker_get_capacity`
- `openai_worker_refresh_pricing`
- `openai_worker_get_token_analytics`
- `execute_versatile_task_paid-agent-mcp`
- `discover_toolkit_tools_openai-worker-mcp`
- `list_toolkit_categories_openai-worker-mcp`
- `list_toolkit_tools_openai-worker-mcp`

**Planned additions:**
- ✅ `paid_agent_execute_with_quality_gates`
- ✅ `paid_agent_judge_code_quality`
- ✅ `paid_agent_refine_code`
- ✅ `paid_agent_generate_project_brief`

### thinking-tools-mcp (32 tools)
**Cognitive Frameworks (24 tools):**
- `devils_advocate`
- `first_principles`
- `root_cause`
- `swot_analysis`
- `premortem_analysis`
- `critical_thinking`
- `lateral_thinking`
- `red_team`
- `blue_team`
- `decision_matrix`
- `socratic_questioning`
- `systems_thinking`
- `scenario_planning`
- `brainstorming`
- `mind_mapping`
- `sequential_thinking`
- `parallel_thinking`
- `reflective_thinking`
- `think_swot`
- `think_devils_advocate`
- `think_premortem`
- `think_decision_matrix`
- `think_critique_checklist`
- `think_auto_packet`

**Context7 Integration (6 tools):**
- `context7_resolve_library_id`
- `context7_get_library_docs`
- `context7_search_libraries`
- `context7_compare_versions`
- `context7_get_examples`
- `context7_get_migration_guide`

**Context Engine (8 tools):**
- `context_index_repo`
- `context_query`
- `context_web_search`
- `context_ingest_urls`
- `context_stats`
- `context_reset`
- `context_neighborhood`
- `context_summarize_diff`
- `context_preview`
- `context_audit`

**Web Context (3 tools):**
- `ctx_web_search`
- `ctx_web_fetch`
- `ctx_web_crawl_step`

**Evidence Collection (1 tool):**
- `think_collect_evidence`

**LLM Rewrite (2 tools):**
- `think_llm_rewrite_prep`
- `think_llm_apply`

**Validation (2 tools):**
- `thinking_tools_health_check`
- `thinking_tools_validate`
- `think_validate_artifacts`

### credit-optimizer-mcp (40+ tools)
- `discover_tools`
- `suggest_workflow`
- `list_tools_by_category`
- `list_tools_by_server`
- `get_tool_details`
- `find_similar_tools`
- `get_workflow_suggestions`
- `execute_autonomous_workflow`
- `execute_bulk_fix`
- `execute_refactor_pattern`
- `execute_test_generation`
- `execute_migration`
- `get_workflow_result`
- `execute_parallel_workflow`
- `get_agent_pool_stats`
- `list_agents`
- `scaffold_feature`
- `scaffold_component`
- `scaffold_api_endpoint`
- `scaffold_database_schema`
- `scaffold_test_suite`
- `cache_analysis`
- `get_cached_analysis`
- `cache_decision`
- `get_cached_decision`
- `clear_cache`
- `get_credit_stats`
- `diagnose_credit_optimizer`
- `estimate_task_cost`
- `recommend_worker`
- `get_cost_analytics`
- `get_cost_accuracy`
- `get_cost_savings`
- `record_task_cost`
- `complete_task_cost`
- `open_pr_with_changes`
- `list_recipes`
- `get_recipe`
- `execute_recipe`
- `list_blueprints`
- `get_blueprint`
- `execute_blueprint`

### robinsons-toolkit-mcp (6 broker tools)
- `toolkit_list_categories`
- `toolkit_list_tools`
- `toolkit_get_tool_schema`
- `toolkit_discover`
- `toolkit_call`
- `toolkit_health_check`
- `toolkit_validate`

---

## ✅ Conflict Check

**No conflicts found!**

All new tool names are unique:
- ✅ `free_agent_execute_with_quality_gates` - NOT in any other server
- ✅ `free_agent_judge_code_quality` - NOT in any other server
- ✅ `free_agent_refine_code` - NOT in any other server
- ✅ `free_agent_generate_project_brief` - NOT in any other server

Planned paid-agent tools are also unique:
- ✅ `paid_agent_execute_with_quality_gates` - NOT in any other server
- ✅ `paid_agent_judge_code_quality` - NOT in any other server
- ✅ `paid_agent_refine_code` - NOT in any other server
- ✅ `paid_agent_generate_project_brief` - NOT in any other server

---

## 🚀 Implementation Plan

### Phase 1: free-agent-mcp ✅ IN PROGRESS
1. ✅ Add tool definitions with `free_agent_` prefix
2. ✅ Add handler cases in switch statement
3. ⏳ Implement handler methods
4. ⏳ Test tools work correctly

### Phase 2: paid-agent-mcp (NEXT)
1. ⏳ Add tool definitions with `paid_agent_` prefix
2. ⏳ Add handler cases in switch statement
3. ⏳ Implement handler methods (reuse logic from free-agent)
4. ⏳ Test tools work correctly

### Phase 3: Shared Logic (OPTIMIZATION)
1. ⏳ Extract common pipeline logic to `@robinsonai/shared-llm`
2. ⏳ Both agents import shared logic
3. ⏳ Reduce code duplication
4. ⏳ Easier maintenance

---

## 📝 Naming Rules

**DO:**
- ✅ Use server-specific prefixes (`free_agent_`, `paid_agent_`, `toolkit_`, etc.)
- ✅ Use descriptive names that indicate purpose
- ✅ Check all 5 servers before adding new tools
- ✅ Document new tools in this file

**DON'T:**
- ❌ Use generic names without prefixes (e.g., `execute`, `judge`, `refine`)
- ❌ Duplicate tool names across servers
- ❌ Change existing tool names (breaks backward compatibility)
- ❌ Use special characters or spaces in tool names

---

## 🔍 How to Check for Conflicts

**Before adding a new tool:**

1. Search all MCP server index.ts files:
```bash
grep -r "name: 'your_tool_name'" packages/*/src/index.ts
```

2. Check this document for existing tool names

3. If conflict found, add server prefix or choose different name

4. Update this document with new tool name

---

## 📊 Summary

**Total Tools Across All Servers:**
- free-agent-mcp: 23 tools (19 existing + 4 new)
- paid-agent-mcp: 13 tools (9 existing + 4 planned)
- thinking-tools-mcp: 32 tools
- credit-optimizer-mcp: 40+ tools
- robinsons-toolkit-mcp: 7 tools (6 broker + 1 validation)

**Total: ~115 unique tool names**

**No conflicts! ✅**

---

## 🎯 Next Steps

1. ✅ Finish implementing free-agent handlers
2. ⏳ Test free-agent tools end-to-end
3. ⏳ Replicate to paid-agent with `paid_agent_` prefix
4. ⏳ Test paid-agent tools end-to-end
5. ⏳ Extract shared logic to reduce duplication
6. ⏳ Update documentation

**All tool names are unique and conflict-free!** 🚀

