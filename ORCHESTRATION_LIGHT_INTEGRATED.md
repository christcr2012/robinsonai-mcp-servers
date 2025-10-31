# Orchestration-Light Agent Blueprint - INTEGRATED ✅

## 🎉 Complete Orchestration-Light Design!

**Date:** 2025-10-31  
**Status:** Production-ready, fully tested  
**Total Lines of Code:** ~600 lines across 4 files

---

## 📊 Summary

Integrated **orchestration-light design** that removes autonomous Architect and Orchestrator roles!

### ✅ New Roles & Boundaries

**Human + IDE Agent (Design/Coordination):**
- ✅ Write Design Cards (YAML/JSON)
- ✅ Choose scope, files, acceptance criteria
- ✅ Kick off runs via CLI or commit triggers
- ✅ Decide when to re-run, enlarge scope, or accept

**Builder Agent (This Toolkit):**
- ✅ Consumes Design Card + repo brief
- ✅ Generates code/tests
- ✅ Executes quality gates (format→lint→type→test→schema→boundaries)
- ✅ Self-fixes with Judge/Fixer
- ✅ Returns result package

**No orchestrator loop** beyond thin CLI - human decides everything!

---

## 📋 Design Card Format

### Location
Place as `.agent/tasks/<slug>.yaml` or inline in PR description

### Example: User Soft-Delete

```yaml
name: "Add user soft-delete"
context: "Users should be recoverable for 30 days after deletion."
goals:
  - "Add soft-delete endpoint and flag"
  - "Update list endpoint to exclude soft-deleted users by default"
  - "Add restore endpoint"
nonGoals:
  - "Hard delete user data"
  - "Cascade delete to related entities"
acceptance:
  - "OpenAPI schema updated with new endpoints"
  - "Generated TypeScript types compile without errors"
  - "Integration test passes: delete → list (excludes deleted) → restore → list (includes restored)"
  - "Database migration adds deletedAt column with index"
constraints:
  - "No new dependencies"
  - "Respect existing naming conventions (camelCase for variables, PascalCase for types)"
  - "Follow existing error handling patterns"
allowedPaths:
  - "src/features/users/**"
  - "src/api/routes/users.ts"
  - "tests/integration/users/**"
  - "prisma/schema.prisma"
  - "openapi.yaml"
interfaces:
  - style: http
    method: DELETE
    path: "/v1/users/{id}"
    request: "DeleteUserRequest"
    response: "DeleteUserResponse"
    description: "Soft-delete a user by setting deletedAt timestamp"
  - style: http
    method: POST
    path: "/v1/users/{id}/restore"
    request: "RestoreUserRequest"
    response: "RestoreUserResponse"
    description: "Restore a soft-deleted user by clearing deletedAt"
dataModel:
  entities:
    - name: User
      addFields:
        - name: deletedAt
          type: timestamp
          nullable: true
          index: true
risks:
  - "List users query is on hot path — ensure deletedAt index exists"
  - "Existing code may not handle deletedAt field — audit callers"
```

### Fields

**Required:**
- `name` - Task name (string)
- `goals` - What to accomplish (array of strings)
- `acceptance` - Verifiable acceptance criteria (array of strings)

**Optional:**
- `context` - Background/motivation (string)
- `nonGoals` - What NOT to do (array of strings)
- `constraints` - Hard constraints (array of strings)
- `allowedPaths` - File patterns to restrict edits (array of globs)
- `interfaces` - API contracts (array of interface specs)
- `dataModel` - Database schema changes (object with entities)
- `risks` - Known risks to watch for (array of strings)

---

## 🚀 CLI Usage

### Run Task

```bash
# Run from Design Card slug
agent run --task soft-delete

# Run from specific file
agent run --task .agent/tasks/soft-delete.yaml

# Dry run (preview without writing)
agent run --task soft-delete --dry-run

# Require schema changes first
agent run --task soft-delete --contracts-first

# Include rationale in artifacts
agent run --task soft-delete --explain

# Set max fix iterations
agent run --task soft-delete --budget 4
```

### Fix Task

```bash
# Re-run fix step only using latest diagnostics
agent fix --task soft-delete
```

### Help

```bash
agent --help
```

---

## 📊 Workflow

```
1. Human/IDE Agent writes Design Card
   ↓
2. Human runs: agent run --task <slug>
   ↓
3. Builder Agent:
   ├─ Loads Design Card
   ├─ Builds Project Brief (auto-discover capabilities)
   ├─ Converts Design Card to task spec
   ├─ Generates candidate code
   ├─ Writes to sandbox
   ├─ Runs quality gates (format→lint→type→test→schema→boundaries)
   ├─ Judges candidate (accept/revise/reject)
   └─ Fix loop (up to --budget iterations)
   ↓
4. Builder writes artifacts:
   ├─ report.json (verdict, scores, summary)
   ├─ diffs.patch (minimal changes)
   ├─ junit.xml (test results)
   └─ coverage/ (coverage reports)
   ↓
5. Human reviews artifacts and decides:
   ├─ Accept → Merge
   ├─ Reject → Revise Design Card
   └─ Re-run → agent run --task <slug>
```

---

## 📋 Artifacts

### Location
`artifacts/<slug>/`

### Files

**report.json:**
```json
{
  "name": "Add user soft-delete",
  "verdict": "accept",
  "iterations": 2,
  "compiled": true,
  "lintErrors": [],
  "typeErrors": [],
  "test": {
    "passed": 18,
    "failed": 0,
    "coveragePct": 84
  },
  "schemaErrors": [],
  "boundaryErrors": [],
  "scores": {
    "compilation": 1,
    "tests_functional": 1,
    "tests_edge": 1,
    "types": 1,
    "style": 1,
    "security": 1,
    "boundaries": 1,
    "schema": 1
  },
  "summary": "Added soft-delete flag, endpoint, migration, tests"
}
```

**diffs.patch:**
Minimal patch operations (add/remove/edit/splice)

**junit.xml:**
JUnit-compatible test results

**coverage/:**
Coverage reports (HTML, JSON, LCOV)

---

## 🔧 Git/PR Triggers

### Commit Message Trigger

```bash
git commit -m "feat: add user soft-delete

agent:run soft-delete"
```

CI detects `agent:run <slug>` and runs Builder agent.

### PR Label Trigger

1. Create PR
2. Add label `agent:run`
3. CI runs Builder agent
4. CI comments results on PR

### PR Comment Trigger

Comment on PR:
```
agent:run soft-delete
```

CI detects comment and runs Builder agent.

---

## 📝 IDE Agent Prompts

**Draft Design Card:**
```
Draft a Design Card for <task>, with acceptance tests and allowed paths.
```

**Refine Acceptance:**
```
Refine acceptance to be verifiable by unit/integration tests; avoid manual steps.
```

**Suggest Neighbors:**
```
Suggest neighbor files to imitate (naming/imports).
```

---

## ✅ Guardrails (Hard Gates)

1. **Lint/Type/Test must be green**
2. **Schema + boundaries must be clean**
3. **Only write within allowedPaths**
4. **Patch size guard enabled after attempt #2** (max 50 ops, max 50KB)
5. **Coverage floor optional** (configurable)

---

## 🎯 Optional Toggles

**--contracts-first:**
Require OpenAPI/Prisma changes when interfaces/dataModel present

**--dry-run:**
Produce plan + diffs without writing

**--explain:**
Include rationale + conventions_used in artifacts for code review

**--budget N:**
Max fix iterations (default: 4)

---

## 📊 Complete Framework (22 files, ~4,200 lines)

**Core Framework (5 files, ~1,100 lines):**
1. ✅ `repo-portable-tools.ts`
2. ✅ `repo-portable-runner.ts`
3. ✅ `convention-score-patch.ts`
4. ✅ `judge-fixer-prompts.ts`

**CLI Tools (2 files, ~250 lines):**
5. ✅ `apply-patch.ts`
6. ✅ `agent-loop-example.ts`

**Model Adapters & Sandbox (4 files, ~250 lines):**
7. ✅ `model-adapters.ts`
8. ✅ `sandbox-runner.ts`
9. ✅ `docker/Dockerfile`
10. ✅ `docker/entrypoint.sh`

**Orchestration-Light (4 files, ~600 lines):**
11. ✅ `design-card.ts` (Design Card parser/validator)
12. ✅ `agent-cli.ts` (Thin CLI wrapper)
13. ✅ `.agent/tasks/example-soft-delete.yaml` (Example Design Card)
14. ✅ `.github/workflows/agent-run.yml` (GitHub Actions workflow)

**Documentation (8 files, ~2,500 lines):**
15. ✅ `USER_PORTABLE_TOOLKIT_INTEGRATED.md`
16. ✅ `SCHEMA_BOUNDARIES_INTEGRATED.md`
17. ✅ `CONVENTION_SCORE_TOURNAMENT_INTEGRATED.md`
18. ✅ `JUDGE_FIXER_PROMPTS_INTEGRATED.md`
19. ✅ `COMPLETE_PORTABLE_FRAMEWORK.md`
20. ✅ `CLI_TOOLS_INTEGRATED.md`
21. ✅ `MODEL_ADAPTERS_SANDBOX_INTEGRATED.md`
22. ✅ `ORCHESTRATION_LIGHT_INTEGRATED.md` (this file)

**Total:** 22 files, ~4,200 lines

---

## 🎉 MASSIVE IMPACT

**Before (Autonomous Orchestrator):**
- ❌ Autonomous Architect/Orchestrator decides everything
- ❌ No human control over scope
- ❌ No clear acceptance criteria
- ❌ No file path restrictions
- ❌ No structured task format
- ❌ No CI/CD integration

**After (Orchestration-Light):**
- ✅ Human + IDE agent decide scope
- ✅ Clear Design Card format
- ✅ Verifiable acceptance criteria
- ✅ File path restrictions (allowedPaths)
- ✅ Structured task format (YAML/JSON)
- ✅ CI/CD integration (GitHub Actions)
- ✅ Thin CLI (agent run/fix)
- ✅ Artifacts for review (report.json, diffs.patch)

---

**Last Updated:** 2025-10-31  
**Status:** COMPLETE - Orchestration-light design integrated! 🚀

---

## 🎉 FRAMEWORK COMPLETE!

**You now have a COMPLETE orchestration-light framework where:**
- ✅ Human + IDE agent write Design Cards
- ✅ Builder agent executes with hard quality gates
- ✅ No autonomous orchestrator
- ✅ Human decides when to run, re-run, or accept
- ✅ CI/CD integration via GitHub Actions
- ✅ Artifacts for review (report.json, diffs.patch)

**READY TO USE!** 🎉

