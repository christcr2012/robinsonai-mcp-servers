/**
 * WorkPlan DSL
 * 
 * Turn intent into executable plans with budgets and guardrails.
 * Compiles into autonomous workflows with safety rails.
 */

export interface WorkPlan {
  id: string;
  name: string;
  description: string;
  steps: WorkStep[];
  requires: string[];           // Prerequisites
  caps: ExecutionCaps;          // Limits
  budgets: Budgets;             // Time/credit/file budgets
  successSignals: string[];     // How to know it worked
  metadata?: {
    createdAt: Date;
    estimatedDuration: number;  // seconds
    estimatedCredits: number;
    filesAffected: string[];
  };
}

export interface WorkStep {
  id: string;
  name: string;
  action: string;               // What to do
  tool: string;                 // MCP tool name
  args: Record<string, any>;    // Tool arguments
  dependsOn: string[];          // Step IDs that must complete first
  rollbackOn?: string[];        // Conditions to rollback
  timeout?: number;             // Max time in seconds
  retries?: number;             // Max retry attempts
  optional?: boolean;           // Can fail without aborting plan
}

export interface ExecutionCaps {
  maxFilesChanged: number;
  maxRuntimeMs: number;
  requireGreenTests: boolean;
  requireApproval: boolean;
  dryRunOnly?: boolean;
}

export interface Budgets {
  maxCredits: number;
  maxTime: number;              // seconds
  maxFiles: number;
  maxIO: number;                // bytes
}

export interface PlanExecution {
  planId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'aborted';
  startedAt?: Date;
  completedAt?: Date;
  currentStep?: string;
  stepsCompleted: string[];
  stepsFailed: string[];
  usage: {
    creditsUsed: number;
    timeElapsed: number;
    filesChanged: number;
    ioBytes: number;
  };
  errors: string[];
}

export class WorkPlanDSL {
  /**
   * Create a new work plan
   */
  createPlan(config: {
    name: string;
    description: string;
    steps: Omit<WorkStep, 'id'>[];
    requires?: string[];
    caps?: Partial<ExecutionCaps>;
    budgets?: Partial<Budgets>;
    successSignals?: string[];
  }): WorkPlan {
    const id = this.generateId();
    
    // Add IDs to steps
    const steps = config.steps.map((step, index) => ({
      ...step,
      id: `step-${index + 1}`,
    }));

    // Default caps
    const caps: ExecutionCaps = {
      maxFilesChanged: config.caps?.maxFilesChanged || 50,
      maxRuntimeMs: config.caps?.maxRuntimeMs || 300000, // 5 minutes
      requireGreenTests: config.caps?.requireGreenTests ?? true,
      requireApproval: config.caps?.requireApproval ?? false,
      dryRunOnly: config.caps?.dryRunOnly ?? false,
    };

    // Default budgets
    const budgets: Budgets = {
      maxCredits: config.budgets?.maxCredits || 1000,
      maxTime: config.budgets?.maxTime || 300, // 5 minutes
      maxFiles: config.budgets?.maxFiles || 50,
      maxIO: config.budgets?.maxIO || 10485760, // 10 MB
    };

    return {
      id,
      name: config.name,
      description: config.description,
      steps,
      requires: config.requires || [],
      caps,
      budgets,
      successSignals: config.successSignals || [],
      metadata: {
        createdAt: new Date(),
        estimatedDuration: this.estimateDuration(steps),
        estimatedCredits: this.estimateCredits(steps),
        filesAffected: this.extractFilesAffected(steps),
      },
    };
  }

  /**
   * Validate a work plan
   */
  validatePlan(plan: WorkPlan): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for circular dependencies
    const circular = this.detectCircularDependencies(plan.steps);
    if (circular.length > 0) {
      errors.push(`Circular dependencies detected: ${circular.join(', ')}`);
    }

    // Check for missing dependencies
    const stepIds = new Set(plan.steps.map(s => s.id));
    for (const step of plan.steps) {
      for (const dep of step.dependsOn) {
        if (!stepIds.has(dep)) {
          errors.push(`Step ${step.id} depends on non-existent step ${dep}`);
        }
      }
    }

    // Check budgets are reasonable
    if (plan.budgets.maxCredits < 0) {
      errors.push('maxCredits must be >= 0');
    }
    if (plan.budgets.maxTime < 0) {
      errors.push('maxTime must be >= 0');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Compile plan into execution order (topological sort)
   */
  compilePlan(plan: WorkPlan): WorkStep[] {
    const sorted: WorkStep[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (stepId: string) => {
      if (visited.has(stepId)) return;
      if (visiting.has(stepId)) {
        throw new Error(`Circular dependency detected at ${stepId}`);
      }

      visiting.add(stepId);

      const step = plan.steps.find(s => s.id === stepId);
      if (!step) {
        throw new Error(`Step ${stepId} not found`);
      }

      // Visit dependencies first
      for (const dep of step.dependsOn) {
        visit(dep);
      }

      visiting.delete(stepId);
      visited.add(stepId);
      sorted.push(step);
    };

    // Visit all steps
    for (const step of plan.steps) {
      visit(step.id);
    }

    return sorted;
  }

  /**
   * Estimate plan duration
   */
  private estimateDuration(steps: WorkStep[]): number {
    // Simple estimation: sum of timeouts or default 30s per step
    return steps.reduce((total, step) => {
      return total + (step.timeout || 30);
    }, 0);
  }

  /**
   * Estimate plan credits
   */
  private estimateCredits(steps: WorkStep[]): number {
    // Most steps use local tools = 0 credits
    // Only count steps that might use AI
    const aiSteps = steps.filter(s => 
      s.tool.includes('delegate') || 
      s.tool.includes('generate') ||
      s.tool.includes('analyze')
    );
    
    // Estimate 100 credits per AI step (but we use Ollama = FREE!)
    return aiSteps.length * 0; // FREE with Ollama!
  }

  /**
   * Extract files affected by plan
   */
  private extractFilesAffected(steps: WorkStep[]): string[] {
    const files = new Set<string>();
    
    for (const step of steps) {
      // Extract file paths from args
      if (step.args.path) files.add(step.args.path);
      if (step.args.files) {
        for (const file of step.args.files) {
          files.add(file);
        }
      }
    }

    return Array.from(files);
  }

  /**
   * Detect circular dependencies
   */
  private detectCircularDependencies(steps: WorkStep[]): string[] {
    const circular: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (stepId: string, path: string[] = []) => {
      if (visited.has(stepId)) return;
      if (visiting.has(stepId)) {
        circular.push([...path, stepId].join(' → '));
        return;
      }

      visiting.add(stepId);
      path.push(stepId);

      const step = steps.find(s => s.id === stepId);
      if (step) {
        for (const dep of step.dependsOn) {
          visit(dep, [...path]);
        }
      }

      visiting.delete(stepId);
      visited.add(stepId);
    };

    for (const step of steps) {
      visit(step.id);
    }

    return circular;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format plan for display
   */
  formatPlan(plan: WorkPlan): string {
    let output = `📋 Work Plan: ${plan.name}\n\n`;
    output += `${plan.description}\n\n`;
    
    output += `📊 Estimates:\n`;
    output += `  • Duration: ${plan.metadata?.estimatedDuration}s\n`;
    output += `  • Credits: ${plan.metadata?.estimatedCredits} (FREE!)\n`;
    output += `  • Files: ${plan.metadata?.filesAffected.length}\n\n`;
    
    output += `🔒 Caps:\n`;
    output += `  • Max Files: ${plan.caps.maxFilesChanged}\n`;
    output += `  • Max Time: ${plan.caps.maxRuntimeMs / 1000}s\n`;
    output += `  • Require Tests: ${plan.caps.requireGreenTests ? 'Yes' : 'No'}\n`;
    output += `  • Require Approval: ${plan.caps.requireApproval ? 'Yes' : 'No'}\n\n`;
    
    output += `📝 Steps (${plan.steps.length}):\n`;
    for (const step of plan.steps) {
      output += `  ${step.id}. ${step.name}\n`;
      output += `     Tool: ${step.tool}\n`;
      if (step.dependsOn.length > 0) {
        output += `     Depends on: ${step.dependsOn.join(', ')}\n`;
      }
    }

    return output;
  }
}

