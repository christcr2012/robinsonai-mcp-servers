# Full Pipeline Test Plan

## ✅ Implementation Complete

### What Changed:

1. **`run_plan_steps` tool** - Executes validated plans locally
2. **`export_workplan_to_optimizer` modified** - Now calls `run_plan_steps` automatically

### New Workflow:

```
1. plan_work() → plan_id (returns in <5s)
2. get_plan_status() → wait for state="done"
3. export_workplan_to_optimizer() → validates + executes automatically
4. ✅ Done! No manual execution needed
```

---

## 🧪 Test After Restart

### Test 1: Simple Plan Execution

```javascript
// Step 1: Create a plan
const plan = await architect.plan_work({
  spec_id: 1,
  mode: "skeleton",
  budgets: { max_steps: 3, time_ms: 60000, max_files_changed: 5 }
});

// Step 2: Wait for planning to complete
await sleep(5000);
const status = await architect.get_plan_status({ plan_id: plan.plan_id });
console.log(status); // Should show state: "done"

// Step 3: Export and execute (automatic!)
const result = await architect.export_workplan_to_optimizer({ plan_id: plan.plan_id });

// Expected result:
// {
//   plan_id: X,
//   total_steps: 2,
//   executed: 2,
//   succeeded: 2,
//   failed: 0,
//   duration_ms: ~4000,
//   results: [
//     { step: 1, title: "Install...", status: "success", ... },
//     { step: 2, title: "Verify...", status: "success", ... }
//   ],
//   message: "Plan executed successfully (2/2 steps)"
// }
```

### Test 2: Validation Failure

Create a plan with invalid steps to test validator:

```javascript
// This should fail validation (if planner generates invalid steps)
const plan = await architect.plan_work({
  goal: "Do something impossible",
  mode: "skeleton"
});

await sleep(5000);

const result = await architect.export_workplan_to_optimizer({ plan_id: plan.plan_id });

// Expected: Validation error message
```

### Test 3: Execution Failure

Create a plan that will fail during execution:

```javascript
// Create a plan that runs a failing command
// (This would require modifying the planner to generate a failing step)
```

---

## 📊 Expected Behavior

### Success Case:
1. Plan validates ✅
2. Steps execute sequentially ✅
3. All steps succeed ✅
4. Returns detailed results ✅

### Validation Failure:
1. Plan validates ❌
2. Returns validation errors
3. No execution happens

### Execution Failure:
1. Plan validates ✅
2. Steps execute until failure
3. Returns partial results
4. Shows which step failed

---

## 🎯 Benefits

### Before:
```
1. plan_work() → plan_id
2. get_plan_status() → wait
3. export_workplan_to_optimizer() → workflow object
4. ??? (Credit Optimizer can't execute)
5. Manual execution in Augment
```

### After:
```
1. plan_work() → plan_id
2. get_plan_status() → wait
3. export_workplan_to_optimizer() → ✅ DONE!
```

**3 steps instead of 5!**

---

## 🔧 Technical Details

### Modified Function:

**File**: `packages/architect-mcp/src/tools/plan.ts`

**Before**:
```typescript
export async function handleExportWorkplan(args: { plan_id: number }) {
  // Validate plan
  // Return workflow object
}
```

**After**:
```typescript
export async function handleExportWorkplan(args: { plan_id: number }) {
  // Validate plan
  // Execute via run_plan_steps()
  return await handleRunPlanSteps({ plan_id: args.plan_id });
}
```

### Why This Works:

1. **Validation still happens** - Plan is validated before execution
2. **Automatic execution** - No manual intervention needed
3. **Detailed results** - Same format as `run_plan_steps`
4. **Fail-fast** - Stops on first error
5. **Backward compatible** - Can revert when Credit Optimizer supports tools

---

## 🚀 Future Enhancement

When Credit Optimizer supports arbitrary tool execution:

```typescript
export async function handleExportWorkplan(args: { plan_id: number }) {
  // Validate plan
  
  // Check environment variable
  if (process.env.USE_CREDIT_OPTIMIZER === 'true') {
    // Export workflow for Credit Optimizer
    return toText({ workflow, message: '...' });
  } else {
    // Execute locally
    return await handleRunPlanSteps({ plan_id: args.plan_id });
  }
}
```

This allows switching between local and remote execution.

---

## ✅ Checklist

- [x] `run_plan_steps` tool implemented
- [x] `export_workplan_to_optimizer` modified
- [x] Builds successfully
- [ ] Augment restarted
- [ ] Test 1: Simple execution
- [ ] Test 2: Validation failure
- [ ] Test 3: Execution failure
- [ ] Documentation updated

---

## 📝 Next Steps

1. **Restart Augment** - Load the modified `export_workplan_to_optimizer`
2. **Run Test 1** - Verify full pipeline works
3. **Create more complex plans** - Test with real RAD work
4. **Monitor performance** - Track execution times
5. **Add more tool support** - Extend `executeStep()` for other MCP tools

---

## 🎉 Success Criteria

✅ Plan validates automatically  
✅ Plan executes automatically  
✅ Results are detailed and accurate  
✅ Failures are handled gracefully  
✅ No manual intervention needed  

**When all tests pass, the 4-server orchestration is fully functional!**

