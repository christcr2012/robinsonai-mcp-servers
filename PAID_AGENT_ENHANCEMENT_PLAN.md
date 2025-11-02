# PAID Agent MCP - Comprehensive Enhancement Plan

## 🎯 OBJECTIVE
Make PAID Agent fully capable of doing work autonomously, cheaper than Augment doing it.

---

## ✅ WHAT PAID AGENT ALREADY HAS (v0.2.5)

### 1. File Editing Capabilities
- ✅ `file_str_replace` - Replace text in files (lines 391-427)
- ✅ `file_insert` - Insert text at specific line (lines 428-441)
- ✅ `file_save` - Create new files (lines 442-463)
- ✅ `file_delete` - Delete files (lines 464-477)
- ✅ `file_read` - Read file contents (lines 478-490)
- ✅ `handleFileEditing()` function (lines 1254-1517) - Uses LLM to determine operations

### 2. Robinson's Toolkit Integration
- ✅ `getSharedToolkitClient()` imported (line 40)
- ✅ `toolkit_call` taskType (lines 1028-1060)
- ✅ `discover_toolkit_tools` (lines 349-366, 1693-1720)
- ✅ `list_toolkit_categories` (lines 367-374, 1722-1752)
- ✅ `list_toolkit_tools` (lines 375-387, 1757-1784)

### 3. Multi-Provider Support
- ✅ OpenAI (gpt-4o-mini, gpt-4o, o1-mini)
- ✅ Claude (haiku, sonnet, opus)
- ✅ Ollama (qwen, deepseek, codellama)
- ✅ Smart model selection via `selectBestModel()` (model-catalog.ts)

### 4. Recent Fixes
- ✅ `preferFree = false` (defaults to PAID models now)
- ✅ Only uses Ollama when explicitly requested

---

## ❌ WHAT PAID AGENT IS MISSING

### 1. No Access to Thinking Tools MCP
**Problem:** Can't use cognitive operators (SWOT, Devil's Advocate, Premortem, etc.)

**Impact:** Can't do strategic planning or analysis tasks

**Solution:** Add Thinking Tools client similar to Toolkit client

### 2. No Workspace Root Detection
**Problem:** Same issue Thinking Tools had - uses `process.cwd()` which returns VS Code's directory

**Impact:** File operations may fail or operate on wrong directory

**Solution:** Add workspace root detection utility (same as Thinking Tools fix)

### 3. File Editing May Not Handle All Cases
**Problem:** `handleFileEditing()` uses heuristics to detect simple vs complex tasks

**Impact:** May choose wrong strategy for some tasks

**Solution:** Improve task classification or add explicit strategy parameter

### 4. No Direct Code Generation Tool
**Problem:** Has `execute_versatile_task` but no dedicated code generation tool like FREE agent

**Impact:** Less convenient for simple code generation tasks

**Solution:** Add `generate_code` tool that wraps versatile task

### 5. No Validation/Testing After Edits
**Problem:** Makes changes but doesn't verify they work

**Impact:** May introduce syntax errors or breaking changes

**Solution:** Add optional validation step (syntax check, type check, tests)

---

## 🔧 ENHANCEMENT PLAN

### Phase 1: Critical Fixes (30 min)

#### 1.1 Add Workspace Root Detection
**File:** `packages/paid-agent-mcp/src/lib/workspace.ts` (NEW)
```typescript
import { resolve } from "node:path";

export function getWorkspaceRoot(): string {
  const envVars = ['INIT_CWD', 'WORKSPACE_ROOT', 'PWD'];
  for (const varName of envVars) {
    const value = process.env[varName];
    if (value) {
      return resolve(value);
    }
  }
  return resolve(process.cwd());
}
```

#### 1.2 Use Workspace Root in File Editor
**File:** `packages/paid-agent-mcp/src/index.ts`
- Import `getWorkspaceRoot()`
- Pass workspace root to file editor operations
- Ensure all file paths are resolved relative to workspace root

### Phase 2: Add Thinking Tools Integration (45 min)

#### 2.1 Create Thinking Tools Client
**File:** `packages/shared-llm/src/thinking-tools-client.ts` (NEW)
```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface ThinkingToolsCallParams {
  tool_name: string;
  arguments: Record<string, any>;
}

export class ThinkingToolsClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private connected: boolean = false;

  async connect(): Promise<void> {
    // Connect to Thinking Tools MCP
  }

  async callTool(params: ThinkingToolsCallParams): Promise<any> {
    // Call cognitive operator
  }

  async disconnect(): Promise<void> {
    // Cleanup
  }
}

export function getSharedThinkingToolsClient(): ThinkingToolsClient {
  // Singleton instance
}
```

#### 2.2 Add Thinking Tools to PAID Agent
**File:** `packages/paid-agent-mcp/src/index.ts`
- Import `getSharedThinkingToolsClient()`
- Add `thinking_tools_call` taskType
- Add tools: `call_thinking_tool`, `list_thinking_tools`

### Phase 3: Improve File Editing (30 min)

#### 3.1 Add Explicit Strategy Parameter
**File:** `packages/paid-agent-mcp/src/index.ts`
```typescript
interface FileEditingParams {
  strategy?: 'operations' | 'full_code' | 'auto';
  validate?: boolean;
  run_tests?: boolean;
}
```

#### 3.2 Add Validation Step
```typescript
async function validateFileEdit(filePath: string, operation: string): Promise<{valid: boolean, errors: string[]}> {
  // Check syntax (TypeScript, JavaScript, Python, etc.)
  // Run type checker if applicable
  // Optionally run tests
}
```

### Phase 4: Add Convenience Tools (20 min)

#### 4.1 Add Direct Code Generation Tool
**File:** `packages/paid-agent-mcp/src/index.ts`
```typescript
{
  name: 'generate_code_paid',
  description: 'Generate code using PAID models (OpenAI/Claude). Use when quality is critical.',
  inputSchema: {
    type: 'object',
    properties: {
      task: { type: 'string', description: 'What to build' },
      context: { type: 'string', description: 'Project context' },
      language: { type: 'string', description: 'Programming language' },
      model: { type: 'string', enum: ['mini', 'balanced', 'premium', 'auto'] },
    },
    required: ['task', 'context'],
  },
}
```

#### 4.2 Add Batch File Operations
```typescript
{
  name: 'batch_file_operations',
  description: 'Execute multiple file operations in one call',
  inputSchema: {
    type: 'object',
    properties: {
      operations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            operation: { type: 'string', enum: ['read', 'str_replace', 'insert', 'save', 'delete'] },
            path: { type: 'string' },
            // ... other params
          },
        },
      },
    },
    required: ['operations'],
  },
}
```

---

## 📊 EXPECTED OUTCOMES

### After Phase 1:
- ✅ File operations work correctly in MCP context
- ✅ No more "wrong directory" errors

### After Phase 2:
- ✅ PAID agent can use cognitive operators
- ✅ Can do strategic planning and analysis
- ✅ Can generate SWOT, Premortem, Devil's Advocate, etc.

### After Phase 3:
- ✅ Better file editing accuracy
- ✅ Fewer syntax errors
- ✅ Optional validation before committing changes

### After Phase 4:
- ✅ More convenient API for common tasks
- ✅ Batch operations save time and credits
- ✅ Direct code generation without verbose params

---

## 🚀 IMPLEMENTATION ORDER

1. **Phase 1** (Critical) - Do this NOW
2. **Phase 2** (High Priority) - Do this next
3. **Phase 3** (Medium Priority) - Do after Phase 2
4. **Phase 4** (Nice to Have) - Do when time permits

---

## 💰 COST IMPACT

**Current State:**
- Augment does work: 13,000 credits
- PAID agent does work: 500-2,000 credits
- Savings: 85-96%

**After Enhancements:**
- PAID agent can do MORE work
- PAID agent can do BETTER work
- PAID agent can do STRATEGIC work (via Thinking Tools)
- Savings: 90-98% (more tasks delegated)

---

## ✅ SUCCESS CRITERIA

1. PAID agent can edit files without errors
2. PAID agent can use Thinking Tools for planning
3. PAID agent can validate its own changes
4. PAID agent is the preferred choice for complex tasks
5. Augment rarely needs to do work itself

---

## 📝 NOTES

- Keep FREE agent for simple tasks (0 credits)
- Use PAID agent for complex/critical tasks (500-2,000 credits)
- Only use Augment as last resort (13,000 credits)
- This creates a 3-tier system: FREE → PAID → Augment

