/**
 * Planning Tools (New Architecture)
 * 
 * Implements incremental planning with spec storage and validation.
 */

import { submitSpec, getSpecById, getSpecChunk } from '../specs/store.js';
import { createPlan, getPlanStatus, getPlanChunk, getFullPlan } from '../planner/incremental.js';
import { validateWorkPlan, formatValidationErrors } from '../validator/planValidator.js';
import { listTemplates, getTemplate } from '../templates/index.js';
import { forecastRunCost, formatCostForecast } from '../cost/forecaster.js';
import { getAvailableModels, getCatalogStats } from '../models/catalog.js';
import { getSpendStats } from '../policy/engine.js';
import { handleRunPlanSteps } from './run_workflow.js';

type MCPReturn = Promise<{ content: Array<{ type: "text"; text: string }> }>;

const ok = (text: string): MCPReturn => Promise.resolve({ content: [{ type: "text", text }] });
const toText = (obj: any): MCPReturn => ok(JSON.stringify(obj, null, 2));

/**
 * submit_spec - Store large specification for planning
 */
export async function handleSubmitSpec(args: { title: string; text: string }): MCPReturn {
  try {
    const result = submitSpec(args.title, args.text);
    return toText({
      spec_id: result.spec_id,
      title: args.title,
      size_bytes: result.size_bytes,
      message: 'Spec stored successfully. Use plan_work({ spec_id }) to create plan.',
    });
  } catch (error: any) {
    return ok(`Error: ${error.message}`);
  }
}

/**
 * get_spec_chunk - Retrieve spec in chunks
 */
export async function handleGetSpecChunk(args: { spec_id: number; from?: number; size?: number }): MCPReturn {
  try {
    const result = getSpecChunk(args.spec_id, args.from || 0, args.size || 8192);
    return toText(result);
  } catch (error: any) {
    return ok(`Error: ${error.message}`);
  }
}

/**
 * plan_work - Create work plan (returns immediately with plan_id)
 */
export async function handlePlanWork(args: {
  goal?: string;
  spec_id?: number;
  mode?: 'skeleton' | 'refine' | string;
  budgets?: any;
}): MCPReturn {
  try {
    // Must provide either goal or spec_id
    if (!args.goal && !args.spec_id) {
      return ok('Error: Must provide either "goal" or "spec_id"');
    }
    
    // If spec_id provided, get the spec
    let goal = args.goal || null;
    if (args.spec_id) {
      const spec = getSpecById(args.spec_id);
      if (!spec) {
        return ok(`Error: Spec ${args.spec_id} not found`);
      }
      goal = `${spec.title}\n\n${spec.text}`;
    }
    
    // Create plan (returns immediately)
    const result = createPlan(goal, args.spec_id || null, args.mode || 'skeleton', args.budgets);
    
    return toText({
      plan_id: result.plan_id,
      summary: result.summary,
      message: 'Plan created. Use get_plan_status to monitor progress.',
    });
  } catch (error: any) {
    return ok(`Error: ${error.message}`);
  }
}

/**
 * get_plan_status - Check planning progress
 */
export async function handleGetPlanStatus(args: { plan_id: number }): MCPReturn {
  try {
    const status = getPlanStatus(args.plan_id);
    return toText(status);
  } catch (error: any) {
    return ok(`Error: ${error.message}`);
  }
}

/**
 * get_plan_chunk - Retrieve plan steps in chunks
 */
export async function handleGetPlanChunk(args: { plan_id: number; from?: number; size?: number }): MCPReturn {
  try {
    const result = getPlanChunk(args.plan_id, args.from || 0, args.size || 10);
    return toText(result);
  } catch (error: any) {
    return ok(`Error: ${error.message}`);
  }
}

/**
 * export_workplan_to_optimizer - Validate and execute plan
 *
 * NOTE: This now executes the plan directly via run_plan_steps()
 * instead of exporting to Credit Optimizer, until Credit Optimizer
 * supports arbitrary MCP tool execution.
 */
export async function handleExportWorkplan(args: { plan_id: number }): MCPReturn {
  try {
    const plan = getFullPlan(args.plan_id);

    // Check if planning is complete
    if (plan.state === 'planning') {
      return ok('Error: Plan is still being generated. Wait for state=done.');
    }

    if (plan.state === 'failed') {
      return ok(`Error: Planning failed: ${plan.error}`);
    }

    // Parse steps
    const steps = plan.steps_json ? JSON.parse(plan.steps_json) : [];

    // Validate plan
    const validation = validateWorkPlan(steps);

    if (!validation.valid) {
      return ok(formatValidationErrors(validation));
    }

    // Execute plan directly (temporary until Credit Optimizer supports tool execution)
    console.log(`[export_workplan_to_optimizer] Plan ${args.plan_id} validated. Executing via run_plan_steps...`);
    return await handleRunPlanSteps({ plan_id: args.plan_id });

  } catch (error: any) {
    return ok(`Error: ${error.message}`);
  }
}

/**
 * revise_plan - Revise plan based on validation errors
 */
export async function handleRevisePlan(args: { plan_id: number; critique_focus?: string }): MCPReturn {
  try {
    // TODO: Implement plan revision with LLM
    // For now, just return current status
    const status = getPlanStatus(args.plan_id);
    return toText({
      plan_id: args.plan_id,
      message: 'Plan revision not yet implemented. Check validation errors and manually fix.',
      status,
    });
  } catch (error: any) {
    return ok(`Error: ${error.message}`);
  }
}

/**
 * list_templates - List available step templates
 */
export async function handleListTemplates(): MCPReturn {
  try {
    const templates = listTemplates();
    const details = templates.map(name => {
      const template = getTemplate(name);
      return {
        name,
        description: template?.description,
        required_params: template?.required_params,
      };
    });
    
    return toText({
      templates: details,
      count: templates.length,
    });
  } catch (error: any) {
    return ok(`Error: ${error.message}`);
  }
}

/**
 * get_template - Get template details
 */
export async function handleGetTemplate(args: { name: string }): MCPReturn {
  try {
    const template = getTemplate(args.name);
    
    if (!template) {
      return ok(`Error: Template "${args.name}" not found`);
    }
    
    return toText(template);
  } catch (error: any) {
    return ok(`Error: ${error.message}`);
  }
}

/**
 * decompose_spec - Break spec into work items
 */
export async function handleDecomposeSpec(args: { spec_id: number; max_item_size?: number }): MCPReturn {
  try {
    const spec = getSpecById(args.spec_id);

    if (!spec) {
      return ok(`Error: Spec ${args.spec_id} not found`);
    }

    // Simple decomposition based on spec structure
    // Split by markdown headers or numbered items
    const lines = spec.text.split('\n');
    const workItems: any[] = [];

    let currentItem: any = null;

    for (const line of lines) {
      // Check for markdown headers (## or ###)
      if (line.match(/^#{2,3}\s+(.+)/)) {
        if (currentItem) {
          workItems.push(currentItem);
        }
        currentItem = {
          title: line.replace(/^#{2,3}\s+/, '').trim(),
          acceptance_tests: [],
          repo_targets: [],
          risk: 'medium',
          estimate: 'unknown',
        };
      }
      // Check for numbered items (1. or Item 1:)
      else if (line.match(/^\d+\.\s+(.+)|^Item\s+\d+:/i)) {
        if (currentItem) {
          workItems.push(currentItem);
        }
        currentItem = {
          title: line.replace(/^\d+\.\s+|^Item\s+\d+:\s*/i, '').trim(),
          acceptance_tests: [],
          repo_targets: [],
          risk: 'medium',
          estimate: 'unknown',
        };
      }
    }

    // Add last item
    if (currentItem) {
      workItems.push(currentItem);
    }

    // If no items found, create one item for the whole spec
    if (workItems.length === 0) {
      workItems.push({
        title: spec.title,
        acceptance_tests: ['Implementation complete'],
        repo_targets: ['packages/*/src/**/*.ts'],
        risk: 'medium',
        estimate: 'unknown',
      });
    }

    return toText({
      spec_id: args.spec_id,
      work_items: workItems,
      count: workItems.length,
      message: 'Decomposition complete. Use plan_work({ spec_id }) to plan implementation.',
    });
  } catch (error: any) {
    return ok(`Error: ${error.message}`);
  }
}

/**
 * forecast_run_cost - Estimate cost for a plan
 */
export async function handleForecastRunCost(args: { plan_id: string }): MCPReturn {
  try {
    const planId = parseInt(args.plan_id, 10);
    const plan = getFullPlan(planId);

    if (!plan) {
      return ok(`Error: Plan ${args.plan_id} not found`);
    }

    // Parse steps from JSON
    let steps: any[] = [];
    if (plan.steps_json) {
      try {
        steps = JSON.parse(plan.steps_json);
      } catch (e) {
        steps = [];
      }
    }

    // Forecast cost
    const forecast = await forecastRunCost({
      plan_id: args.plan_id,
      plan: {
        steps,
        goal: plan.goal || plan.summary || undefined,
        files_changed: steps.length || 0,
        total_lines_changed: 0,
      },
    });

    const formatted = formatCostForecast(forecast);

    return toText({
      ...forecast,
      formatted_summary: formatted,
    });
  } catch (error: any) {
    return ok(`Error: ${error.message}`);
  }
}

/**
 * list_models - List available models
 */
export async function handleListModels(): MCPReturn {
  try {
    const models = getAvailableModels();
    const stats = getCatalogStats();

    return toText({
      models,
      stats,
    });
  } catch (error: any) {
    return ok(`Error: ${error.message}`);
  }
}

/**
 * get_spend_stats - Get monthly spend statistics
 */
export async function handleGetSpendStats(): MCPReturn {
  try {
    const stats = getSpendStats();

    return toText({
      ...stats,
      formatted: `💰 Monthly Budget\n` +
        `   Spent: $${stats.current_month.toFixed(2)} / $${stats.total_budget.toFixed(2)}\n` +
        `   Remaining: $${stats.remaining_budget.toFixed(2)}\n` +
        `   Usage: ${stats.percentage_used.toFixed(1)}%`,
    });
  } catch (error: any) {
    return ok(`Error: ${error.message}`);
  }
}

