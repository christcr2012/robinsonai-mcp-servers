# Agent Optimizer Prototype

**Credit Optimizer MCP** was created as a prototype to optimize Augment credit usage by delegating work to free local models (Ollama) and autonomous workflows. This document captures its key capabilities for migration into Agent Core.

## Core Capabilities

### 1. Workflow DSL (Domain-Specific Language)

**Location**: `packages/credit-optimizer-mcp/src/workplan-dsl.ts`

**Purpose**: Define multi-step workflows with dependencies and parallel execution.

**Key Features**:
- Step definitions with dependencies
- Parallel execution support
- Tool assignment (which agent/tool handles each step)
- Parameter passing between steps

**Example**:
```typescript
interface WorkflowStep {
  id: string;
  assignTo: 'free-agent' | 'paid-agent' | 'toolkit';
  tool: string;
  dependencies: string[]; // IDs of steps that must complete first
  params: Record<string, any>;
}

interface Workflow {
  name: string;
  steps: WorkflowStep[];
  estimatedCost: string;
  estimatedTime: string;
}
```

### 2. Workflow Planner

**Location**: `packages/credit-optimizer-mcp/src/workflow-planner.ts`

**Purpose**: Analyze tasks and generate optimal execution plans.

**Key Features**:
- Task decomposition
- Dependency analysis
- Cost estimation
- Agent assignment (free vs paid)

### 3. Autonomous Executor

**Location**: `packages/credit-optimizer-mcp/src/autonomous-executor.ts`

**Purpose**: Execute workflows without stopping for confirmation.

**Key Features**:
- Batch operations (fix imports, types, etc. across many files)
- Dry-run mode for safety
- Rollback on error
- Progress tracking

**Example Use Cases**:
- Fix 100+ import errors across files
- Apply refactoring pattern to entire codebase
- Generate tests for multiple files
- Run database migrations

### 4. Parallel Executor

**Location**: `packages/credit-optimizer-mcp/src/parallel-executor.ts`

**Purpose**: Execute independent workflow steps simultaneously.

**Key Features**:
- Dependency graph analysis
- Agent pool management
- Concurrent execution with backoff
- Result aggregation

**Example**:
```typescript
// Execute 3 independent tasks in parallel
const workflow = {
  steps: [
    { id: '1', tool: 'generate_component', dependencies: [] },
    { id: '2', tool: 'generate_api', dependencies: [] },
    { id: '3', tool: 'generate_tests', dependencies: [] },
    { id: '4', tool: 'integrate', dependencies: ['1', '2', '3'] }
  ]
};
// Steps 1, 2, 3 run in parallel, then step 4 runs after all complete
```

### 5. Agent Pool

**Location**: `packages/credit-optimizer-mcp/src/agent-pool.ts`

**Purpose**: Manage multiple agent instances for parallel work.

**Key Features**:
- Free agent pool (Ollama-based, $0 cost)
- Paid agent pool (OpenAI/Claude, metered)
- Load balancing
- Availability tracking

### 6. Cost Tracking & Optimization

**Location**: `packages/credit-optimizer-mcp/src/cost-tracker.ts`

**Purpose**: Track costs and optimize model selection.

**Key Features**:
- Real-time cost tracking
- Historical cost analysis
- Model recommendation (free vs paid)
- Budget enforcement

**Database**: SQLite (`packages/credit-optimizer-mcp/src/database.ts`)

### 7. Template Engine

**Location**: `packages/credit-optimizer-mcp/src/template-engine.ts`

**Purpose**: Generate code from templates without AI (0 credits).

**Key Features**:
- Pre-built templates (React components, API endpoints, etc.)
- Variable substitution
- File scaffolding
- Blueprint system

### 8. Tool Indexer

**Location**: `packages/credit-optimizer-mcp/src/tool-indexer.ts`

**Purpose**: Index and search available tools without AI.

**Key Features**:
- Fast keyword search
- Category filtering
- Tool discovery
- Workflow suggestions

### 9. PR Creator

**Location**: `packages/credit-optimizer-mcp/src/pr-creator.ts`

**Purpose**: Autonomously create GitHub PRs with changes.

**Key Features**:
- Branch creation
- File changes batching
- PR description generation
- Draft PR support

## What Should Migrate to Agent Core

### High Priority (Core Workflow Engine)

1. **Workflow DSL** → `packages/free-agent-core/src/workflow.ts`
   - Step definitions
   - Dependency graph
   - Parallel execution model

2. **Autonomous Executor** → `packages/free-agent-core/src/executor.ts`
   - Batch operations
   - Dry-run mode
   - Rollback support

3. **Parallel Executor** → `packages/free-agent-core/src/parallel.ts`
   - Dependency resolution
   - Concurrent execution
   - Agent pool integration

### Medium Priority (Optimization Features)

4. **Cost Tracking** → Integrate with existing `shared-llm/metrics`
   - Already have provider-agnostic metrics
   - Add budget enforcement
   - Add model recommendation

5. **Agent Pool** → Enhance existing agent architecture
   - Free Agent MCP already handles free tier
   - Paid Agent MCP already handles paid tier
   - Add pool management for parallel work

### Low Priority (Nice-to-Have)

6. **Template Engine** → Keep in Credit Optimizer MCP for now
   - Useful but not core to agent intelligence
   - Can be called as a tool when needed

7. **Tool Indexer** → Already handled by Robinson's Toolkit
   - Toolkit has comprehensive tool discovery
   - No need to duplicate

8. **PR Creator** → Keep in Credit Optimizer MCP for now
   - Specific to GitHub workflow
   - Can be called as a tool when needed

## What to Strip Out

- **Augment-credit-specific logic** - Remove references to "Augment credits"
- **OpenAI-only assumptions** - Already provider-agnostic in shared-llm
- **Hardcoded model names** - Use provider-agnostic model selection

## Migration Plan

1. **Phase 6.1**: Extract workflow DSL and executor
   - Create `packages/free-agent-core/src/workflow.ts`
   - Create `packages/free-agent-core/src/executor.ts`
   - Port core logic from Credit Optimizer

2. **Phase 6.2**: Integrate with Agent Core
   - Wire workflow execution into `runAgentTask()`
   - Add workflow planning to thinking tools
   - Enable parallel execution

3. **Phase 6.3**: Mark Credit Optimizer as legacy
   - Update README with deprecation notice
   - Point to Agent Core for new development
   - Keep server running for backward compatibility

## Future: Decommission Credit Optimizer MCP

Once Free/Paid agents are fully capable and affordable:
- Delete `packages/credit-optimizer-mcp`
- Remove from build scripts
- Remove from augment-mcp-config.json

The optimizer logic will live entirely in Agent Core, accessible to both Free and Paid agents.

