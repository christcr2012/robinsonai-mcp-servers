# Agent Behavior Tests - Phase 8

This document defines three realistic test scenarios for evaluating Free Agent and Paid Agent behavior and code quality.

**Test Repository**: `test-repos/agent-playground/`

---

## Scenario 1: Feature Task - Add Subtract Command

### Goal
Add a `subtract` command to the CLI that uses the existing `Calculator.subtract()` method.

### Acceptance Criteria
1. User can run `node dist/index.js subtract 10 3` and get `Result: 7`
2. The command appears in the help output when running `node dist/index.js help`
3. The implementation follows the same pattern as existing commands (add, multiply)
4. Code compiles without TypeScript errors
5. The change is minimal and focused (don't refactor unrelated code)

### Files Likely Involved
- `src/index.ts` - Add command registration in `registerCommands()` method

### Constraints
- Must use the existing `Calculator.subtract()` method (don't reimplement)
- Must follow the existing command registration pattern
- Don't modify any other commands or functionality
- Keep function names and structure stable

### Expected Behavior
- Agent should recognize this is a simple feature addition
- Agent should find and copy the pattern from existing commands
- Agent should make minimal, focused changes
- Agent should NOT refactor unrelated code
- Agent should NOT fix bugs in other parts of the code

---

## Scenario 2: Refactor Task - Extract Command Registration

### Goal
Refactor the `registerCommands()` method in `CliApp` to reduce code duplication by extracting the command registration pattern into a helper function.

### Acceptance Criteria
1. Create a helper function that takes command metadata and returns a `CliCommand` object
2. Refactor all existing command registrations to use the helper
3. The CLI functionality remains exactly the same (all commands still work)
4. Code is more maintainable and easier to extend
5. Add at least one test to verify commands still work after refactoring
6. Code compiles without TypeScript errors

### Files Likely Involved
- `src/index.ts` - Extract helper function, refactor `registerCommands()`
- `src/index.test.ts` - NEW FILE - Add tests for command registration

### Constraints
- Must maintain backward compatibility (all existing commands work identically)
- Must not change the public API of `CliApp`
- Must add tests to verify the refactoring didn't break anything
- The helper function should be reusable for future commands

### Expected Behavior
- Agent should analyze the existing pattern and identify duplication
- Agent should design a clean abstraction that reduces duplication
- Agent should refactor ALL commands to use the new pattern
- Agent should add tests to verify behavior is preserved
- Agent should NOT introduce new features or fix bugs during refactoring

---

## Scenario 3: Bugfix Task - Fix Calculator.add() Bug

### Goal
Fix BUG-1 described in TODO.md: The `Calculator.add()` method multiplies instead of adds.

### Acceptance Criteria
1. The `Calculator.add()` method correctly adds two numbers
2. The existing test `Calculator.add should add two numbers` passes
3. No other calculator methods are broken
4. All existing tests pass
5. The fix is minimal (only change what's necessary)

### Files Likely Involved
- `src/calculator.ts` - Fix the `add()` method (line 10)
- `src/calculator.test.ts` - Verify the test passes

### Constraints
- Only fix the `add()` method - don't fix other bugs (BUG-2)
- Don't add new features or tests
- Don't refactor unrelated code
- The fix should be a one-line change

### Expected Behavior
- Agent should read TODO.md to understand the bug
- Agent should locate the exact line with the bug
- Agent should make a minimal, surgical fix
- Agent should verify the test passes
- Agent should NOT fix other bugs or add features
- Agent should NOT refactor the code

---

## Evaluation Criteria

For each scenario, evaluate:

### Planning Quality
- Did the agent understand the task correctly?
- Did it identify the right files to modify?
- Did it plan minimal, focused changes?
- Did it avoid scope creep?

### Code Quality
- Is the code correct and functional?
- Does it follow existing patterns and conventions?
- Is it clean and maintainable?
- Are there any TypeScript errors?

### RAD + Cortex Usage
- Did the agent query RAD for related knowledge?
- Did the agent use Cortex for patterns or playbooks?
- Did the agent record the task/decision/lesson in RAD?
- Was the usage appropriate and helpful?

### Test Results
- Do all tests pass?
- Does the code compile?
- Does `npm run build` succeed?
- Does the CLI work as expected?

### Adherence to Constraints
- Did the agent follow the constraints?
- Did it avoid scope creep (fixing unrelated bugs, adding features)?
- Did it make minimal changes?
- Did it maintain backward compatibility?

---

## Running the Tests

For each scenario:

1. **Reset the repo** to the initial commit:
   ```bash
   cd test-repos/agent-playground
   git reset --hard 930e7ed  # Initial commit hash
   ```

2. **Run the agent** with the scenario description:
   ```bash
   # Use the appropriate agent tool (free_agent_run or paid_agent_run)
   # Pass the repo path and scenario description
   ```

3. **Verify the results**:
   ```bash
   npm install
   npm run build
   npm test
   node dist/index.js help  # For Scenario 1
   ```

4. **Save the results**:
   - Agent's plan
   - Generated patches
   - Test output
   - Any errors or issues
   - Observations about RAD/Cortex usage

5. **Record in results file**:
   - `results/free-agent-phase8.md` for Free Agent
   - `results/paid-agent-phase8.md` for Paid Agent

