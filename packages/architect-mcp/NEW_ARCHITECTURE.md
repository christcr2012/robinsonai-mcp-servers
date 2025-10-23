# Architect MCP - New Architecture

## Overview

Architect MCP has been redesigned to eliminate timeouts and generic plans through:
1. **Incremental Planning** - Returns plan_id in <5s, continues in background
2. **Spec Storage** - Handles large instructions (up to 200 KB) without timeout
3. **Plan Validation** - Rejects generic steps, enforces concrete requirements
4. **Step Templates** - Provides concrete patterns Architect fills
5. **Chunked Retrieval** - Pages large data to avoid memory issues

---

## Key Changes

### Before (Old Architecture)
```javascript
// ❌ Problem: Timeouts on large goals
plan_work({ goal: "...10,000 words..." })
// Waits 3+ minutes, then times out

// ❌ Problem: Generic plans
{
  steps: [
    { tool: "scaffold_feature", params: { blueprint: "[Blueprint for RAD Phase 1]" } }
  ]
}
// Optimizer can't execute this
```

### After (New Architecture)
```javascript
// ✅ Solution: Submit spec first
submit_spec({ title: "RAD Phase 1", text: "...10,000 words..." })
// Returns: { spec_id: 123, size_bytes: 50000 }

// ✅ Solution: Plan returns immediately
plan_work({ spec_id: 123, mode: "skeleton" })
// Returns in <5s: { plan_id: 456, summary: "Planning in background..." }

// ✅ Solution: Monitor progress
get_plan_status({ plan_id: 456 })
// Returns: { state: "planning", progress: 45, steps_count: 3 }

// ✅ Solution: Validated concrete steps
export_workplan_to_optimizer({ plan_id: 456 })
// Returns: {
//   workflow: {
//     steps: [
//       {
//         repo: "robinsonai-mcp-servers",
//         branch: "main",
//         files: ["packages/rad-crawler-mcp/scripts/deploy-schema.mjs"],
//         tool: "file.patch_edit",
//         params: { old_str: "...", new_str: "...", start_line: 10, end_line: 15 },
//         diff_policy: "patch-only",
//         tests: ["npm test -- deploy-schema.test.ts"]
//       }
//     ],
//     validation: { passed: true, warnings: [] }
//   }
// }
```

---

## New Tools

### Spec Management

#### `submit_spec`
Store large specifications (max 200 KB).

**Input:**
```json
{
  "title": "RAD Phase 1: Neon Schema",
  "text": "...large specification..."
}
```

**Output:**
```json
{
  "spec_id": 123,
  "size_bytes": 50000,
  "message": "Spec stored successfully"
}
```

#### `get_spec_chunk`
Retrieve spec in 8 KB chunks.

**Input:**
```json
{
  "spec_id": 123,
  "from": 0,
  "size": 8192
}
```

#### `decompose_spec`
Break spec into work items.

**Input:**
```json
{
  "spec_id": 123,
  "max_item_size": 5000
}
```

**Output:**
```json
{
  "work_items": [
    {
      "title": "Phase 1: Core Implementation",
      "acceptance_tests": ["Unit tests pass"],
      "repo_targets": ["packages/*/src/**/*.ts"],
      "risk": "medium",
      "estimate": "2-4 hours"
    }
  ]
}
```

### Planning (Incremental)

#### `plan_work`
Create plan (returns immediately with plan_id).

**Input:**
```json
{
  "goal": "Deploy RAD schema",
  "spec_id": 123,
  "mode": "skeleton",
  "budgets": {
    "max_steps": 12,
    "time_ms": 90000,
    "max_files_changed": 40
  }
}
```

**Output (in <5s):**
```json
{
  "plan_id": 456,
  "summary": "Plan created. Planning in background..."
}
```

#### `get_plan_status`
Monitor planning progress.

**Output:**
```json
{
  "plan_id": 456,
  "state": "planning",
  "progress": 75,
  "steps_count": 8,
  "error": null
}
```

#### `get_plan_chunk`
Retrieve plan steps in chunks.

**Input:**
```json
{
  "plan_id": 456,
  "from": 0,
  "size": 10
}
```

#### `export_workplan_to_optimizer`
Export validated plan.

**Validation Rules:**
Every step MUST have:
1. `repo` + `branch`
2. `files` array or `glob` pattern (no placeholders)
3. `tool` (specific MCP tool like "github.open_pr_with_changes")
4. `params` (all required params filled)
5. `diff_policy: "patch-only"`
6. `tests` or `success_signals` (specific commands/files)

**If validation fails:**
```json
{
  "error": "Plan validation failed",
  "errors": [
    {
      "step_index": 0,
      "step_title": "Deploy schema",
      "errors": [
        "Missing required field: repo",
        "Generic file path not allowed: '[TODO]'"
      ]
    }
  ]
}
```

**Fix with:** `revise_plan({ plan_id: 456 })` then re-export.

### Templates

#### `list_templates`
List available step templates.

**Output:**
```json
{
  "templates": [
    {
      "name": "github.open_pr_with_changes",
      "description": "Create GitHub PR with file changes",
      "required_params": ["owner", "repo", "title", "changes"]
    }
  ]
}
```

#### `get_template`
Get template details with example.

---

## Environment Variables

```bash
# Planning timeouts
ARCHITECT_PLANNER_TIME_MS=90000      # Max planning time (default: 90s)
ARCHITECT_PLANNER_SLICE_MS=5000      # Planning slice duration (default: 5s)

# Budgets
ARCHITECT_MAX_STEPS=12               # Max steps per plan (default: 12)
ARCHITECT_MAX_FILES_CHANGED=40       # Max files per plan (default: 40)

# Models (unchanged)
ARCHITECT_FAST_MODEL=qwen2.5:3b
ARCHITECT_STD_MODEL=deepseek-coder:33b
ARCHITECT_BIG_MODEL=qwen2.5-coder:32b
```

---

## Workflow

### 1. Submit Large Spec
```javascript
const spec = await submit_spec({
  title: "RAD Complete Implementation",
  text: fs.readFileSync('RAD_MASTER_PLAN.md', 'utf8')
});
// Returns: { spec_id: 123 }
```

### 2. Decompose Into Work Items
```javascript
const items = await decompose_spec({ spec_id: 123 });
// Returns: { work_items: [...] }
```

### 3. Plan Each Item
```javascript
const plan = await plan_work({
  spec_id: 123,
  mode: "part:Phase 1",
  budgets: { max_steps: 5, max_files_changed: 10 }
});
// Returns immediately: { plan_id: 456 }
```

### 4. Monitor Progress
```javascript
while (true) {
  const status = await get_plan_status({ plan_id: 456 });
  console.log(`Progress: ${status.progress}%`);
  
  if (status.state === 'done') break;
  await sleep(2000);
}
```

### 5. Export and Validate
```javascript
const result = await export_workplan_to_optimizer({ plan_id: 456 });

if (result.workflow) {
  // Validation passed
  await credit_optimizer.execute_autonomous_workflow(result.workflow);
} else {
  // Validation failed
  await revise_plan({ plan_id: 456 });
  // Then re-export
}
```

---

## Testing

```bash
# Build
cd packages/architect-mcp
npm run build

# Run smoke test
node test/smoke-test-new-arch.mjs
```

**Expected output:**
```
✓ Spec submitted: ID=1, size=1234 bytes
✓ Spec decomposed: 1 work items
✓ Plan created in 234ms: plan_id=1
   Progress: 20%, state=planning, steps=1
   Progress: 60%, state=planning, steps=3
   Progress: 100%, state=done, steps=5
✓ Planning complete: 5 steps generated
✓ Retrieved chunk: 3 steps (total: 5)
✓ Plan exported successfully
   Validation: PASSED
✓ Found 10 templates
✅ All tests passed!
```

---

## Migration Guide

### Old Code
```javascript
// ❌ Old way (times out)
const result = await architect.plan_work({
  goal: "Very long goal description..."
});
```

### New Code
```javascript
// ✅ New way (fast)
const spec = await architect.submit_spec({
  title: "Project Goal",
  text: "Very long goal description..."
});

const plan = await architect.plan_work({
  spec_id: spec.spec_id,
  mode: "skeleton"
});

// Wait for completion
let status;
do {
  await sleep(2000);
  status = await architect.get_plan_status({ plan_id: plan.plan_id });
} while (status.state === 'planning');

// Export
const workflow = await architect.export_workplan_to_optimizer({
  plan_id: plan.plan_id
});
```

---

## Benefits

1. **No More Timeouts** - plan_work returns in <5s, planning continues in background
2. **Handles Large Specs** - Up to 200 KB specifications stored in DB
3. **Concrete Plans** - Validator rejects generic/placeholder steps
4. **Incremental Progress** - Monitor planning with get_plan_status
5. **Memory Efficient** - Chunked retrieval for large plans/specs
6. **Template-Driven** - Concrete patterns prevent free-form fluff
7. **Validated Output** - export_workplan_to_optimizer enforces quality

---

## Next Steps

1. ✅ Core architecture implemented
2. → Integrate with RAD crawler for context
3. → Add LLM-based decompose_spec implementation
4. → Add LLM-based revise_plan implementation
5. → Test with real large projects

