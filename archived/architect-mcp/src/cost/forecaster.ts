/**
 * Cost Forecaster
 * 
 * Estimates tokens from plan skeleton and computes cost per model candidate.
 * Picks the cheapest model that meets quality & latency targets.
 */

import { getAvailableModels, findBestModel, type ModelCapability } from '../models/catalog.js';
import { decideModel, getSpendStats, type ModelDecision } from '../policy/engine.js';

export interface CostForecast {
  plan_id: string;
  estimated_tokens: number;
  task_class: string;
  candidates: {
    model: string;
    provider: string;
    estimated_cost: number;
    estimated_time_seconds: number;
  }[];
  recommended: ModelDecision;
}

/**
 * Estimate tokens from plan
 */
export function estimateTokens(plan: {
  steps: any[];
  files_changed?: number;
  total_lines_changed?: number;
}): number {
  const { steps, files_changed = 0, total_lines_changed = 0 } = plan;

  // Base tokens for plan structure
  let tokens = steps.length * 500; // ~500 tokens per step

  // Add tokens for file operations
  tokens += files_changed * 200; // ~200 tokens per file

  // Add tokens for code changes
  tokens += total_lines_changed * 10; // ~10 tokens per line

  // Add 20% buffer
  tokens = Math.ceil(tokens * 1.2);

  return tokens;
}

/**
 * Classify task based on plan
 */
export function classifyTask(plan: {
  steps: any[];
  goal?: string;
  files_changed?: number;
}): string {
  const { steps, goal = '', files_changed = 0 } = plan;

  // Check for high-risk indicators
  const highRiskKeywords = ['deploy', 'production', 'security', 'auth', 'payment', 'database migration'];
  if (highRiskKeywords.some(kw => goal.toLowerCase().includes(kw))) {
    return 'high-risk';
  }

  // Check for complex refactor
  if (files_changed > 20 || steps.length > 10) {
    return 'complex-refactor';
  }

  // Check for bulk operations
  const bulkKeywords = ['format', 'rename', 'update all', 'bulk'];
  if (bulkKeywords.some(kw => goal.toLowerCase().includes(kw))) {
    return 'bulk-edit';
  }

  // Check for formatting
  if (goal.toLowerCase().includes('format') || goal.toLowerCase().includes('lint')) {
    return 'format';
  }

  // Default to short-copy
  return 'short-copy';
}

/**
 * Estimate execution time for a model
 */
function estimateExecutionTime(tokens: number, model: ModelCapability): number {
  // Rough estimates based on speed tier
  const tokensPerSecond = {
    'very-fast': 100,
    'fast': 50,
    'medium': 25,
    'slow': 10,
  };

  const rate = tokensPerSecond[model.speed] || 25;
  return Math.ceil(tokens / rate);
}

/**
 * Forecast cost for a plan
 */
export async function forecastRunCost(params: {
  plan_id: string;
  plan: {
    steps: any[];
    goal?: string;
    files_changed?: number;
    total_lines_changed?: number;
  };
}): Promise<CostForecast> {
  const { plan_id, plan } = params;

  // Estimate tokens
  const estimated_tokens = estimateTokens(plan);

  // Classify task
  const task_class = classifyTask(plan);

  // Get available models
  const available_models = getAvailableModels();

  // Calculate cost for each candidate
  const candidates = available_models.map(model => ({
    model: model.name,
    provider: model.provider,
    estimated_cost: (estimated_tokens / 1000) * model.approx_cost_per_1k_tokens,
    estimated_time_seconds: estimateExecutionTime(estimated_tokens, model),
  }));

  // Get current spend
  const spendStats = getSpendStats();

  // Decide which model to use
  const recommended = decideModel({
    task_class,
    estimated_tokens,
    available_models,
    current_monthly_spend: spendStats.current_month,
  });

  return {
    plan_id,
    estimated_tokens,
    task_class,
    candidates,
    recommended,
  };
}

/**
 * Get cost summary for display
 */
export function formatCostForecast(forecast: CostForecast): string {
  const { estimated_tokens, task_class, recommended } = forecast;

  let summary = `📊 Cost Forecast\n\n`;
  summary += `Task Class: ${task_class}\n`;
  summary += `Estimated Tokens: ${estimated_tokens.toLocaleString()}\n\n`;
  
  summary += `✅ Recommended Model: ${recommended.model.name}\n`;
  summary += `   Provider: ${recommended.model.provider}\n`;
  summary += `   Estimated Cost: $${recommended.estimated_cost.toFixed(4)}\n`;
  summary += `   Reason: ${recommended.reason}\n`;

  if (recommended.requires_approval) {
    summary += `\n⚠️  APPROVAL REQUIRED\n`;
    summary += `   ${recommended.approval_reason}\n`;
  }

  // Show spend stats
  const spendStats = getSpendStats();
  summary += `\n💰 Monthly Budget\n`;
  summary += `   Spent: $${spendStats.current_month.toFixed(2)} / $${spendStats.total_budget.toFixed(2)}\n`;
  summary += `   Remaining: $${spendStats.remaining_budget.toFixed(2)}\n`;
  summary += `   Usage: ${spendStats.percentage_used.toFixed(1)}%\n`;

  return summary;
}

/**
 * Check if plan can proceed without approval
 */
export function canProceedWithoutApproval(forecast: CostForecast): boolean {
  return !forecast.recommended.requires_approval;
}

/**
 * Get approval prompt
 */
export function getApprovalPrompt(forecast: CostForecast): string {
  const { recommended } = forecast;
  
  let prompt = `🔔 Approval Required\n\n`;
  prompt += `Model: ${recommended.model.name} (${recommended.model.provider})\n`;
  prompt += `Estimated Cost: $${recommended.estimated_cost.toFixed(4)}\n`;
  prompt += `Reason: ${recommended.approval_reason}\n\n`;
  prompt += `Do you want to proceed? (yes/no)\n`;
  
  return prompt;
}

