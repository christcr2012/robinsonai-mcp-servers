# Testing Guide: Free Agent Operating Recipe

This guide walks through testing the Free Agent operating recipe with canonical tasks.

## Prerequisites

1. ✅ Free Agent MCP loaded and showing tools in Augment
2. ✅ Thinking Tools MCP loaded and showing tools
3. ✅ Robinson's Toolkit MCP loaded and showing tools
4. ✅ Ollama running locally (`ollama serve`)
5. ✅ Environment variables configured in augment-mcp-config.json

## Canonical Test Cases

### Test 1: API + React + Tests

**Objective**: Verify Free Agent can create a complete feature with backend, frontend, and tests.

**Task**:
```
Add a GET /api/notifications endpoint with a React NotificationsList component and tests.

Requirements:
- Backend endpoint returns list of notifications from database
- Frontend component displays notifications with newest first
- Empty state when no notifications
- Unit tests for both backend and frontend
- All builds/tests/lint must pass
```

**Expected Behavior**:
1. Free Agent generates project brief (or uses cached)
2. Searches for similar code (existing API endpoints, React components)
3. Discovers toolkit tools (database, testing)
4. Plans implementation:
   - `src/server/routes/notifications.ts` (backend)
   - `src/components/NotificationsList.tsx` (frontend)
   - `src/types/notifications.ts` (shared types)
   - `__tests__/notifications.spec.ts` (tests)
5. Generates complete, working code
6. Runs quality gates (build, lint, types, tests)
7. Returns files with quality report

**Success Criteria**:
- ✅ All files created
- ✅ No placeholders or TODOs
- ✅ All imports resolve
- ✅ Build passes
- ✅ Lint passes
- ✅ Tests pass
- ✅ Code follows repo conventions

**How to Test**:
```
In Augment chat:
"Implement a notifications API with Free Agent: Add GET /api/notifications endpoint with React list component and tests"
```

---

### Test 2: Vercel Deployment

**Objective**: Verify Free Agent uses Toolkit tools instead of generating shell scripts.

**Task**:
```
Deploy the application to Vercel production.
```

**Expected Behavior**:
1. Free Agent discovers toolkit tools for "deploy vercel"
2. Finds `vercel_deploy_project` tool
3. Gets current schema for the tool
4. Generates correct arguments
5. Calls `toolkit.vercel_deploy_project` with production=true
6. Returns deployment URL

**Success Criteria**:
- ✅ Uses `toolkit.vercel_deploy_project` (not shell scripts)
- ✅ Deployment succeeds
- ✅ Returns deployment URL
- ✅ No custom code generated

**How to Test**:
```
In Augment chat:
"Deploy to Vercel production using Free Agent"
```

---

### Test 3: Stripe Checkout Integration

**Objective**: Verify Free Agent fetches official docs and uses SDK correctly.

**Task**:
```
Add Stripe checkout flow for subscription payments.

Requirements:
- Create checkout session endpoint
- Handle webhook for successful payment
- Update user subscription status in database
- Include tests for webhook handling
```

**Expected Behavior**:
1. Free Agent detects need for Stripe integration
2. Calls `thinking_tools.context7_get_library_docs` for Stripe
3. Discovers `toolkit.stripe_*` tools
4. Searches for existing Stripe code in repo
5. Generates code using official Stripe SDK
6. Includes webhook signature verification
7. Includes tests
8. Runs quality gates

**Success Criteria**:
- ✅ Uses official Stripe SDK (`@stripe/stripe-js`)
- ✅ Fetched Stripe docs via Thinking Tools
- ✅ Webhook signature verification included
- ✅ Tests included
- ✅ No hardcoded API keys
- ✅ Follows Stripe best practices from docs

**How to Test**:
```
In Augment chat:
"Implement Stripe checkout flow with Free Agent: Create checkout session endpoint and webhook handler for subscription payments"
```

---

## Verification Checklist

After each test, verify:

### Code Quality
- [ ] No `TODO:` or `FIXME:` comments
- [ ] No `throw new Error('Not implemented')`
- [ ] All imports resolve to real files
- [ ] Code follows repo naming conventions
- [ ] Code follows repo architecture patterns

### Build & Tests
- [ ] `npm run build` succeeds
- [ ] `npm run lint` succeeds with 0 errors
- [ ] `npm test` succeeds
- [ ] Test coverage meets minimum (80%)

### Tool Usage
- [ ] Used Toolkit tools when available
- [ ] Fetched docs via Thinking Tools when needed
- [ ] Searched for similar code before creating new
- [ ] No reinvented wheels (auth, HTTP clients, etc.)

### Quality Report
- [ ] Verification report included
- [ ] Quality score >= 0.85 (balanced mode)
- [ ] All quality gates passed
- [ ] Refinement attempts <= 3

---

## Debugging Failed Tests

### If Free Agent doesn't use Toolkit tools:

1. Check tool discovery:
   ```
   Call: toolkit_discover { query: "deploy vercel" }
   Verify: Returns vercel_deploy_project
   ```

2. Check capability discovery cache:
   ```
   Look for: Session-scoped tool bindings
   Verify: Tools are being cached after successful use
   ```

3. Check decision table:
   ```
   Review: .augment/docs/toolkit-vs-code-decision-table.md
   Verify: Intent matches expected tool
   ```

### If quality gates fail:

1. Check build output:
   ```bash
   npm run build
   # Look for actual errors
   ```

2. Check lint output:
   ```bash
   npm run lint
   # Look for actual errors
   ```

3. Check test output:
   ```bash
   npm test
   # Look for actual failures
   ```

4. Review refinement loop:
   ```
   Check: How many refinement attempts?
   Check: What was the root cause analysis?
   Check: What fixes were applied?
   ```

### If context is missing:

1. Check project brief generation:
   ```
   Call: thinking_tools.free_agent_generate_project_brief
   Verify: Returns conventions, architecture, patterns
   ```

2. Check context query:
   ```
   Call: thinking_tools.context_query { query: "notifications API" }
   Verify: Returns similar code
   ```

3. Check Context Engine index:
   ```
   Call: thinking_tools.context_stats
   Verify: Index is populated
   ```

---

## Success Metrics

Track these metrics across all tests:

| Metric | Target | Actual |
|--------|--------|--------|
| Quality score | >= 0.85 | ___ |
| Build success rate | 100% | ___ |
| Test success rate | 100% | ___ |
| Toolkit tool usage | >= 80% | ___ |
| Refinement attempts | <= 1 | ___ |
| Placeholder count | 0 | ___ |
| Import resolution | 100% | ___ |

---

## Next Steps

After successful testing:

1. ✅ Document any issues found
2. ✅ Update decision table if needed
3. ✅ Adjust quality thresholds if needed
4. ✅ Add more canonical tests for your use cases
5. ✅ Monitor metrics over time
6. ✅ Iterate based on feedback

---

## Rollout Checklist

Before using in production:

- [ ] All 3 canonical tests pass
- [ ] Quality scores >= 0.85
- [ ] Toolkit tools used correctly
- [ ] Thinking Tools used for context
- [ ] No placeholders in generated code
- [ ] All imports resolve
- [ ] Tests included and passing
- [ ] Documentation generated
- [ ] Metrics tracked
- [ ] Team trained on usage

