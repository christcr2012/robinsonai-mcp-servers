# Free Agent Acceptance Criteria

## What "Done Right" Means

When Free Agent generates code, it must meet ALL of these criteria:

### ✅ File Operations
- [ ] **Edits existing file** (no `new file mode 100644`)
- [ ] **Does NOT create new files** when container exists
- [ ] **Modifies correct file** (e.g., `packages/robinsons-toolkit-mcp/src/index.ts`)

### ✅ Code Structure
- [ ] **Adds method to existing class** (no new class definitions)
- [ ] **Uses correct wrapper function** (e.g., `this.upstashRedisFetch()`)
- [ ] **Follows return type pattern** (e.g., `{ content: [{ type: 'text', text: JSON.stringify(result) }] }`)
- [ ] **No `any` types** (except in arrow functions like `any => ...`)
- [ ] **No placeholders** (no "TODO", "FIXME", "Placeholder for real implementation")

### ✅ Quality Gates
- [ ] **Lint passes** (no ESLint errors)
- [ ] **Type check passes** (no TypeScript errors)
- [ ] **Tests pass** (if tests exist)
- [ ] **Formatter applied** (Prettier or equivalent)

### ✅ Pipeline Execution
- [ ] **Uses `free_agent_run` tool** (not `delegate_code_generation`)
- [ ] **Uses Free Agent Core** (with PCE pattern learning)
- [ ] **Uses MCPGenerator** (with quality gates pipeline)
- [ ] **Uses quality=best** (sandbox + 2 retries)
- [ ] **Uses tier=paid** (OpenAI/Claude for best results)
- [ ] **Uses sandbox=true** (isolated environment for gates)

### ✅ Logs to Verify
When running, you should see these logs:

```
[runFreeAgent] Using Free Agent Core with PCE and pluggable generator...
[MCPGenerator] Generating with quality=best tier=paid sandbox=true
[CodeGen] quality=best tier=paid sandbox=true retries=2
[CodeGen] Using full pipeline with quality gates (sandbox=true, retries=2)
```

You should **NOT** see:
```
FREE - Fast mode (no sandbox)
[DEPRECATED] delegate_code_generation -> free_agent_run
```

### ✅ Pattern Contract Enforcement
- [ ] **Learns patterns from repo** (containers, wrappers, naming conventions)
- [ ] **Injects patterns into prompt** (via buildAdapterPrompt)
- [ ] **Enforces patterns via PatchGuard** (rejects new class files when container exists)
- [ ] **Uses exemplar files** (6 largest files as examples)

## How to Test

### 1. Set Environment Variables
```bash
export FREE_AGENT_GENERATOR=packages/free-agent-mcp/dist/generation/mcp-generator.js
export FREE_AGENT_TIER=paid
export FREE_AGENT_QUALITY=best
export CODEGEN_VERBOSE=1
export FA_DISABLE_DELEGATE=1
```

### 2. Call the Tool
```typescript
await server.callTool('free_agent_run', {
  repo: 'packages/robinsons-toolkit-mcp',
  task: 'Add upstashRedisLpush method to RobinsonsToolkit class',
  kind: 'feature'
});
```

### 3. Verify Logs
Check that all the required logs appear (see "Logs to Verify" above).

### 4. Verify Generated Code
Check that the generated code meets all the criteria above.

### 5. Run CI Smoke Test
```bash
pnpm run test:routing
```

This should output:
```
✅ PASSED: Free Agent routing is correct
  - Uses free_agent_run ✓
  - Does NOT use delegate_code_generation ✓
  - Uses quality=best ✓
  - Uses sandbox=true ✓

🎉 All checks passed!
```

## Common Issues and Fixes

### Issue: Still seeing "FREE - Fast mode (no sandbox)"
**Fix**: Check that `FREE_AGENT_QUALITY=best` is set and that the CodeGenerator is using the correct precedence (arg → env → default).

### Issue: Still creating new files instead of editing existing ones
**Fix**: Check that the PatchGuard rule is enabled and that the pattern contract is being learned correctly.

### Issue: Still using `delegate_code_generation`
**Fix**: Set `FA_DISABLE_DELEGATE=1` to completely disable the old tool.

### Issue: Model ignores structure/patterns
**Fix**: Ensure `FREE_AGENT_GENERATOR` points to the MCPGenerator (not a raw LLM). The generator must use the quality gates pipeline.

## Success Metrics

- **0 new files created** when container exists
- **0 new classes created** when container exists
- **0 `any` types** in generated code
- **0 placeholders** in generated code
- **100% lint pass rate**
- **100% type check pass rate**
- **100% test pass rate** (if tests exist)
- **100% pattern compliance** (uses correct wrappers, return types, etc.)

## Next Steps After Acceptance

Once all criteria are met:

1. **Generate all 152 missing Upstash Redis handlers** in batches
2. **Run comprehensive tests** to verify all handlers work correctly
3. **Publish updated Robinson's Toolkit MCP** to npm
4. **Update augment-mcp-config.json** to use new version
5. **Document the PCE system** for future reference

