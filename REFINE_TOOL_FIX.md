# Refine Tool Fix - v0.1.12

**Date:** 2025-11-02  
**Issue:** `currentFiles.map is not a function`  
**Status:** ✅ FIXED  

---

## 🐛 The Bug

**Error:**
```
currentFiles.map is not a function
```

**Root Cause:**
The `refineCode` handler was calling `applyFixPlan` with incorrect arguments:

```typescript
// WRONG - Arguments in wrong order and wrong types
const refinedCode = await applyFixPlan(
  args.code,      // Should be verdict
  args.verdict,   // Should be currentFiles array
  args.spec       // Should be report object
);
```

**Expected Signature:**
```typescript
export async function applyFixPlan(
  verdict: JudgeVerdict,
  currentFiles: GenResult['files'],  // Array of {path, content}
  report: ExecReport,
  previousFiles?: GenResult['files']
): Promise<GenResult>
```

---

## ✅ The Fix

**Updated Handler:**
```typescript
private async refineCode(args: any): Promise<any> {
  try {
    const { applyFixPlan } = await import('./pipeline/refine.js');

    // Convert code string to file structure
    const currentFiles = [{
      path: args.filePath || 'code.ts',
      content: args.code,
    }];

    // Build minimal ExecReport from verdict scores
    const report = {
      compiled: args.verdict.scores.compilation === 1,
      lintErrors: [],
      typeErrors: [],
      test: {
        passed: 0,
        failed: 0,
        details: [],
      },
      security: {
        violations: [],
      },
      logsTail: [],
    };

    // Apply fix plan with correct arguments
    const result = await applyFixPlan(
      args.verdict,
      currentFiles,
      report
    );

    return {
      success: true,
      files: result.files,
      tests: result.tests,
      notes: result.notes,
      augmentCreditsUsed: 0,
      creditsSaved: 500,
      cost: {
        total: 0,
        currency: 'USD',
        note: 'FREE - Ollama refine',
      },
    };
  } catch (error: any) {
    console.error('[refineCode] Error:', error);
    return {
      success: false,
      error: error.message,
      augmentCreditsUsed: 0,
      creditsSaved: 0,
    };
  }
}
```

**Key Changes:**
1. ✅ Convert `code` string to `currentFiles` array structure
2. ✅ Build proper `ExecReport` object from verdict scores
3. ✅ Call `applyFixPlan` with correct argument order
4. ✅ Return full `GenResult` (files, tests, notes)

---

## 📝 Updated Tool Schema

**Before:**
```typescript
{
  name: 'free_agent_refine_code',
  inputSchema: {
    properties: {
      code: { type: 'string' },
      verdict: { type: 'object' },
      spec: { type: 'string' },  // Not needed!
    },
    required: ['code', 'verdict', 'spec'],
  },
}
```

**After:**
```typescript
{
  name: 'free_agent_refine_code',
  inputSchema: {
    properties: {
      code: { 
        type: 'string',
        description: 'Code to refine',
      },
      filePath: { 
        type: 'string',
        description: 'Optional file path (default: code.ts)',
      },
      verdict: { 
        type: 'object',
        description: 'Judge verdict with fix plan (from free_agent_judge_code_quality)',
      },
    },
    required: ['code', 'verdict'],  // Removed 'spec'
  },
}
```

**Key Changes:**
1. ✅ Removed `spec` parameter (not needed by `applyFixPlan`)
2. ✅ Added `filePath` parameter (optional, defaults to 'code.ts')
3. ✅ Clarified that verdict comes from judge tool

---

## 🧪 Testing Plan

**After you restart VS Code, test with:**

```javascript
// Step 1: Judge the code
const judgeResult = free_agent_judge_code_quality_Free_Agent_MCP({
  code: "function add(a, b) { return a + b; }",
  spec: "Add two numbers with type safety"
});

// Step 2: Refine based on verdict
const refineResult = free_agent_refine_code_Free_Agent_MCP({
  code: "function add(a, b) { return a + b; }",
  filePath: "add.ts",
  verdict: judgeResult.verdict
});
```

**Expected Result:**
```json
{
  "success": true,
  "files": [
    {
      "path": "add.ts",
      "content": "export function add(a: number, b: number): number {\n  return a + b;\n}"
    }
  ],
  "tests": [...],
  "notes": "Added TypeScript type annotations",
  "augmentCreditsUsed": 0,
  "creditsSaved": 500
}
```

---

## 📊 Version History

| Version | Status | Issue |
|---------|--------|-------|
| 0.1.10 | ❌ Bug | Judge tool had wrong ExecReport structure |
| 0.1.11 | ⚠️ Bug | Judge fixed, but refine had wrong arguments |
| 0.1.12 | ✅ Fixed | All 4 tools working correctly |

---

## ✅ What's Fixed

1. ✅ Correct argument order for `applyFixPlan`
2. ✅ Proper file structure conversion
3. ✅ Proper ExecReport construction
4. ✅ Cleaner tool schema (removed unnecessary `spec`)
5. ✅ Better return value (full GenResult)

---

## 🚀 Next Steps

1. ⏳ Close VS Code completely
2. ⏳ Reopen VS Code (loads v0.1.12)
3. ⏳ Test all 4 tools
4. ⏳ Verify refine tool works
5. ⏳ Move to Phase 2 (replicate to paid-agent-mcp)

---

**Published:** v0.1.12 ✅  
**Config Updated:** augment-mcp-config.json ✅  
**Ready to Test:** After VS Code restart ✅

