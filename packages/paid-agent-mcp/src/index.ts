#!/usr/bin/env node
/**
 * Paid Agent MCP Server
 *
 * Purpose: Execute tasks with PREFERENCE for PAID models (OpenAI, Claude)
 *          but CAN use FREE models (Ollama) if requested
 *
 * Supported Providers (ALL):
 * - FREE: Ollama (qwen, deepseek, codellama) - $0.00
 * - PAID: OpenAI (gpt-4o-mini, gpt-4o, o1-mini) - $0.15-$15/1M tokens
 * - PAID: Claude (haiku, sonnet, opus) - $0.25-$75/1M tokens
 *
 * Default Behavior:
 * - preferFree=false (prefers PAID models by default)
 * - Can be overridden per request
 *
 * Features:
 * - Multi-provider support (OpenAI, Claude, Ollama)
 * - Smart model selection based on budget and complexity
 * - Per-job token limits
 * - Monthly budget enforcement
 * - Concurrency control
 * - Cost tracking and optimization
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { initDatabase, createJob, getJob, updateJob, getMonthlySpend, recordSpend } from './db.js';
import { getPolicy } from './policy.js';
import { initializePricing, getModelPricing, getPricingInfo, refreshPricing } from './pricing.js';
import { getTokenTracker } from './token-tracker.js';
import { selectBestModel, estimateTaskCost, getModelConfig, COST_POLICY, requiresApproval, withinBudget } from './model-catalog.js';
import { getSharedOllamaClient } from './ollama-client.js';
import { getSharedToolkitClient, type ToolkitCallParams, getSharedFileEditor } from '@robinsonai/shared-llm';

const server = new Server(
  {
    name: 'paid-agent-mcp',
    version: '0.2.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Anthropic (Claude) client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Initialize database and pricing
initDatabase();
initializePricing(); // Non-blocking, starts with fallback

// Concurrency control
let activeJobs = 0;
const jobQueue: Array<{ resolve: Function; reject: Function }> = [];

async function acquireJobSlot(): Promise<void> {
  const policy = getPolicy();
  if (activeJobs < policy.MAX_CONCURRENCY) {
    activeJobs++;
    return Promise.resolve();
  }

  // Queue the job
  return new Promise((resolve, reject) => {
    jobQueue.push({ resolve, reject });
  });
}

function releaseJobSlot(): void {
  activeJobs--;

  // Process next job in queue
  if (jobQueue.length > 0) {
    const next = jobQueue.shift();
    if (next) {
      activeJobs++;
      next.resolve();
    }
  }
}

/**
 * Agent configurations (pricing loaded dynamically from pricing.ts)
 */
const AGENTS = {
  'mini-worker': {
    model: 'gpt-4o-mini',
    max_tokens: 4096,
    temperature: 0.3,
  },
  'balanced-worker': {
    model: 'gpt-4o',
    max_tokens: 4096,
    temperature: 0.3,
  },
  'premium-worker': {
    model: 'o1-mini',
    max_tokens: 8192,
    temperature: 1.0, // o1 doesn't support temperature
  },
};

/**
 * Get agent config with live pricing
 */
async function getAgentConfig(agent: keyof typeof AGENTS) {
  const config = AGENTS[agent];
  const pricing = await getModelPricing(config.model);

  return {
    ...config,
    cost_per_1k_input: pricing.cost_per_1k_input,
    cost_per_1k_output: pricing.cost_per_1k_output,
    pricing_source: pricing.source,
    pricing_updated: new Date(pricing.last_updated).toISOString()
  };
}

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'openai_worker_run_job',
        description: 'Execute a job with specified agent (mini-worker, balanced-worker, premium-worker)',
        inputSchema: {
          type: 'object',
          properties: {
            agent: {
              type: 'string',
              enum: ['mini-worker', 'balanced-worker', 'premium-worker'],
              description: 'Which agent to use',
            },
            task: {
              type: 'string',
              description: 'Task description',
            },
            input_refs: {
              type: 'array',
              items: { type: 'string' },
              description: 'Input file paths or content references',
            },
            caps: {
              type: 'object',
              properties: {
                max_tokens: { type: 'number' },
                timeout_seconds: { type: 'number' },
              },
            },
          },
          required: ['agent', 'task'],
        },
      },
      {
        name: 'openai_worker_queue_batch',
        description: 'Queue multiple jobs for batch processing (cheaper, slower)',
        inputSchema: {
          type: 'object',
          properties: {
            jobs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  agent: { type: 'string' },
                  task: { type: 'string' },
                  input_refs: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
          required: ['jobs'],
        },
      },
      {
        name: 'openai_worker_get_job_status',
        description: 'Get status of a job',
        inputSchema: {
          type: 'object',
          properties: {
            job_id: {
              type: 'string',
              description: 'Job ID',
            },
          },
          required: ['job_id'],
        },
      },
      {
        name: 'openai_worker_get_spend_stats',
        description: 'Get monthly spend statistics',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'openai_worker_estimate_cost',
        description: 'Estimate cost for a job before running it (helps decide between free Ollama vs paid OpenAI)',
        inputSchema: {
          type: 'object',
          properties: {
            agent: {
              type: 'string',
              enum: ['mini-worker', 'balanced-worker', 'premium-worker'],
              description: 'Which agent to estimate for',
            },
            estimated_input_tokens: {
              type: 'number',
              description: 'Estimated input tokens (rough: 1 token ≈ 4 chars)',
            },
            estimated_output_tokens: {
              type: 'number',
              description: 'Estimated output tokens',
            },
          },
          required: ['agent', 'estimated_input_tokens', 'estimated_output_tokens'],
        },
      },
      {
        name: 'openai_worker_get_capacity',
        description: 'Get current capacity and availability of OpenAI workers',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'openai_worker_refresh_pricing',
        description: 'Force refresh OpenAI pricing from live source (normally auto-refreshes every 24 hours)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'openai_worker_get_token_analytics',
        description: 'Get detailed token usage analytics. Shows actual tokens used, real costs, and spending patterns.',
        inputSchema: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              description: 'Time period to analyze',
              enum: ['today', 'week', 'month', 'all'],
            },
          },
        },
      },
      {
        name: 'execute_versatile_task_paid-agent-mcp',
        description: 'Execute ANY task using PAID models (OpenAI, Claude, etc.). This agent is VERSATILE and can handle all types of work. Supports multi-provider execution with smart model selection and cost optimization.',
        inputSchema: {
          type: 'object',
          properties: {
            task: {
              type: 'string',
              description: 'What to do (e.g., "Generate user profile component", "Set up Neon database", "Deploy to Vercel")',
            },
            taskType: {
              type: 'string',
              enum: ['code_generation', 'code_analysis', 'refactoring', 'test_generation', 'documentation', 'toolkit_call', 'file_editing'],
              description: 'Type of task to execute',
            },
            params: {
              type: 'object',
              description: 'Task-specific parameters (varies by taskType)',
            },
            minQuality: {
              type: 'string',
              enum: ['basic', 'standard', 'premium', 'best'],
              description: 'Minimum quality requirement (default: standard)',
            },
            maxCost: {
              type: 'number',
              description: 'Maximum cost allowed in USD (default: $1.00, set to 0 for FREE Ollama only)',
            },
            taskComplexity: {
              type: 'string',
              enum: ['simple', 'medium', 'complex', 'expert'],
              description: 'Task complexity (affects model selection, default: medium)',
            },
          },
          required: ['task', 'taskType'],
        },
      },
      {
        name: 'discover_toolkit_tools_openai-worker-mcp',
        description: 'Search for tools in Robinson\'s Toolkit by keyword. Dynamically discovers tools as new ones are added to the toolkit.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (e.g., "database", "deploy", "email")',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 10)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'list_toolkit_categories_openai-worker-mcp',
        description: 'List all available categories in Robinson\'s Toolkit (github, vercel, neon, upstash, google, etc.). Dynamically updates as new categories are added.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'list_toolkit_tools_openai-worker-mcp',
        description: 'List all tools in a specific category. Dynamically updates as new tools are added to Robinson\'s Toolkit.',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Category name (github, vercel, neon, upstash, google)',
            },
          },
          required: ['category'],
        },
      },
      // Universal file editing tools (work in ANY MCP client: Augment, Cline, Cursor, etc.)
      {
        name: 'file_str_replace',
        description: 'Replace text in a file (universal - works in any MCP client). Like Augment\'s str-replace-editor but works everywhere.',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path relative to workspace root',
            },
            old_str: {
              type: 'string',
              description: 'Text to find and replace',
            },
            new_str: {
              type: 'string',
              description: 'Replacement text',
            },
            old_str_start_line: {
              type: 'number',
              description: 'Optional: Start line number (1-based) to narrow search',
            },
            old_str_end_line: {
              type: 'number',
              description: 'Optional: End line number (1-based) to narrow search',
            },
          },
          required: ['path', 'old_str', 'new_str'],
        },
      },
      {
        name: 'file_insert',
        description: 'Insert text at a specific line in a file (universal - works in any MCP client)',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path relative to workspace root',
            },
            insert_line: {
              type: 'number',
              description: 'Line number to insert after (0 = beginning of file)',
            },
            new_str: {
              type: 'string',
              description: 'Text to insert',
            },
          },
          required: ['path', 'insert_line', 'new_str'],
        },
      },
      {
        name: 'file_save',
        description: 'Create a new file (universal - works in any MCP client). Like Augment\'s save-file but works everywhere.',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path relative to workspace root',
            },
            content: {
              type: 'string',
              description: 'File content',
            },
            add_last_line_newline: {
              type: 'boolean',
              description: 'Add newline at end of file (default: true)',
            },
          },
          required: ['path', 'content'],
        },
      },
      {
        name: 'file_delete',
        description: 'Delete a file (universal - works in any MCP client)',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path relative to workspace root',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'file_read',
        description: 'Read file content (universal - works in any MCP client)',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path relative to workspace root',
            },
          },
          required: ['path'],
        },
      },
    ],
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'openai_worker_run_job':
        return await handleRunJob(args);
      case 'openai_worker_queue_batch':
        return await handleQueueBatch(args);
      case 'openai_worker_get_job_status':
        return await handleGetJobStatus(args);
      case 'openai_worker_get_spend_stats':
        return await handleGetSpendStats();
      case 'openai_worker_estimate_cost':
        return await handleEstimateCost(args);
      case 'openai_worker_get_capacity':
        return await handleGetCapacity();
      case 'openai_worker_refresh_pricing':
        return await handleRefreshPricing();
      case 'openai_worker_get_token_analytics':
      case 'paid_agent_get_token_analytics':
        return await handleGetTokenAnalytics(args);
      case 'execute_versatile_task_openai-worker-mcp':
      case 'execute_versatile_task_paid-agent-mcp':
        return await handleExecuteVersatileTask(args);
      case 'discover_toolkit_tools_openai-worker-mcp':
      case 'discover_toolkit_tools_paid-agent-mcp':
        return await handleDiscoverToolkitTools(args);
      case 'list_toolkit_categories_openai-worker-mcp':
        return await handleListToolkitCategories();
      case 'list_toolkit_tools_openai-worker-mcp':
        return await handleListToolkitTools(args);

      // Universal file editing tools (work in ANY MCP client!)
      case 'file_str_replace':
        const strReplaceResult = await getSharedFileEditor().strReplace(args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(strReplaceResult, null, 2) }],
        };
      case 'file_insert':
        const insertResult = await getSharedFileEditor().insert(args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(insertResult, null, 2) }],
        };
      case 'file_save':
        const saveResult = await getSharedFileEditor().saveFile(args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(saveResult, null, 2) }],
        };
      case 'file_delete':
        const deleteResult = await getSharedFileEditor().deleteFile(args as any);
        return {
          content: [{ type: 'text', text: JSON.stringify(deleteResult, null, 2) }],
        };
      case 'file_read':
        const content = await getSharedFileEditor().readFile((args as any).path);
        return {
          content: [{ type: 'text', text: content }],
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
    };
  }
});

/**
 * Run a job
 */
async function handleRunJob(args: any) {
  const { agent, task, input_refs = [], caps = {} } = args;

  // Validate agent
  if (!AGENTS[agent as keyof typeof AGENTS]) {
    throw new Error(`Invalid agent: ${agent}`);
  }

  const agentConfig = AGENTS[agent as keyof typeof AGENTS];
  const policy = getPolicy();

  // Check monthly budget
  const monthlySpend = getMonthlySpend();
  if (monthlySpend >= policy.MONTHLY_BUDGET) {
    throw new Error(`Monthly budget exceeded: $${monthlySpend.toFixed(2)} / $${policy.MONTHLY_BUDGET}`);
  }

  // Acquire job slot (queues if at max concurrency)
  await acquireJobSlot();

  // Create job record
  const jobStartTime = Date.now();
  const job = createJob({
    agent,
    task,
    input_refs: JSON.stringify(input_refs),
    state: 'running',
  });

  try {
    // Execute with OpenAI
    const maxTokens = caps.max_tokens || agentConfig.max_tokens;

    const completion = await openai.chat.completions.create({
      model: agentConfig.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that performs code editing, formatting, and transformation tasks. Be concise and precise.',
        },
        {
          role: 'user',
          content: task,
        },
      ],
      max_tokens: maxTokens,
      temperature: agentConfig.temperature,
    });

    const result = completion.choices[0]?.message?.content || '';
    const usage = completion.usage;

    // Calculate cost using live pricing
    const pricing = await getModelPricing(agentConfig.model);
    const inputCost = ((usage?.prompt_tokens || 0) / 1000) * pricing.cost_per_1k_input;
    const outputCost = ((usage?.completion_tokens || 0) / 1000) * pricing.cost_per_1k_output;
    const totalCost = inputCost + outputCost;

    // Record spend
    recordSpend(totalCost);

    // Track token usage
    const tracker = getTokenTracker();
    tracker.record({
      timestamp: new Date().toISOString(),
      agent_type: agent as any,
      model: agentConfig.model,
      task_type: 'run_job',
      tokens_input: usage?.prompt_tokens || 0,
      tokens_output: usage?.completion_tokens || 0,
      tokens_total: usage?.total_tokens || 0,
      cost_usd: totalCost,
      time_ms: Date.now() - jobStartTime,
      success: true
    });

    // Update job
    updateJob(job.id, {
      state: 'completed',
      result,
      tokens_used: (usage?.total_tokens || 0),
      cost: totalCost,
      completed_at: new Date().toISOString(),
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            job_id: job.id,
            state: 'completed',
            result,
            tokens_used: {
              input: usage?.prompt_tokens || 0,
              output: usage?.completion_tokens || 0,
              total: usage?.total_tokens || 0,
            },
            cost: {
              input: inputCost,
              output: outputCost,
              total: totalCost,
              currency: 'USD',
              pricing_source: pricing.source,
            },
            model: agentConfig.model,
            agent,
          }, null, 2),
        },
      ],
    };
  } catch (error: any) {
    updateJob(job.id, {
      state: 'failed',
      error: error.message,
      completed_at: new Date().toISOString(),
    });
    throw error;
  } finally {
    // Always release the job slot
    releaseJobSlot();
  }
}

/**
 * Queue batch jobs
 */
async function handleQueueBatch(args: any) {
  const { jobs } = args;

  const jobIds = jobs.map((jobData: any) => {
    const job = createJob({
      agent: jobData.agent,
      task: jobData.task,
      input_refs: JSON.stringify(jobData.input_refs || []),
      state: 'queued',
    });
    return job.id;
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          message: `Queued ${jobs.length} jobs`,
          job_ids: jobIds,
        }, null, 2),
      },
    ],
  };
}

/**
 * Get job status
 */
async function handleGetJobStatus(args: any) {
  const { job_id } = args;
  const job = getJob(job_id);

  if (!job) {
    throw new Error(`Job not found: ${job_id}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(job, null, 2),
      },
    ],
  };
}

/**
 * Get spend stats
 */
async function handleGetSpendStats() {
  const policy = getPolicy();
  const monthlySpend = getMonthlySpend();

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          current_month: monthlySpend,
          total_budget: policy.MONTHLY_BUDGET,
          remaining: Math.max(0, policy.MONTHLY_BUDGET - monthlySpend),
          percentage_used: (monthlySpend / policy.MONTHLY_BUDGET) * 100,
        }, null, 2),
      },
    ],
  };
}

/**
 * Estimate cost for a job (uses live pricing)
 */
async function handleEstimateCost(args: any) {
  const { agent, estimated_input_tokens, estimated_output_tokens } = args;

  if (!AGENTS[agent as keyof typeof AGENTS]) {
    throw new Error(`Invalid agent: ${agent}`);
  }

  // Get agent config with live pricing
  const agentConfig = await getAgentConfig(agent as keyof typeof AGENTS);

  const inputCost = (estimated_input_tokens / 1000) * agentConfig.cost_per_1k_input;
  const outputCost = (estimated_output_tokens / 1000) * agentConfig.cost_per_1k_output;
  const totalCost = inputCost + outputCost;

  const policy = getPolicy();
  const monthlySpend = getMonthlySpend();
  const remaining = Math.max(0, policy.MONTHLY_BUDGET - monthlySpend);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          agent,
          model: agentConfig.model,
          pricing: {
            source: agentConfig.pricing_source,
            updated: agentConfig.pricing_updated,
            input_per_1k: agentConfig.cost_per_1k_input,
            output_per_1k: agentConfig.cost_per_1k_output
          },
          estimated_cost: {
            input: inputCost,
            output: outputCost,
            total: totalCost,
            currency: 'USD'
          },
          budget_impact: {
            monthly_budget: policy.MONTHLY_BUDGET,
            current_spend: monthlySpend,
            remaining_budget: remaining,
            percentage_of_remaining: remaining > 0 ? (totalCost / remaining) * 100 : 0,
            can_afford: totalCost <= remaining
          },
          recommendation: totalCost > remaining
            ? 'BLOCKED - Would exceed monthly budget. Use free Ollama agents instead.'
            : totalCost > (remaining * 0.5)
            ? 'CAUTION - Uses >50% of remaining budget. Consider free Ollama agents.'
            : totalCost > (remaining * 0.1)
            ? 'OK - Moderate cost. Ollama agents are free alternative.'
            : 'OK - Low cost impact.'
        }, null, 2),
      },
    ],
  };
}

/**
 * Refresh pricing from live source
 */
async function handleRefreshPricing() {
  const success = await refreshPricing();
  const pricingInfo = getPricingInfo();

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          success,
          message: success
            ? 'Successfully refreshed pricing from live source'
            : 'Failed to refresh pricing, using cached/fallback values',
          pricing_info: pricingInfo
        }, null, 2),
      },
    ],
  };
}

/**
 * Get capacity info (uses live pricing)
 */
async function handleGetCapacity() {
  const policy = getPolicy();
  const monthlySpend = getMonthlySpend();
  const remaining = Math.max(0, policy.MONTHLY_BUDGET - monthlySpend);

  // Get live pricing for all agents
  const miniConfig = await getAgentConfig('mini-worker');
  const balancedConfig = await getAgentConfig('balanced-worker');
  const premiumConfig = await getAgentConfig('premium-worker');
  const pricingInfo = getPricingInfo();

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          max_concurrency: policy.MAX_CONCURRENCY,
          config: `Set MAX_OPENAI_CONCURRENCY=1-10 (current: ${policy.MAX_CONCURRENCY})`,
          budget: {
            monthly_limit: policy.MONTHLY_BUDGET,
            spent: monthlySpend,
            remaining,
            percentage_used: (monthlySpend / policy.MONTHLY_BUDGET) * 100
          },
          pricing_info: {
            last_updated: pricingInfo.last_updated,
            cache_age_hours: Math.round(pricingInfo.cache_age_hours * 10) / 10,
            sources: pricingInfo.sources
          },
          agents: {
            'mini-worker': {
              model: miniConfig.model,
              cost_per_1k_input: miniConfig.cost_per_1k_input,
              cost_per_1k_output: miniConfig.cost_per_1k_output,
              pricing_source: miniConfig.pricing_source,
              note: 'Cheapest - good for simple tasks'
            },
            'balanced-worker': {
              model: balancedConfig.model,
              cost_per_1k_input: balancedConfig.cost_per_1k_input,
              cost_per_1k_output: balancedConfig.cost_per_1k_output,
              pricing_source: balancedConfig.pricing_source,
              note: 'Mid-tier - good balance of cost/quality'
            },
            'premium-worker': {
              model: premiumConfig.model,
              cost_per_1k_input: premiumConfig.cost_per_1k_input,
              cost_per_1k_output: premiumConfig.cost_per_1k_output,
              pricing_source: premiumConfig.pricing_source,
              note: 'Most expensive - use sparingly'
            }
          },
          free_alternative: {
            server: 'autonomous-agent-mcp',
            cost: 0,
            note: 'FREE - runs on local Ollama. Use this first!'
          }
        }, null, 2),
      },
    ],
  };
}

/**
 * Get token analytics
 */
async function handleGetTokenAnalytics(args: any) {
  const tracker = getTokenTracker();
  const period = args?.period || 'all';
  const stats = tracker.getStats(period);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          ...stats,
          database_path: tracker.getDatabasePath(),
          note: 'Real OpenAI costs - track your spending!'
        }, null, 2),
      },
    ],
  };
}

/**
 * Execute versatile task with smart model selection
 */
async function handleExecuteVersatileTask(args: any) {
  const {
    task,
    taskType,
    params = {},
    minQuality = 'standard',
    maxCost = COST_POLICY.DEFAULT_MAX_COST,
    taskComplexity = 'medium',
    forcePaid = false,  // NEW: Force PAID OpenAI (bypass FREE Ollama)
  } = args;

  console.error(`[OpenAIWorker] Executing versatile task: ${taskType} - ${task}`);
  if (forcePaid) {
    console.error(`[OpenAIWorker] forcePaid=true - Will use PAID OpenAI (bypassing FREE Ollama)`);
  }

  // Select best model (FREE Ollama first, PAID OpenAI when needed)
  const modelId = selectBestModel({
    minQuality,
    maxCost,
    taskComplexity,
    preferFree: !forcePaid,  // If forcePaid=true, preferFree=false
  });

  const modelConfig = getModelConfig(modelId);
  console.error(`[OpenAIWorker] Selected model: ${modelId} (${modelConfig.provider})`);

  // Estimate cost
  const estimatedInputTokens = params.estimatedInputTokens || 1000;
  const estimatedOutputTokens = params.estimatedOutputTokens || 1000;
  const estimatedCost = estimateTaskCost({
    modelId,
    estimatedInputTokens,
    estimatedOutputTokens,
  });

  console.error(`[OpenAIWorker] Estimated cost: $${estimatedCost.toFixed(4)}`);

  // Check if approval required
  if (requiresApproval(estimatedCost)) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: 'APPROVAL_REQUIRED',
            message: `Task estimated to cost $${estimatedCost.toFixed(2)}, which exceeds approval threshold of $${COST_POLICY.HUMAN_APPROVAL_REQUIRED_OVER}`,
            estimatedCost,
            model: modelId,
            suggestion: 'Set maxCost=0 to use FREE Ollama only, or increase approval threshold',
          }, null, 2),
        },
      ],
    };
  }

  // Check monthly budget
  const monthlySpend = getMonthlySpend();
  if (!withinBudget(monthlySpend, estimatedCost)) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: 'BUDGET_EXCEEDED',
            message: `Monthly budget of $${COST_POLICY.MONTHLY_BUDGET} would be exceeded`,
            currentSpend: monthlySpend,
            estimatedCost,
            remaining: COST_POLICY.MONTHLY_BUDGET - monthlySpend,
            suggestion: 'Use FREE Ollama (set maxCost=0) or wait until next month',
          }, null, 2),
        },
      ],
    };
  }

  // Execute task based on taskType
  try {
    let result: any;

    switch (taskType) {
      case 'toolkit_call':
        // Call Robinson's Toolkit for DB setup, deployment, account management, etc.
        const toolkitClient = getSharedToolkitClient();

        const toolkitParams: ToolkitCallParams = {
          category: params.category || '',
          tool_name: params.tool_name || '',
          arguments: params.arguments || {},
        };

        const toolkitResult = await toolkitClient.callTool(toolkitParams);

        if (!toolkitResult.success) {
          throw new Error(`Toolkit call failed: ${toolkitResult.error}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                result: toolkitResult.result,
                cost: {
                  total: 0,
                  currency: 'USD',
                  note: 'FREE - Robinson\'s Toolkit call',
                },
              }, null, 2),
            },
          ],
        };

      case 'code_generation':
      case 'code_analysis':
      case 'refactoring':
      case 'test_generation':
      case 'documentation':
        // Use selected model (Ollama or OpenAI)
        if (modelConfig.provider === 'ollama') {
          // Use FREE Ollama
          const ollamaClient = getSharedOllamaClient();

          const messages = [
            {
              role: 'system' as const,
              content: `You are a ${taskType.replace('_', ' ')} expert. ${params.context || ''}`,
            },
            {
              role: 'user' as const,
              content: task,
            },
          ];

          result = await ollamaClient.chatCompletion({
            model: modelId,
            messages,
            temperature: params.temperature || 0.7,
            maxTokens: params.maxTokens,
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  result: result.content,
                  usage: result.usage,
                  cost: {
                    total: 0,
                    currency: 'USD',
                    note: 'FREE - Ollama execution',
                  },
                  model: modelId,
                }, null, 2),
              },
            ],
          };
        } else if (modelConfig.provider === 'claude') {
          // Use PAID Claude (Anthropic)
          const systemPrompt = `You are a ${taskType.replace('_', ' ')} expert. ${params.context || ''}`;

          const response = await anthropic.messages.create({
            model: modelConfig.model,
            max_tokens: params.maxTokens || modelConfig.maxTokens || 4096,
            temperature: params.temperature || 0.7,
            system: systemPrompt,
            messages: [
              {
                role: 'user',
                content: task,
              },
            ],
          });

          const usage = response.usage;
          const content = response.content[0];
          const resultText = content.type === 'text' ? content.text : '';

          // Calculate actual cost
          const actualCost = estimateTaskCost({
            modelId,
            estimatedInputTokens: usage.input_tokens,
            estimatedOutputTokens: usage.output_tokens,
          });

          // Record spend
          recordSpend(actualCost, `versatile_task_${modelConfig.model}`);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  result: resultText,
                  usage: {
                    promptTokens: usage.input_tokens,
                    completionTokens: usage.output_tokens,
                    totalTokens: usage.input_tokens + usage.output_tokens,
                  },
                  cost: {
                    total: actualCost,
                    currency: 'USD',
                    note: 'PAID - Claude (Anthropic) execution',
                  },
                  model: modelId,
                }, null, 2),
              },
            ],
          };
        } else {
          // Use PAID OpenAI
          const messages = [
            {
              role: 'system' as const,
              content: `You are a ${taskType.replace('_', ' ')} expert. ${params.context || ''}`,
            },
            {
              role: 'user' as const,
              content: task,
            },
          ];

          const response = await openai.chat.completions.create({
            model: modelConfig.model,
            messages,
            temperature: params.temperature || 0.7,
            max_tokens: params.maxTokens,
          });

          const choice = response.choices[0];
          const usage = response.usage;

          // Calculate actual cost
          const actualCost = estimateTaskCost({
            modelId,
            estimatedInputTokens: usage?.prompt_tokens || 0,
            estimatedOutputTokens: usage?.completion_tokens || 0,
          });

          // Record spend
          recordSpend(actualCost, `versatile_task_${modelConfig.model}`);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  result: choice.message.content,
                  usage: {
                    promptTokens: usage?.prompt_tokens || 0,
                    completionTokens: usage?.completion_tokens || 0,
                    totalTokens: usage?.total_tokens || 0,
                  },
                  cost: {
                    total: actualCost,
                    currency: 'USD',
                    note: 'PAID - OpenAI execution',
                  },
                  model: modelId,
                }, null, 2),
              },
            ],
          };
        }

      case 'file_editing':
        // NEW: Direct file editing using universal file tools
        const fileEditResult = await handleFileEditing(task, params, modelId, modelConfig);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(fileEditResult, null, 2),
            },
          ],
        };

      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
  } catch (error: any) {
    console.error(`[OpenAIWorker] Error:`, error.message);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error.message,
            model: modelId,
          }, null, 2),
        },
      ],
    };
  }
}

/**
 * Handle file editing tasks using LLM to determine operations, then execute them
 */
async function handleFileEditing(task: string, params: any, modelId: string, modelConfig: any): Promise<any> {
  console.error(`[PaidAgent] File editing task: ${task}`);

  const fileEditor = getSharedFileEditor();
  const results: any[] = [];

  // STEP 1: Detect task complexity and choose strategy
  // Simple tasks: Small, targeted changes (fix typo, change variable name, update version)
  // Complex tasks: Large-scale changes (convert format, standardize, refactor, redesign)
  const isSimpleTask = /fix typo|change variable|update version|add comment|remove comment/i.test(task);
  const isComplexTask = /convert|standardize|format|single-line|multi-line|refactor|redesign|rewrite|restructure/i.test(task);

  // HYBRID APPROACH (Option C):
  // - Simple tasks: Use file operations (precise, targeted changes)
  // - Complex tasks: Generate full code and replace entire sections
  const useFileOperations = isSimpleTask && !isComplexTask;

  console.error(`[PaidAgent] Strategy: ${useFileOperations ? 'FILE_OPERATIONS' : 'FULL_CODE_GENERATION'} (simple=${isSimpleTask}, complex=${isComplexTask})`);

  // STEP 2: Read the file first to get actual content
  // Try multiple patterns to extract file path
  let filePath = params?.path || params?.file;
  console.error(`[PaidAgent] Initial filePath from params: ${filePath}`);

  if (!filePath) {
    // Pattern 1: "in packages/..." or "file packages/..."
    const match1 = task.match(/(?:in|file|path:?)\s+([\w\-\/\.]+\.(?:ts|js|tsx|jsx|json|md))/i);
    if (match1) {
      filePath = match1[1];
      console.error(`[PaidAgent] Extracted filePath from pattern 1: ${filePath}`);
    }
  }
  if (!filePath) {
    // Pattern 2: Just look for any path with file extension
    const match2 = task.match(/([\w\-\/\.]+\.(?:ts|js|tsx|jsx|json|md))/i);
    if (match2) {
      filePath = match2[1];
      console.error(`[PaidAgent] Extracted filePath from pattern 2: ${filePath}`);
    }
  }

  console.error(`[PaidAgent] Final filePath: ${filePath}`);
  console.error(`[PaidAgent] Task: ${task}`);

  let fileContent = '';
  if (filePath) {
    try {
      fileContent = await fileEditor.readFile(filePath);
      console.error(`[PaidAgent] Read ${filePath}: ${fileContent.length} chars`);
    } catch (e: any) {
      console.error(`[PaidAgent] Could not read ${filePath}: ${e.message}`);
    }
  } else {
    console.error(`[PaidAgent] ⚠️  No filePath found! Cannot read file.`);
  }

  // If complex task, use full code generation approach
  if (!useFileOperations) {
    return await handleComplexFileEditing(task, params, filePath, fileContent, fileEditor, modelId, modelConfig);
  }

  // STEP 3: Use LLM to analyze the task and determine file operations
  const analysisPrompt = `You are a file editing assistant. Analyze this task and determine what file operations are needed.

Task: ${task}

Parameters: ${JSON.stringify(params, null, 2)}

${fileContent ? `Current file content (${fileContent.split('\n').length} lines):\n\`\`\`\n${fileContent.slice(0, 5000)}\n\`\`\`\n` : ''}

IMPORTANT RULES:
1. ALWAYS read the file first if you need to see its content
2. For str_replace: You MUST provide the EXACT old_str from the file (copy it exactly!)
3. For save: You MUST provide the complete content field
4. Use line numbers only if you're sure they're correct
5. Prefer smaller, targeted changes over large replacements

Respond with a JSON array of file operations. Each operation should have:
- operation: "read" | "str_replace" | "insert" | "save" | "delete"
- path: file path (REQUIRED for all operations)
- For read: (just path)
- For str_replace: old_str (REQUIRED, exact match), new_str (REQUIRED), old_str_start_line (optional), old_str_end_line (optional)
- For insert: insert_line (REQUIRED), new_str (REQUIRED)
- For save: content (REQUIRED, complete file content)
- For delete: (just path)

GOOD EXAMPLES:
[
  {
    "operation": "read",
    "path": "src/index.ts"
  },
  {
    "operation": "str_replace",
    "path": "src/index.ts",
    "old_str": "export const foo = 'bar';",
    "new_str": "export const foo = 'baz';",
    "old_str_start_line": 10,
    "old_str_end_line": 10
  }
]

BAD EXAMPLES (DO NOT DO THIS):
[
  {
    "operation": "save",
    "path": "src/index.ts"
    // ❌ Missing content field!
  },
  {
    "operation": "str_replace",
    "path": "src/index.ts",
    "old_str": "// approximate code",
    // ❌ old_str must be EXACT match from file!
    "new_str": "new code"
  }
]

Respond ONLY with the JSON array, no other text.`;

  try {
    let response: any;
    let actualCost = 0;

    // Use selected model (Ollama or OpenAI/Claude)
    if (modelConfig.provider === 'ollama') {
      const { ollamaGenerate } = await import('@robinsonai/shared-llm');
      response = await ollamaGenerate({
        model: modelId,
        prompt: analysisPrompt,
      });
      response = response.trim();
    } else if (modelConfig.provider === 'claude') {
      const anthropicResponse = await anthropic.messages.create({
        model: modelConfig.model,
        max_tokens: 4096,
        temperature: 0.1,
        messages: [{ role: 'user', content: analysisPrompt }],
      });
      const content = anthropicResponse.content[0];
      response = content.type === 'text' ? content.text : '';

      actualCost = estimateTaskCost({
        modelId,
        estimatedInputTokens: anthropicResponse.usage.input_tokens,
        estimatedOutputTokens: anthropicResponse.usage.output_tokens,
      });
      recordSpend(actualCost, `file_editing_${modelConfig.model}`);
    } else {
      // OpenAI
      const openaiResponse = await openai.chat.completions.create({
        model: modelConfig.model,
        messages: [{ role: 'user', content: analysisPrompt }],
        temperature: 0.1,
      });
      response = openaiResponse.choices[0].message.content || '';

      const usage = openaiResponse.usage;
      actualCost = estimateTaskCost({
        modelId,
        estimatedInputTokens: usage?.prompt_tokens || 0,
        estimatedOutputTokens: usage?.completion_tokens || 0,
      });
      recordSpend(actualCost, `file_editing_${modelConfig.model}`);
    }

    // Parse the response
    let operations: any[];
    try {
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }
      operations = JSON.parse(jsonStr);
    } catch (parseError: any) {
      console.error(`[PaidAgent] Failed to parse LLM response as JSON:`, response);
      throw new Error(`Failed to parse file operations: ${parseError.message}`);
    }

    // Execute each operation
    for (const op of operations) {
      console.error(`[PaidAgent] Executing ${op.operation} on ${op.path}`);

      let result: any;
      switch (op.operation) {
        case 'str_replace':
          result = await fileEditor.strReplace({
            path: op.path,
            old_str: op.old_str,
            new_str: op.new_str,
            old_str_start_line: op.old_str_start_line,
            old_str_end_line: op.old_str_end_line,
          });
          break;

        case 'insert':
          result = await fileEditor.insert({
            path: op.path,
            insert_line: op.insert_line,
            new_str: op.new_str,
          });
          break;

        case 'save':
          result = await fileEditor.saveFile({
            path: op.path,
            content: op.content,
            add_last_line_newline: op.add_last_line_newline,
          });
          break;

        case 'delete':
          result = await fileEditor.deleteFile({
            path: op.path,
          });
          break;

        case 'read':
          const content = await fileEditor.readFile(op.path);
          result = { success: true, content, path: op.path };
          break;

        default:
          result = { success: false, error: `Unknown operation: ${op.operation}` };
      }

      results.push(result);

      if (!result.success) {
        console.error(`[PaidAgent] Operation failed:`, result);
      }
    }

    // Return summary
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return {
      success: failCount === 0,
      message: `Executed ${results.length} file operations: ${successCount} succeeded, ${failCount} failed`,
      operations: results,
      cost: {
        total: actualCost,
        currency: 'USD',
        note: modelConfig.provider === 'ollama' ? 'FREE - Ollama + file operations' : `PAID - ${modelConfig.provider} + file operations`,
      },
      model: modelId,
    };
  } catch (error: any) {
    console.error(`[PaidAgent] File editing failed:`, error);
    return {
      success: false,
      error: error.message,
      cost: {
        total: 0,
        currency: 'USD',
      },
    };
  }
}

/**
 * Handle complex file editing using full code generation
 * (Option C: Hybrid Approach)
 */
async function handleComplexFileEditing(
  task: string,
  params: any,
  filePath: string,
  fileContent: string,
  fileEditor: any,
  modelId: string,
  modelConfig: any
): Promise<any> {
  console.error(`[PaidAgent] Using FULL CODE GENERATION approach for complex task`);
  console.error(`[PaidAgent] DEBUG - filePath: ${filePath}`);
  console.error(`[PaidAgent] DEBUG - fileContent length: ${fileContent.length}`);
  console.error(`[PaidAgent] DEBUG - task: ${task}`);

  try {
    // Extract line range if specified
    const lineRangeMatch = task.match(/lines?\s+(\d+)[-–](\d+)/i);
    const startLine = lineRangeMatch ? parseInt(lineRangeMatch[1]) : 1;
    const endLine = lineRangeMatch ? parseInt(lineRangeMatch[2]) : fileContent.split('\n').length;

    // Extract the section to modify
    const lines = fileContent.split('\n');
    const sectionToModify = lines.slice(startLine - 1, endLine).join('\n');
    const beforeSection = lines.slice(0, startLine - 1).join('\n');
    const afterSection = lines.slice(endLine).join('\n');

    console.error(`[PaidAgent] Modifying lines ${startLine}-${endLine} (${sectionToModify.length} chars)`);

    // Use LLM to generate the complete new code
    const codeGenPrompt = `You are a TypeScript code generation assistant. Your task is to modify a specific section of a file.

TASK: ${task}

CONTEXT:
- File: ${filePath}
- Lines to modify: ${startLine}-${endLine}
- Total file lines: ${lines.length}

SECTION TO MODIFY (lines ${startLine}-${endLine}):
\`\`\`typescript
${sectionToModify.slice(0, 10000)}
\`\`\`

${beforeSection ? `BEFORE THIS SECTION (for context):\n\`\`\`typescript\n${beforeSection.slice(-500)}\n\`\`\`\n` : ''}

${afterSection ? `AFTER THIS SECTION (for context):\n\`\`\`typescript\n${afterSection.slice(0, 500)}\n\`\`\`\n` : ''}

INSTRUCTIONS:
1. Generate ONLY the modified section (lines ${startLine}-${endLine})
2. Maintain the EXACT same structure and format as the original
3. Keep all TypeScript syntax valid
4. Do NOT include the before/after sections
5. Do NOT add markdown code blocks
6. Do NOT add explanations or comments
7. The output should be valid TypeScript that can directly replace lines ${startLine}-${endLine}

Generate the modified section now:`;

    let newCode: string;
    let actualCost = 0;

    // Use selected model (Ollama or OpenAI/Claude)
    if (modelConfig.provider === 'ollama') {
      const { ollamaGenerate } = await import('@robinsonai/shared-llm');
      newCode = await ollamaGenerate({
        model: modelId,
        prompt: codeGenPrompt,
      });
      newCode = newCode.trim();
    } else if (modelConfig.provider === 'claude') {
      const anthropicResponse = await anthropic.messages.create({
        model: modelConfig.model,
        max_tokens: 8192,
        temperature: 0.1,
        messages: [{ role: 'user', content: codeGenPrompt }],
      });
      const content = anthropicResponse.content[0];
      newCode = (content.type === 'text' ? content.text : '').trim();

      actualCost = estimateTaskCost({
        modelId,
        estimatedInputTokens: anthropicResponse.usage.input_tokens,
        estimatedOutputTokens: anthropicResponse.usage.output_tokens,
      });
      recordSpend(actualCost, `complex_file_editing_${modelConfig.model}`);
    } else {
      // OpenAI
      const openaiResponse = await openai.chat.completions.create({
        model: modelConfig.model,
        messages: [{ role: 'user', content: codeGenPrompt }],
        temperature: 0.1,
        max_tokens: 8192,
      });
      newCode = (openaiResponse.choices[0].message.content || '').trim();

      const usage = openaiResponse.usage;
      actualCost = estimateTaskCost({
        modelId,
        estimatedInputTokens: usage?.prompt_tokens || 0,
        estimatedOutputTokens: usage?.completion_tokens || 0,
      });
      recordSpend(actualCost, `complex_file_editing_${modelConfig.model}`);
    }

    // Clean up the generated code (remove markdown if present)
    newCode = newCode.trim();
    if (newCode.startsWith('```')) {
      // Remove markdown code blocks
      newCode = newCode.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim();
    }

    // Reconstruct the full file
    const fullFileContent = [
      beforeSection,
      newCode,
      afterSection
    ].filter(s => s).join('\n');

    console.error(`[PaidAgent] Reconstructed file: ${fullFileContent.split('\n').length} lines (was ${lines.length} lines)`);

    // Validate the generated code is not garbage
    if (fullFileContent.length < fileContent.length * 0.5) {
      throw new Error(`Generated code is too short (${fullFileContent.length} chars vs original ${fileContent.length} chars). Refusing to save.`);
    }

    if (!fullFileContent.includes('export') && fileContent.includes('export')) {
      throw new Error('Generated code is missing exports. Refusing to save.');
    }

    // Save the new code
    const result = await fileEditor.saveFile({
      path: filePath,
      content: fullFileContent,
      add_last_line_newline: true,
    });

    if (result.success) {
      console.error(`[PaidAgent] ✅ Successfully generated and saved new code`);
      return {
        success: true,
        message: `Generated and saved new code for ${filePath} (modified lines ${startLine}-${endLine})`,
        operations: [result],
        cost: {
          total: actualCost,
          currency: 'USD',
          note: modelConfig.provider === 'ollama' ? 'FREE - Ollama full code generation' : `PAID - ${modelConfig.provider} full code generation`,
        },
        model: modelId,
      };
    } else {
      throw new Error(result.error || 'Failed to save generated code');
    }
  } catch (error: any) {
    console.error(`[PaidAgent] Complex file editing failed:`, error);
    return {
      success: false,
      error: error.message,
      cost: {
        total: 0,
        currency: 'USD',
      },
    };
  }
}

/**
 * Discover toolkit tools
 */
async function handleDiscoverToolkitTools(args: any) {
  try {
    const toolkitClient = getSharedToolkitClient();
    const result = await toolkitClient.discoverTools(args.query || '', args.limit || 10);

    if (!result.success) {
      throw new Error(`Tool discovery failed: ${result.error}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result.result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
    };
  }
}

/**
 * List toolkit categories
 */
async function handleListToolkitCategories() {
  try {
    const toolkitClient = getSharedToolkitClient();
    const result = await toolkitClient.listCategories();

    if (!result.success) {
      throw new Error(`Failed to list categories: ${result.error}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result.result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
    };
  }
}

/**
 * List toolkit tools in a category
 */
async function handleListToolkitTools(args: any) {
  try {
    const toolkitClient = getSharedToolkitClient();
    const result = await toolkitClient.listTools(args.category || '');

    if (!result.success) {
      throw new Error(`Failed to list tools: ${result.error}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result.result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
    };
  }
}

/**
 * Start server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('OpenAI Worker MCP server running on stdio');
}

main().catch(console.error);

