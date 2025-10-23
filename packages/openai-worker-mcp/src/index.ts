#!/usr/bin/env node
/**
 * OpenAI Worker MCP Server
 * 
 * Purpose: Do work, not think (apply diffs, format, summarize, rename, small edits)
 * 
 * Sub-agents:
 * - mini-worker (gpt-4o-mini) - Very cheap, fast
 * - balanced-worker (gpt-4o) - Mid-tier
 * - premium-worker (o1-mini) - Expensive, gated
 * 
 * Features:
 * - Per-job token limits
 * - Monthly budget enforcement
 * - Concurrency control
 * - Batch mode for big backlogs
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import OpenAI from 'openai';
import { initDatabase, createJob, getJob, updateJob, getMonthlySpend, recordSpend } from './db.js';
import { getPolicy } from './policy.js';
import { initializePricing, getModelPricing, getPricingInfo, refreshPricing } from './pricing.js';
import { getTokenTracker } from './token-tracker.js';

const server = new Server(
  {
    name: 'openai-worker-mcp',
    version: '0.1.0',
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
        name: 'run_job',
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
        name: 'queue_batch',
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
        name: 'get_job_status',
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
        name: 'get_spend_stats',
        description: 'Get monthly spend statistics',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'estimate_cost',
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
        name: 'get_capacity',
        description: 'Get current capacity and availability of OpenAI workers',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'refresh_pricing',
        description: 'Force refresh OpenAI pricing from live source (normally auto-refreshes every 24 hours)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_token_analytics',
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
      case 'run_job':
        return await handleRunJob(args);
      case 'queue_batch':
        return await handleQueueBatch(args);
      case 'get_job_status':
        return await handleGetJobStatus(args);
      case 'get_spend_stats':
        return await handleGetSpendStats();
      case 'estimate_cost':
        return await handleEstimateCost(args);
      case 'get_capacity':
        return await handleGetCapacity();
      case 'refresh_pricing':
        return await handleRefreshPricing();
      case 'get_token_analytics':
        return await handleGetTokenAnalytics(args);
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
 * Start server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('OpenAI Worker MCP server running on stdio');
}

main().catch(console.error);

