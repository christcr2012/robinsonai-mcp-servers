/**
 * Parallel Execution Engine
 * 
 * Analyzes work plan dependencies and executes tasks in parallel groups.
 * Uses topological sorting to identify which tasks can run simultaneously.
 */

export interface WorkStep {
  id: string;
  assignTo: string; // Should be "any_available_agent"
  tool: string;
  dependencies: string[];
  params: any;
}

export interface WorkPlan {
  name: string;
  estimatedTime?: string;
  estimatedCost?: string;
  caps?: any;
  budgets?: any;
  successSignals?: string[];
  steps: WorkStep[];
}

export interface StepResult {
  stepId: string;
  agent: string;
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
}

export interface WorkflowResult {
  success: boolean;
  results: StepResult[];
  totalDuration: number;
  parallelGroups: number;
}

export class ParallelExecutionEngine {
  /**
   * Execute workflow with parallel execution
   */
  async executeWorkflow(plan: WorkPlan, agentPool: any): Promise<WorkflowResult> {
    const startTime = Date.now();
    
    console.error(`[ParallelExecutor] Starting workflow: ${plan.name}`);
    console.error(`[ParallelExecutor] Total steps: ${plan.steps.length}`);

    // Build dependency groups (topological sort)
    const groups = this.buildDependencyGroups(plan.steps);
    
    console.error(`[ParallelExecutor] Identified ${groups.length} parallel execution groups`);

    const results: StepResult[] = [];

    // Execute each group in parallel
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      console.error(`[ParallelExecutor] Executing group ${i + 1}/${groups.length} (${group.length} tasks in parallel)...`);

      const groupStartTime = Date.now();
      
      // Execute all tasks in this group in parallel
      const promises = group.map(step => this.executeStep(step, agentPool));
      const groupResults = await Promise.all(promises);

      const groupDuration = Date.now() - groupStartTime;
      console.error(`[ParallelExecutor] Group ${i + 1} completed in ${groupDuration}ms`);

      results.push(...groupResults);

      // Check if any step failed
      const failures = groupResults.filter(r => !r.success);
      if (failures.length > 0) {
        console.error(`[ParallelExecutor] Group ${i + 1} had ${failures.length} failures, stopping workflow`);
        return {
          success: false,
          results,
          totalDuration: Date.now() - startTime,
          parallelGroups: i + 1,
        };
      }
    }

    const totalDuration = Date.now() - startTime;
    console.error(`[ParallelExecutor] Workflow completed successfully in ${totalDuration}ms`);

    return {
      success: true,
      results,
      totalDuration,
      parallelGroups: groups.length,
    };
  }

  /**
   * Build dependency groups using topological sort
   * Returns array of groups where each group can be executed in parallel
   */
  private buildDependencyGroups(steps: WorkStep[]): WorkStep[][] {
    const groups: WorkStep[][] = [];
    const completed = new Set<string>();
    const remaining = new Map<string, WorkStep>();

    // Initialize remaining steps
    for (const step of steps) {
      remaining.set(step.id, step);
    }

    // Build groups iteratively
    while (remaining.size > 0) {
      const group: WorkStep[] = [];

      // Find all steps whose dependencies are satisfied
      for (const [id, step] of remaining.entries()) {
        const dependenciesSatisfied = step.dependencies.every(dep => completed.has(dep));
        
        if (dependenciesSatisfied) {
          group.push(step);
        }
      }

      // If no steps can be executed, we have a circular dependency
      if (group.length === 0) {
        const remainingIds = Array.from(remaining.keys());
        throw new Error(`Circular dependency detected! Remaining steps: ${remainingIds.join(', ')}`);
      }

      // Remove executed steps from remaining
      for (const step of group) {
        remaining.delete(step.id);
        completed.add(step.id);
      }

      groups.push(group);
    }

    return groups;
  }

  /**
   * Execute a single step on an available agent
   */
  private async executeStep(step: WorkStep, agentPool: any): Promise<StepResult> {
    const startTime = Date.now();

    try {
      // Get available agent from pool
      const agent = await agentPool.getAvailableAgent();
      
      console.error(`[ParallelExecutor] Executing step ${step.id} on ${agent.name}...`);

      // Execute task on agent
      const result = await agentPool.executeOnAgent(agent, step.tool, step.params);

      const duration = Date.now() - startTime;
      console.error(`[ParallelExecutor] Step ${step.id} completed in ${duration}ms`);

      return {
        stepId: step.id,
        agent: agent.name,
        success: true,
        result,
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`[ParallelExecutor] Step ${step.id} failed:`, error.message);

      return {
        stepId: step.id,
        agent: 'unknown',
        success: false,
        error: error.message,
        duration,
      };
    }
  }

  /**
   * Validate work plan structure
   */
  validatePlan(plan: WorkPlan): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check that all steps have required fields
    for (const step of plan.steps) {
      if (!step.id) {
        errors.push(`Step missing 'id' field`);
      }
      if (!step.assignTo) {
        errors.push(`Step ${step.id} missing 'assignTo' field`);
      }
      if (step.assignTo !== 'any_available_agent') {
        errors.push(`Step ${step.id} has assignTo='${step.assignTo}', should be 'any_available_agent'`);
      }
      if (!step.tool) {
        errors.push(`Step ${step.id} missing 'tool' field`);
      }
      if (!Array.isArray(step.dependencies)) {
        errors.push(`Step ${step.id} missing 'dependencies' array`);
      }
    }

    // Check for duplicate step IDs
    const ids = plan.steps.map(s => s.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate step IDs: ${duplicates.join(', ')}`);
    }

    // Check that all dependencies exist
    const stepIds = new Set(ids);
    for (const step of plan.steps) {
      for (const dep of step.dependencies) {
        if (!stepIds.has(dep)) {
          errors.push(`Step ${step.id} depends on non-existent step: ${dep}`);
        }
      }
    }

    // Check for circular dependencies (basic check)
    try {
      this.buildDependencyGroups(plan.steps);
    } catch (error: any) {
      errors.push(error.message);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Estimate parallel execution time
   */
  estimateExecutionTime(plan: WorkPlan): {
    sequential: number;
    parallel: number;
    speedup: number;
  } {
    const groups = this.buildDependencyGroups(plan.steps);

    // Assume each step takes 1 minute (rough estimate)
    const avgStepTime = 60000; // 60 seconds

    const sequentialTime = plan.steps.length * avgStepTime;
    
    // Parallel time = sum of longest step in each group
    const parallelTime = groups.length * avgStepTime;

    const speedup = sequentialTime / parallelTime;

    return {
      sequential: sequentialTime,
      parallel: parallelTime,
      speedup,
    };
  }
}

