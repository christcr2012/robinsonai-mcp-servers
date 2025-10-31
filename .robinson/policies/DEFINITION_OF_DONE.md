# Definition of Done (Repo-Enforced)

**Last Updated:** 2025-10-30  
**Status:** ACTIVE - All agents MUST comply

---

## 🎯 Core Principle

**NO CODE SHIPS UNTIL IT PASSES ALL CHECKS**

This is not optional. This is not negotiable. Every agent, every task, every commit.

---

## ✅ Definition of Done Checklist

### 1. NO PLACEHOLDERS OR STUBS ❌

**FORBIDDEN:**
- `TODO`
- `FIXME`
- `PLACEHOLDER`
- `STUB`
- `MOCK` (in production code)
- `TBD`
- `// implement this later`
- `throw new Error('Not implemented')`
- Empty function bodies
- Commented-out fake code

**REQUIRED:**
- Real, working implementations
- If a dependency is missing, CREATE IT
- If you can't implement it, ADJUST THE SPEC to remove it
- No excuses, no exceptions

### 2. CODE COMPILES ✅

**TypeScript:**
```bash
npx tsc --noEmit
```
Must exit with code 0. No errors, no warnings.

**JavaScript:**
```bash
node --check <file>
```
Must parse without syntax errors.

### 3. ACCEPTANCE CHECKS PASS ✅

Every task has a spec file in `.robinson/specs/<task-id>.md` with acceptance checks.

```bash
npm run accept .robinson/specs/<task-id>.md
```

Must exit with code 0. All checks green.

### 4. MINIMAL DOCUMENTATION ✅

**Required:**
- JSDoc/TSDoc for all exported functions
- Inline comments for complex logic
- README updates if adding new features

**NOT Required:**
- Verbose documentation
- Redundant comments
- Documentation for obvious code

### 5. NO SECRETS IN SOURCE ✅

**FORBIDDEN:**
- API keys in code
- Passwords in code
- Tokens in code
- Connection strings in code

**REQUIRED:**
- Use environment variables
- Use `.env` files (gitignored)
- Use secret management tools

### 6. TESTS (When Applicable) ✅

**Required for:**
- New features
- Bug fixes
- Refactoring critical code

**NOT Required for:**
- Documentation changes
- Configuration changes
- Simple one-liners

---

## 🚫 What Happens If You Violate This

### Pre-Commit Hook
```bash
npm run qa
```

**If this fails:**
- ❌ Commit is BLOCKED
- ❌ You cannot push
- ❌ You must fix and retry

### CI/CD Pipeline
```bash
npm run qa && npm run accept
```

**If this fails:**
- ❌ PR is BLOCKED
- ❌ Merge is BLOCKED
- ❌ Deployment is BLOCKED

---

## 📋 How to Use This

### For Agents

1. **Before writing code:**
   - Read the task spec in `.robinson/specs/<task-id>.md`
   - Understand the acceptance checks
   - Plan your implementation

2. **While writing code:**
   - NO placeholders
   - NO TODOs
   - Real implementations only

3. **After writing code:**
   ```bash
   npm run qa                                    # Check for placeholders, TS errors
   npm run accept .robinson/specs/<task-id>.md   # Run acceptance checks
   ```

4. **If checks fail:**
   - FIX the code
   - Re-run checks
   - Repeat until GREEN

5. **Only then:**
   ```bash
   git add .
   git commit -m "feat: <description>"
   git push
   ```

### For Humans

Same process. No exceptions.

---

## 🎯 Success Criteria

**A task is DONE when:**
- ✅ No placeholders/stubs/TODOs
- ✅ TypeScript compiles with 0 errors
- ✅ All acceptance checks pass
- ✅ Minimal documentation exists
- ✅ No secrets in source
- ✅ Tests pass (if applicable)
- ✅ Pre-commit hook passes
- ✅ CI/CD pipeline passes

**Until ALL of these are true, the task is NOT DONE.**

---

## 💡 Philosophy

**"Ship working code, not promises."**

- Placeholders are promises
- TODOs are promises
- Stubs are promises
- We ship WORKING CODE

**"If you can't implement it, don't promise it."**

- Adjust the spec
- Remove the feature
- Ask for help
- But don't ship placeholders

**"The repo enforces quality, not humans."**

- Humans forget
- Humans get tired
- Humans make mistakes
- The repo never forgets

---

**This is the standard. Meet it or don't ship.**

