/**
 * run_workflow.ts - Execute validated plan steps locally
 *
 * This tool executes validated WorkPlan steps by calling the appropriate
 * MCP tools directly within the Architect MCP server.
 */

import { getFullPlan } from '../planner/incremental.js';

type MCPReturn = Promise<{ content: Array<{ type: "text"; text: string }> }>;

const ok = (text: string): MCPReturn => Promise.resolve({ content: [{ type: "text", text }] });
const toText = (obj: any): MCPReturn => ok(JSON.stringify(obj, null, 2));

interface WorkStep {
  title: string;
  repo: string;
  branch: string;
  files: string[];
  tool: string;
  params: Record<string, any>;
  diff_policy: string;
  tests: string[];
}

interface StepResult {
  step: number;
  title: string;
  status: 'success' | 'failed' | 'skipped';
  output?: string;
  error?: string;
  duration_ms: number;
}

/**
 * run_plan_steps - Execute a validated plan's steps
 * 
 * Reads the plan from the database, validates it, and executes each step
 * by calling the appropriate MCP tool.
 * 
 * @param plan_id - The ID of the plan to execute
 * @returns Execution results for each step
 */
export async function handleRunPlanSteps(args: { plan_id: number }): Promise<MCPReturn> {
  const startTime = Date.now();

  try {
    // Get plan from database
    const plan = getFullPlan(args.plan_id);

    if (!plan) {
      return ok(`Error: Plan ${args.plan_id} not found`);
    }

    if (plan.state !== 'done') {
      return ok(`Error: Plan ${args.plan_id} is not complete (state: ${plan.state})`);
    }

    // Parse steps from JSON
    if (!plan.steps_json) {
      return ok(`Error: Plan has no steps`);
    }

    let steps: WorkStep[];
    try {
      steps = JSON.parse(plan.steps_json);
    } catch (err) {
      return ok(`Error: Failed to parse plan steps: ${err}`);
    }

    if (!Array.isArray(steps) || steps.length === 0) {
      return ok(`Error: Plan has no steps to execute`);
    }

    // Execute each step
    const results: StepResult[] = [];
    let successCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepStartTime = Date.now();
      
      console.log(`\n[run_plan_steps] Executing step ${i + 1}/${steps.length}: ${step.title}`);
      
      try {
        // Execute the step
        const result = await executeStep(step);
        
        const duration = Date.now() - stepStartTime;
        
        if (result.success) {
          successCount++;
          results.push({
            step: i + 1,
            title: step.title,
            status: 'success',
            output: result.output,
            duration_ms: duration,
          });
          console.log(`[run_plan_steps] ✅ Step ${i + 1} succeeded (${duration}ms)`);
        } else {
          failedCount++;
          results.push({
            step: i + 1,
            title: step.title,
            status: 'failed',
            error: result.error,
            duration_ms: duration,
          });
          console.log(`[run_plan_steps] ❌ Step ${i + 1} failed: ${result.error}`);
          
          // Stop on first failure
          console.log(`[run_plan_steps] Stopping execution due to failure`);
          break;
        }
      } catch (err: any) {
        const duration = Date.now() - stepStartTime;
        failedCount++;
        results.push({
          step: i + 1,
          title: step.title,
          status: 'failed',
          error: err.message || String(err),
          duration_ms: duration,
        });
        console.log(`[run_plan_steps] ❌ Step ${i + 1} threw exception: ${err.message}`);
        break;
      }
    }
    
    const totalDuration = Date.now() - startTime;
    
    // Return results
    return toText({
      plan_id: args.plan_id,
      total_steps: steps.length,
      executed: results.length,
      succeeded: successCount,
      failed: failedCount,
      duration_ms: totalDuration,
      results,
      message: failedCount > 0 
        ? `Plan execution failed at step ${results[results.length - 1].step}`
        : `Plan executed successfully (${successCount}/${steps.length} steps)`,
    });
    
  } catch (err: any) {
    return ok(`Error executing plan: ${err.message}`);
  }
}

/**
 * Execute a single step by calling the appropriate tool
 */
async function executeStep(step: WorkStep): Promise<{ success: boolean; output?: string; error?: string }> {
  // Parse tool name (format: "server.tool" or "server.namespace.tool")
  const toolParts = step.tool.split('.');
  
  if (toolParts.length < 2) {
    return {
      success: false,
      error: `Invalid tool format: ${step.tool} (expected "server.tool")`,
    };
  }
  
  const server = toolParts[0];
  const toolName = toolParts.slice(1).join('.');
  
  // For now, we only support augment.launch-process
  // In the future, this could be extended to call other MCP servers
  if (server === 'augment' && toolName === 'launch-process') {
    return await executeAugmentLaunchProcess(step.params);
  }
  
  // Unsupported tool
  return {
    success: false,
    error: `Unsupported tool: ${step.tool}. Only augment.launch-process is currently supported.`,
  };
}

/**
 * Execute augment.launch-process by spawning a child process
 */
async function executeAugmentLaunchProcess(params: Record<string, any>): Promise<{ success: boolean; output?: string; error?: string }> {
  const { command, cwd, wait, max_wait_seconds } = params;
  
  if (!command) {
    return { success: false, error: 'Missing required parameter: command' };
  }
  
  // Import child_process
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  try {
    const timeout = (max_wait_seconds || 60) * 1000;
    
    const { stdout, stderr } = await execAsync(command, {
      cwd: cwd || process.cwd(),
      timeout,
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });
    
    return {
      success: true,
      output: stdout + (stderr ? `\nSTDERR: ${stderr}` : ''),
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || String(err),
    };
  }
}

