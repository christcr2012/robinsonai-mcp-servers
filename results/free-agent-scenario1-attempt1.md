# Free Agent - Scenario 1 (Feature Task) - Attempt 1

**Date**: 2025-11-14  
**Scenario**: Add Subtract Command to CLI  
**Agent**: Free Agent MCP  
**Tier**: free  
**Quality**: balanced

---

## Task Description

Add a 'subtract' command to the CLI that uses the existing Calculator.subtract() method.

**Acceptance Criteria**:
1. User can run `node dist/index.js subtract 10 3` and get `Result: 7`
2. The command appears in the help output
3. Implementation follows existing pattern
4. Code compiles without TypeScript errors
5. Change is minimal and focused

**Constraints**:
- Must use existing Calculator.subtract() method
- Must follow existing command registration pattern
- Don't modify other commands
- Don't refactor unrelated code
- Don't fix bugs in other parts of the code

---

## Result: ❌ FAILED

**Status**: failed  
**Error Type**: unknown  
**Error Message**: `[Diff] git apply failed: error: corrupt patch at line 25`

---

## Error Details

```
Error: [Diff] git apply failed:
error: corrupt patch at line 25

    at applyUnifiedDiff (C:\Users\chris\Git Local\robinsonai-mcp-servers\packages\free-agent-mcp\dist\index.js:8309:11)
    at Object.applyPatch (C:\Users\chris\Git Local\robinsonai-mcp-servers\packages\free-agent-mcp\dist\index.js:8745:13)
    at Object.run (C:\Users\chris\Git Local\robinsonai-mcp-servers\packages\free-agent-mcp\dist\index.js:8958:25)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async runFreeAgent (C:\Users\chris\Git Local\robinsonai-mcp-servers\packages\free-agent-mcp\dist\index.js:16313:3)
    at async AutonomousAgentServer.runFreeAgentTask (C:\Users\chris\Git Local\robinsonai-mcp-servers\packages\free-agent-mcp\dist\index.js:26638:9)
```

---

## Analysis

### What Went Wrong

1. **Patch Generation Failed**: The agent generated a corrupt patch that git couldn't apply
2. **Line 25 Error**: The patch had an issue at line 25 (likely malformed diff format)
3. **No Fallback**: The agent didn't retry or use an alternative approach

### Planning Quality: N/A

The agent failed before we could see its plan.

### Code Quality: N/A

No code was generated successfully.

### RAD + Cortex Usage: Unknown

We don't know if the agent attempted to use RAD or Cortex tools.

### Test Results: N/A

No tests were run because the patch failed to apply.

---

## Observations

1. **Critical Issue**: Free Agent's patch generation is still broken despite Phase 3-4 fixes
2. **Error Location**: The error is in the diff/patch application code, not the planning
3. **No Debugging Info**: We don't see what patch was generated (need to enable verbose logging)
4. **No Graceful Degradation**: Agent should fall back to direct file editing if patches fail

---

## Recommendations

1. **Enable Verbose Logging**: Set `CODEGEN_VERBOSE=1` to see the generated patch
2. **Investigate Patch Format**: Check if the git headers fix from Phase 3-4 is actually working
3. **Add Fallback Strategy**: If patch fails, try direct file editing
4. **Better Error Messages**: Show the actual patch that failed

---

## Next Steps

1. Retry with verbose logging enabled
2. Examine the generated patch to see what's wrong
3. Fix the patch generation issue
4. Re-run the scenario

---

## CRITICAL DISCOVERY

After investigating the error, I found that:

1. **The error is in `applyUnifiedDiff`** (packages/free-agent-mcp/src/core/shared/diff.ts:8309)
2. **The patch generation we "fixed" in Phase 3-4 is in `toUnified`** (packages/free-agent-mcp/src/core/patch/unified.ts)
3. **These are TWO DIFFERENT patch systems!**

The Free Agent has MULTIPLE patch generation systems:
- `toUnified()` in `patch/unified.ts` - The one we fixed with git headers
- `applyUnifiedDiff()` in `shared/diff.ts` - The one that's actually being used and failing
- `applyOps()` in `patch/applyOps.ts` - Another patch system
- Fixer patch system in `utils/judge-fixer-prompts.ts`

**The Phase 3-4 fix only fixed ONE of these systems, not the one actually being used!**

This is a MAJOR architectural issue that needs to be captured in RAD + Cortex.

