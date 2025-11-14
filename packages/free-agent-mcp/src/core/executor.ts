/**
 * Autonomous Workflow Executor for Agent Core
 * Executes workflows without stopping for confirmation
 * Migrated from Credit Optimizer MCP
 */

import type { Workflow, WorkflowStep, WorkflowResult } from './workflow.js';
import { validateWorkflow, findReadySteps } from './workflow.js';

export interface ExecutorOptions {
  dryRun?: boolean;
  maxConcurrency?: number;
  rollbackOnError?: boolean;
  timeout?: number; // milliseconds
}

export interface StepResult {
  stepId: string;
  success: boolean;
  output?: any;
  error?: string;
  duration: number;
}

/**
 * Execute a workflow autonomously
 */
export async function executeWorkflow(
  workflow: Workflow,
  options: ExecutorOptions = {},
  stepExecutor?: (step: WorkflowStep) => Promise<any>
): Promise<WorkflowResult> {
  const startTime = Date.now();
  const completed = new Set<string>();
  const failed = new Set<string>();
  const results = new Map<string, any>();

  // Validate workflow
  const validation = validateWorkflow(workflow);
  if (!validation.valid) {
    return {
      workflowId: workflow.name,
      success: false,
      completedSteps: [],
      failedSteps: [],
      results,
      totalDuration: Date.now() - startTime,
      error: `Workflow validation failed: ${validation.errors.join(', ')}`,
    };
  }

  if (options.dryRun) {
    console.log('[Executor] DRY RUN - No changes will be made');
  }

  try {
    // Execute steps in dependency order
    while (completed.size + failed.size < workflow.steps.length) {
      const ready = findReadySteps(workflow.steps, completed);

      if (ready.length === 0) {
        // No more steps can be executed - check if we're stuck
        if (completed.size + failed.size < workflow.steps.length) {
          throw new Error('Workflow stuck - no steps ready to execute');
        }
        break;
      }

      // Execute ready steps (up to maxConcurrency in parallel)
      const maxConcurrency = options.maxConcurrency || 1;
      const batch = ready.slice(0, maxConcurrency);

      const stepResults = await Promise.allSettled(
        batch.map((step) => executeStep(step, options, stepExecutor))
      );

      // Process results
      for (let i = 0; i < batch.length; i++) {
        const step = batch[i];
        const result = stepResults[i];

        if (result.status === 'fulfilled') {
          completed.add(step.id);
          results.set(step.id, result.value);
          console.log(`[Executor] ✓ Step ${step.id} completed`);
        } else {
          failed.add(step.id);
          console.error(`[Executor] ✗ Step ${step.id} failed:`, result.reason);

          if (options.rollbackOnError) {
            console.log('[Executor] Rolling back due to error...');
            // TODO: Implement rollback logic
            throw new Error(`Step ${step.id} failed, rolling back`);
          }
        }
      }
    }

    const success = failed.size === 0;
    return {
      workflowId: workflow.name,
      success,
      completedSteps: Array.from(completed),
      failedSteps: Array.from(failed),
      results,
      totalDuration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      workflowId: workflow.name,
      success: false,
      completedSteps: Array.from(completed),
      failedSteps: Array.from(failed),
      results,
      totalDuration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Execute a single workflow step
 */
async function executeStep(
  step: WorkflowStep,
  options: ExecutorOptions,
  stepExecutor?: (step: WorkflowStep) => Promise<any>
): Promise<any> {
  const startTime = Date.now();

  try {
    console.log(`[Executor] Executing step ${step.id}: ${step.tool}`);

    if (options.dryRun) {
      console.log(`[Executor] DRY RUN - Would execute: ${step.tool} with params:`, step.params);
      return { dryRun: true, step: step.id };
    }

    // Use custom executor if provided, otherwise use default
    if (stepExecutor) {
      const result = await stepExecutor(step);
      return result;
    }

    // Default executor - just log the step
    console.log(`[Executor] No executor provided for step ${step.id}`);
    return { success: true, step: step.id };
  } catch (error) {
    console.error(`[Executor] Step ${step.id} failed:`, error);
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    console.log(`[Executor] Step ${step.id} took ${duration}ms`);
  }
}

/**
 * Execute a batch operation across multiple files
 */
export async function executeBatchOperation(
  operation: {
    type: 'fix-imports' | 'fix-types' | 'refactor' | 'add-tests';
    filePattern: string;
    find?: string;
    replace?: string;
  },
  options: ExecutorOptions = {}
): Promise<{ success: boolean; filesProcessed: number; errors: string[] }> {
  console.log(`[Executor] Batch operation: ${operation.type} on ${operation.filePattern}`);

  if (options.dryRun) {
    console.log('[Executor] DRY RUN - No files will be modified');
    return { success: true, filesProcessed: 0, errors: [] };
  }

  // TODO: Implement actual batch operation logic
  // This would use fast-glob to find files, then apply the operation to each

  return {
    success: true,
    filesProcessed: 0,
    errors: [],
  };
}

