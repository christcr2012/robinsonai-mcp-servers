/**
 * Workflow DSL for Agent Core
 * Defines multi-step workflows with dependencies and parallel execution
 * Migrated from Credit Optimizer MCP
 */

export type AgentAssignment = 'free-agent' | 'paid-agent' | 'toolkit' | 'thinking-tools';

export interface WorkflowStep {
  id: string;
  assignTo: AgentAssignment;
  tool: string;
  dependencies: string[]; // IDs of steps that must complete first
  params: Record<string, any>;
  description?: string;
}

export interface Workflow {
  name: string;
  description?: string;
  steps: WorkflowStep[];
  estimatedCost?: string;
  estimatedTime?: string;
  metadata?: Record<string, any>;
}

export interface WorkflowResult {
  workflowId: string;
  success: boolean;
  completedSteps: string[];
  failedSteps: string[];
  results: Map<string, any>;
  totalDuration: number;
  error?: string;
}

/**
 * Build a dependency graph from workflow steps
 */
export function buildDependencyGraph(steps: WorkflowStep[]): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();

  for (const step of steps) {
    if (!graph.has(step.id)) {
      graph.set(step.id, new Set());
    }

    for (const dep of step.dependencies) {
      if (!graph.has(dep)) {
        graph.set(dep, new Set());
      }
      graph.get(dep)!.add(step.id);
    }
  }

  return graph;
}

/**
 * Find steps that can be executed in parallel (no dependencies or all dependencies met)
 */
export function findReadySteps(
  steps: WorkflowStep[],
  completed: Set<string>
): WorkflowStep[] {
  return steps.filter((step) => {
    if (completed.has(step.id)) {
      return false;
    }
    return step.dependencies.every((dep) => completed.has(dep));
  });
}

/**
 * Validate workflow for cycles and missing dependencies
 */
export function validateWorkflow(workflow: Workflow): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const stepIds = new Set(workflow.steps.map((s) => s.id));

  // Check for duplicate IDs
  const ids = workflow.steps.map((s) => s.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length > 0) {
    errors.push(`Duplicate step IDs: ${duplicates.join(', ')}`);
  }

  // Check for missing dependencies
  for (const step of workflow.steps) {
    for (const dep of step.dependencies) {
      if (!stepIds.has(dep)) {
        errors.push(`Step ${step.id} depends on non-existent step ${dep}`);
      }
    }
  }

  // Check for cycles using DFS
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(stepId: string): boolean {
    if (recursionStack.has(stepId)) {
      return true;
    }
    if (visited.has(stepId)) {
      return false;
    }

    visited.add(stepId);
    recursionStack.add(stepId);

    const step = workflow.steps.find((s) => s.id === stepId);
    if (step) {
      for (const dep of step.dependencies) {
        if (hasCycle(dep)) {
          errors.push(`Cycle detected involving step ${stepId}`);
          return true;
        }
      }
    }

    recursionStack.delete(stepId);
    return false;
  }

  for (const step of workflow.steps) {
    if (!visited.has(step.id)) {
      hasCycle(step.id);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Estimate workflow cost based on agent assignments
 */
export function estimateWorkflowCost(workflow: Workflow): {
  freeSteps: number;
  paidSteps: number;
  estimatedCost: number;
} {
  let freeSteps = 0;
  let paidSteps = 0;

  for (const step of workflow.steps) {
    if (step.assignTo === 'free-agent' || step.assignTo === 'toolkit') {
      freeSteps++;
    } else if (step.assignTo === 'paid-agent') {
      paidSteps++;
    }
  }

  // Rough estimate: $0.01 per paid step
  const estimatedCost = paidSteps * 0.01;

  return {
    freeSteps,
    paidSteps,
    estimatedCost,
  };
}

/**
 * Generate a simple workflow from a task description
 */
export function generateSimpleWorkflow(task: string, kind: string): Workflow {
  // This is a placeholder - in practice, this would use thinking tools
  // to analyze the task and generate an optimal workflow
  return {
    name: `${kind}: ${task}`,
    description: task,
    steps: [
      {
        id: 'analyze',
        assignTo: 'free-agent',
        tool: 'analyze_task',
        dependencies: [],
        params: { task },
      },
      {
        id: 'implement',
        assignTo: 'free-agent',
        tool: 'implement_solution',
        dependencies: ['analyze'],
        params: { task },
      },
      {
        id: 'test',
        assignTo: 'free-agent',
        tool: 'run_tests',
        dependencies: ['implement'],
        params: {},
      },
    ],
  };
}

