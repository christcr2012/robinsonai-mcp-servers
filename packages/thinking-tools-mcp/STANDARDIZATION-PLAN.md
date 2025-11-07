# Thinking Tools MCP - Standardization Plan

**Created:** 2025-01-06  
**Status:** Phase 0 - In Progress

---

## Current Tool Inventory (64 tools)

### Category: Cognitive Frameworks (18 tools)
**Current naming:** Inconsistent - no category prefix

- `devils_advocate` → `framework_devils_advocate`
- `first_principles` → `framework_first_principles`
- `root_cause` → `framework_root_cause`
- `swot_analysis` → `framework_swot`
- `premortem_analysis` → `framework_premortem`
- `critical_thinking` → `framework_critical_thinking`
- `lateral_thinking` → `framework_lateral_thinking`
- `red_team` → `framework_red_team`
- `blue_team` → `framework_blue_team`
- `decision_matrix` → `framework_decision_matrix`
- `socratic_questioning` → `framework_socratic`
- `systems_thinking` → `framework_systems_thinking`
- `scenario_planning` → `framework_scenario_planning`
- `brainstorming` → `framework_brainstorming`
- `mind_mapping` → `framework_mind_mapping`
- `sequential_thinking` → `framework_sequential_thinking`
- `parallel_thinking` → `framework_parallel_thinking`
- `reflective_thinking` → `framework_reflective_thinking`

### Category: Context Engine (13 tools)
**Current naming:** Mostly consistent with `context_` prefix

- `context_index_repo` → ✅ Keep
- `context_index_full` → ✅ Keep
- `ensure_fresh_index` → `context_ensure_fresh_index`
- `context_query` → ✅ Keep
- `context_stats` → ✅ Keep
- `context_reset` → ✅ Keep
- `context_ingest_urls` → ✅ Keep
- `context_summarize_diff` → ✅ Keep
- `context_neighborhood` → ✅ Keep
- `context_retrieve_code` → ✅ Keep
- `context_find_symbol` → ✅ Keep
- `context_find_callers` → ✅ Keep
- `context_preview` → ✅ Keep
- `context_audit` → ✅ Keep

### Category: Context7 Integration (6 tools)
**Current naming:** Consistent with `context7_` prefix

- `context7_resolve_library_id` → ✅ Keep
- `context7_get_library_docs` → ✅ Keep
- `context7_search_libraries` → ✅ Keep
- `context7_compare_versions` → ✅ Keep
- `context7_get_examples` → ✅ Keep
- `context7_get_migration_guide` → ✅ Keep

### Category: Documentation Intelligence (5 tools)
**Current naming:** Consistent with `docs_` prefix

- `docs_find` → ✅ Keep
- `docs_audit_repo` → ✅ Keep
- `docs_find_duplicates` → ✅ Keep
- `docs_mark_deprecated` → ✅ Keep
- `docs_graph` → ✅ Keep

### Category: Web Tools (5 tools)
**Current naming:** Mixed - some `context_web_`, some `ctx_web_`

- `context_web_search` → ✅ Keep
- `context_web_search_and_import` → ✅ Keep
- `ctx_web_search` → `web_search` (duplicate?)
- `ctx_web_fetch` → `web_fetch`
- `ctx_web_crawl_step` → `web_crawl`

### Category: Evidence Collection (4 tools)
**Current naming:** Mixed - `ctx_`, `think_`

- `ctx_import_evidence` → `evidence_import`
- `ctx_merge_config` → `evidence_merge_config`
- `context7_adapter` → `evidence_context7_adapter`
- `think_collect_evidence` → `evidence_collect`

### Category: Thinking Artifacts (6 tools)
**Current naming:** Consistent with `think_` prefix

- `think_swot` → `artifact_swot`
- `think_devils_advocate` → `artifact_devils_advocate`
- `think_premortem` → `artifact_premortem`
- `think_decision_matrix` → `artifact_decision_matrix`
- `think_critique_checklist` → `artifact_critique_checklist`
- `think_auto_packet` → `artifact_auto_packet`

### Category: LLM Rewrite (2 tools)
**Current naming:** Consistent with `think_llm_` prefix

- `think_llm_rewrite_prep` → `llm_rewrite_prep`
- `think_llm_apply` → `llm_rewrite_apply`

### Category: Validation (2 tools)
**Current naming:** Mixed

- `thinking_tools_validate` → `validation_tools`
- `think_validate_artifacts` → `validation_artifacts`

### Category: Health (2 tools)
**Current naming:** Mixed

- `thinking_tools_health_check` → `health_check`
- `healthcheck` → `health_ping` (legacy)

---

## Standardization Rules

### 1. Naming Convention

**Pattern:** `{category}_{action}` or `{category}_{resource}_{action}`

**Categories:**
- `framework_` - Cognitive frameworks (stateful thinking tools)
- `context_` - Context engine (indexing, search, retrieval)
- `context7_` - Context7 library integration
- `docs_` - Documentation intelligence
- `web_` - Web search and crawling
- `evidence_` - Evidence collection and import
- `artifact_` - Thinking artifacts (auto-generated analysis)
- `llm_` - LLM rewrite tools
- `validation_` - Validation tools
- `health_` - Health check tools

### 2. Standard Parameters

**Framework Initialization:**
```typescript
{
  problem: string;        // Required - what to analyze
  context?: string;       // Optional - additional context
  totalSteps?: number;    // Optional - expected steps (default: 5)
}
```

**Framework Step Recording:**
```typescript
{
  stepNumber: number;     // Required - current step
  content: string;        // Required - your analysis
  nextStepNeeded: boolean; // Required - continue?
  metadata?: object;      // Optional - additional data
}
```

**Search/Query Operations:**
```typescript
{
  query: string;          // Required - search query
  limit?: number;         // Optional - max results (default: 12)
  filter?: object;        // Optional - filters
}
```

**List Operations:**
```typescript
{
  type?: string;          // Optional - filter by type
  status?: string;        // Optional - filter by status
  limit?: number;         // Optional - max results (default: 25)
}
```

### 3. Standard Response Format

**All tools return:**
```typescript
{
  success: boolean;       // Operation success
  data: any;              // Response data (string, object, or array)
  meta?: {
    // For frameworks
    stepNumber?: number;
    totalSteps?: number;
    nextStepNeeded?: boolean;
    
    // For lists
    total?: number;
    limit?: number;
    has_more?: boolean;
    
    // For operations
    timestamp?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

---

## Implementation Checklist

### Phase 0.1: Rename Tools (64 tools)
- [ ] Cognitive Frameworks (18 renames)
- [ ] Context Engine (1 rename: `ensure_fresh_index`)
- [ ] Web Tools (3 renames)
- [ ] Evidence Collection (4 renames)
- [ ] Thinking Artifacts (6 renames)
- [ ] LLM Rewrite (2 renames)
- [ ] Validation (2 renames)
- [ ] Health (1 rename)

### Phase 0.2: Standardize Parameters
- [ ] Update all framework tools to use standard init/step params
- [ ] Update all search tools to use standard query params
- [ ] Update all list tools to use standard list params

### Phase 0.3: Standardize Responses
- [ ] Wrap all responses in `{ success, data, meta, error }` format
- [ ] Update all handlers to return standard format

### Phase 0.4: Update InitializeRequestSchema
- [ ] Update metadata with accurate tool names
- [ ] Update categories with correct tool counts
- [ ] Add standardization documentation

### Phase 0.5: Update Documentation
- [ ] Update README with new tool names
- [ ] Update examples with new naming
- [ ] Add migration guide for breaking changes

---

## Breaking Changes

**All tool names are changing!** This is a major version bump (v1.21.5 → v2.0.0)

**Migration Guide:**
- Old: `devils_advocate` → New: `framework_devils_advocate`
- Old: `swot_analysis` → New: `framework_swot`
- Old: `ctx_import_evidence` → New: `evidence_import`
- Old: `think_collect_evidence` → New: `evidence_collect`
- (See full list above)

**Response format is changing!** All tools now return `{ success, data, meta, error }`

---

## Next Steps

1. Create script to rename all tools in registry
2. Update all tool descriptors with new names
3. Update all handlers to return standard format
4. Update InitializeRequestSchema metadata
5. Build and test
6. Update CHANGELOG
7. Publish v2.0.0

