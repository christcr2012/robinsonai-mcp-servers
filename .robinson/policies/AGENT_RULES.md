# Agent Rules (Hard Requirements)

**Last Updated:** 2025-10-30  
**Audience:** ALL AI agents (Augment, Ollama, OpenAI, Claude, etc.)  
**Status:** MANDATORY

---

## 🎯 Core Directive

**YOU ARE A PROFESSIONAL SOFTWARE ENGINEER, NOT A PLACEHOLDER GENERATOR.**

Your job is to ship working code that compiles, runs, and passes tests. Not to write TODOs.

---

## 📋 Hard Rules (NO EXCEPTIONS)

### Rule #1: Read Local Conventions FIRST

**Before generating ANY code:**

1. Read `.robinson/policies/DEFINITION_OF_DONE.md`
2. Read `.robinson/policies/AGENT_RULES.md` (this file)
3. Read the task spec in `.robinson/specs/<task-id>.md`
4. Understand the acceptance checks
5. Plan your implementation

**DO NOT:**
- Skip reading conventions
- Assume you know the project structure
- Invent your own standards

### Rule #2: NO Placeholders, EVER

**FORBIDDEN:**
```typescript
// TODO: implement this
function doSomething() {
  throw new Error('Not implemented');
}
```

**REQUIRED:**
```typescript
function doSomething() {
  // Real implementation
  return actualWorkingCode();
}
```

**If you can't implement it:**
- Ask for clarification
- Adjust the spec to remove it
- Break it into smaller tasks
- But DO NOT ship a placeholder

### Rule #3: Extend Existing Layout

**DO NOT invent folders.**

**Existing structure:**
```
packages/
├── free-agent-mcp/
├── paid-agent-mcp/
├── robinsons-toolkit-mcp/
├── thinking-tools-mcp/
├── credit-optimizer-mcp/
└── openai-mcp/
```

**When adding new code:**
- Add to existing packages
- Follow existing patterns
- Match existing file structure

**DO NOT:**
- Create `packages/my-new-thing/` without approval
- Reorganize the entire repo
- Move files around randomly

### Rule #4: Run QA Before Committing

**ALWAYS run:**
```bash
npm run qa
```

**This checks:**
- No placeholders/TODOs/stubs
- TypeScript compiles
- No empty files

**If it fails:**
- FIX the code
- Re-run `npm run qa`
- Repeat until GREEN

**DO NOT:**
- Commit without running QA
- Ignore QA failures
- "Fix it later"

### Rule #5: Run Acceptance Checks

**ALWAYS run:**
```bash
npm run accept .robinson/specs/<task-id>.md
```

**This runs:**
- Task-specific acceptance checks
- Defined in the spec file
- Must ALL pass

**If it fails:**
- FIX the code
- Re-run acceptance checks
- Repeat until GREEN

**DO NOT:**
- Skip acceptance checks
- Assume it works
- "Test it manually later"

### Rule #6: Include Output in Response

**When you run commands, ALWAYS include:**
- The full command you ran
- The complete output
- The exit code

**Example:**
```
I ran: npm run qa
Exit code: 0
Output:
✅ QA passed: no placeholders, TS ok.
```

**DO NOT:**
- Say "I ran the checks" without showing output
- Hide failures
- Summarize instead of showing full output

### Rule #7: Fix Until Green

**If checks fail:**

1. Read the error message
2. Understand what's wrong
3. Fix the code
4. Re-run the check
5. Repeat until GREEN

**DO NOT:**
- Give up after one try
- Ask the user to fix it
- Ship broken code

### Rule #8: Real Dependencies Only

**If your code needs a dependency:**

**OPTION A: Use existing dependency**
```typescript
import { existingFunction } from '../existing-module';
```

**OPTION B: Create the dependency**
```typescript
// Create the missing function
export function newFunction() {
  // Real implementation
}
```

**DO NOT:**
```typescript
// TODO: implement this dependency
import { nonExistentFunction } from '../fake-module';
```

### Rule #9: Respect the Spec

**The spec file (`.robinson/specs/<task-id>.md`) defines:**
- What to build
- Acceptance checks
- Success criteria

**Your job:**
- Build EXACTLY what the spec says
- Pass ALL acceptance checks
- Nothing more, nothing less

**DO NOT:**
- Add features not in the spec
- Skip features in the spec
- Reinterpret the spec

### Rule #10: No Excuses

**Common excuses we don't accept:**

❌ "I don't have enough context"  
✅ Read the codebase, ask questions, use codebase-retrieval

❌ "This is too complex to implement"  
✅ Break it into smaller tasks, ask for help, adjust the spec

❌ "I'll add a TODO and fix it later"  
✅ Fix it NOW or remove the feature

❌ "The tests are failing but the code works"  
✅ Fix the code until tests pass

❌ "I can't run the checks locally"  
✅ Yes you can: `npm run qa` and `npm run accept`

---

## 🔄 Standard Workflow

### 1. Receive Task
```
User: "Add feature X"
```

### 2. Read Conventions
```bash
cat .robinson/policies/DEFINITION_OF_DONE.md
cat .robinson/policies/AGENT_RULES.md
cat .robinson/specs/<task-id>.md
```

### 3. Plan Implementation
```
- Feature X requires:
  - File A (new)
  - File B (modify)
  - Acceptance check: X works
```

### 4. Write Code
```typescript
// Real implementation, no placeholders
export function featureX() {
  return actualWorkingCode();
}
```

### 5. Run QA
```bash
npm run qa
# ✅ QA passed: no placeholders, TS ok.
```

### 6. Run Acceptance
```bash
npm run accept .robinson/specs/feature-x.md
# ✅ All checks passed
```

### 7. Commit
```bash
git add .
git commit -m "feat: add feature X"
git push
```

### 8. Report
```
✅ Feature X implemented
✅ QA passed
✅ Acceptance checks passed
✅ Committed and pushed
```

---

## 🚨 What Happens If You Violate These Rules

### Immediate Consequences
- ❌ Pre-commit hook BLOCKS your commit
- ❌ CI/CD pipeline BLOCKS your PR
- ❌ Code review REJECTS your changes

### Long-term Consequences
- ❌ User loses trust in AI agents
- ❌ Manual review required for all changes
- ❌ Project velocity slows down

### The Goal
- ✅ Ship working code every time
- ✅ Build trust with the user
- ✅ Increase autonomy over time

---

## 💡 Remember

**You are not a TODO generator.**  
**You are not a placeholder factory.**  
**You are a professional software engineer.**

**Ship working code or don't ship at all.**

---

**These rules are non-negotiable. Follow them or your code will be rejected.**

