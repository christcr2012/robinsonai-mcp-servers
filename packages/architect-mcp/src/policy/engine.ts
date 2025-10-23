/**
 * Policy Engine - Cost Control Rules
 * 
 * Simple JSON/YAML-based rules that Architect/Optimizer follow automatically:
 * - Default: use Ollama (free)
 * - Escalate to cheap OpenAI if: bulk task + 2x faster + cost ≤ cap
 * - Escalate to premium only if: high-risk + cost ≤ cap OR user approves
 */

import { ModelCapability } from '../models/catalog.js';

export interface PolicyConfig {
  // Budget caps
  HUMAN_APPROVAL_REQUIRED_OVER: number; // USD
  MONTHLY_BUDGET: number; // USD
  MAX_OPENAI_CONCURRENCY: number;

  // Default models
  DEFAULT_OLLAMA_MODEL: string;
  CHEAP_OPENAI_AGENT: string;
  PREMIUM_OPENAI_AGENT: string;

  // Escalation rules
  escalation_rules: EscalationRule[];
}

export interface EscalationRule {
  name: string;
  task_classes: string[];
  conditions: {
    min_eta_improvement?: number; // e.g., 2 = 2x faster
    max_cost?: number; // USD
    min_quality?: 'basic' | 'good' | 'excellent' | 'premium';
  };
  target_provider: 'ollama' | 'openai' | 'augment';
  target_model?: string;
  require_approval: boolean;
}

/**
 * Default policy configuration
 */
const DEFAULT_POLICY: PolicyConfig = {
  HUMAN_APPROVAL_REQUIRED_OVER: parseFloat(process.env.HUMAN_APPROVAL_REQUIRED_OVER || '10'),
  MONTHLY_BUDGET: parseFloat(process.env.MONTHLY_BUDGET || '25'),
  MAX_OPENAI_CONCURRENCY: parseInt(process.env.MAX_OPENAI_CONCURRENCY || '2', 10),
  
  DEFAULT_OLLAMA_MODEL: process.env.DEFAULT_OLLAMA_MODEL || 'qwen2.5:7b',
  CHEAP_OPENAI_AGENT: process.env.CHEAP_OPENAI_AGENT || 'gpt-4o-mini',
  PREMIUM_OPENAI_AGENT: process.env.PREMIUM_OPENAI_AGENT || 'gpt-4o',

  escalation_rules: [
    {
      name: 'Bulk tasks to cheap OpenAI',
      task_classes: ['bulk-edit', 'format', 'short-copy'],
      conditions: {
        min_eta_improvement: 2,
        max_cost: 1.0,
      },
      target_provider: 'openai',
      target_model: 'gpt-4o-mini',
      require_approval: false,
    },
    {
      name: 'High-risk to premium with approval',
      task_classes: ['high-risk', 'prod-deploy', 'security', 'complex-refactor'],
      conditions: {
        min_quality: 'premium',
      },
      target_provider: 'openai',
      target_model: 'gpt-4o',
      require_approval: true,
    },
  ],
};

let currentPolicy: PolicyConfig = { ...DEFAULT_POLICY };

/**
 * Load policy from environment or config file
 */
export function loadPolicy(): PolicyConfig {
  // TODO: Load from JSON/YAML file if exists
  // For now, use environment variables
  currentPolicy = { ...DEFAULT_POLICY };
  return currentPolicy;
}

/**
 * Get current policy
 */
export function getPolicy(): PolicyConfig {
  return currentPolicy;
}

/**
 * Update policy
 */
export function updatePolicy(updates: Partial<PolicyConfig>): void {
  currentPolicy = { ...currentPolicy, ...updates };
}

/**
 * Decision result
 */
export interface ModelDecision {
  model: ModelCapability;
  reason: string;
  estimated_cost: number;
  requires_approval: boolean;
  approval_reason?: string;
}

/**
 * Decide which model to use for a task
 */
export function decideModel(params: {
  task_class: string;
  estimated_tokens: number;
  available_models: ModelCapability[];
  current_monthly_spend: number;
}): ModelDecision {
  const policy = getPolicy();
  const { task_class, estimated_tokens, available_models, current_monthly_spend } = params;

  // Check if we're over monthly budget
  if (current_monthly_spend >= policy.MONTHLY_BUDGET) {
    const ollamaModel = available_models.find(m => m.provider === 'ollama' && m.name === policy.DEFAULT_OLLAMA_MODEL);
    if (!ollamaModel) {
      throw new Error('Monthly budget exceeded and no Ollama model available');
    }
    return {
      model: ollamaModel,
      reason: 'Monthly budget exceeded, using free Ollama model',
      estimated_cost: 0,
      requires_approval: false,
    };
  }

  // Find matching escalation rule
  const matchingRule = policy.escalation_rules.find(rule =>
    rule.task_classes.includes(task_class)
  );

  if (!matchingRule) {
    // No rule matches, use default Ollama
    const ollamaModel = available_models.find(m => m.provider === 'ollama' && m.name === policy.DEFAULT_OLLAMA_MODEL);
    if (!ollamaModel) {
      throw new Error('No Ollama model available');
    }
    return {
      model: ollamaModel,
      reason: 'No escalation rule matched, using default Ollama model',
      estimated_cost: 0,
      requires_approval: false,
    };
  }

  // Find target model
  let targetModel: ModelCapability | undefined;
  
  if (matchingRule.target_model) {
    targetModel = available_models.find(m => m.name === matchingRule.target_model);
  } else {
    targetModel = available_models.find(m => m.provider === matchingRule.target_provider);
  }

  if (!targetModel) {
    // Fallback to Ollama
    const ollamaModel = available_models.find(m => m.provider === 'ollama' && m.name === policy.DEFAULT_OLLAMA_MODEL);
    if (!ollamaModel) {
      throw new Error('Target model not available and no Ollama fallback');
    }
    return {
      model: ollamaModel,
      reason: `Target model ${matchingRule.target_model} not available, using Ollama`,
      estimated_cost: 0,
      requires_approval: false,
    };
  }

  // Calculate estimated cost
  const estimated_cost = (estimated_tokens / 1000) * targetModel.approx_cost_per_1k_tokens;

  // Check if approval required
  let requires_approval = matchingRule.require_approval;
  let approval_reason: string | undefined;

  if (estimated_cost > policy.HUMAN_APPROVAL_REQUIRED_OVER) {
    requires_approval = true;
    approval_reason = `Estimated cost $${estimated_cost.toFixed(2)} exceeds approval threshold $${policy.HUMAN_APPROVAL_REQUIRED_OVER}`;
  }

  if (current_monthly_spend + estimated_cost > policy.MONTHLY_BUDGET) {
    requires_approval = true;
    approval_reason = `Would exceed monthly budget: $${(current_monthly_spend + estimated_cost).toFixed(2)} > $${policy.MONTHLY_BUDGET}`;
  }

  // Check conditions
  if (matchingRule.conditions.max_cost && estimated_cost > matchingRule.conditions.max_cost) {
    // Cost too high, fallback to Ollama
    const ollamaModel = available_models.find(m => m.provider === 'ollama' && m.name === policy.DEFAULT_OLLAMA_MODEL);
    if (!ollamaModel) {
      throw new Error('Cost exceeds rule limit and no Ollama fallback');
    }
    return {
      model: ollamaModel,
      reason: `Estimated cost $${estimated_cost.toFixed(2)} exceeds rule limit $${matchingRule.conditions.max_cost}, using Ollama`,
      estimated_cost: 0,
      requires_approval: false,
    };
  }

  return {
    model: targetModel,
    reason: `Matched rule: ${matchingRule.name}`,
    estimated_cost,
    requires_approval,
    approval_reason,
  };
}

/**
 * Get monthly spend stats
 */
export interface SpendStats {
  current_month: number; // USD
  remaining_budget: number; // USD
  total_budget: number; // USD
  percentage_used: number;
}

let monthlySpend = 0;
let lastResetMonth = new Date().getMonth();

/**
 * Record spend
 */
export function recordSpend(amount: number): void {
  const currentMonth = new Date().getMonth();
  
  // Reset if new month
  if (currentMonth !== lastResetMonth) {
    monthlySpend = 0;
    lastResetMonth = currentMonth;
  }
  
  monthlySpend += amount;
}

/**
 * Get spend stats
 */
export function getSpendStats(): SpendStats {
  const policy = getPolicy();
  const currentMonth = new Date().getMonth();
  
  // Reset if new month
  if (currentMonth !== lastResetMonth) {
    monthlySpend = 0;
    lastResetMonth = currentMonth;
  }
  
  return {
    current_month: monthlySpend,
    remaining_budget: Math.max(0, policy.MONTHLY_BUDGET - monthlySpend),
    total_budget: policy.MONTHLY_BUDGET,
    percentage_used: (monthlySpend / policy.MONTHLY_BUDGET) * 100,
  };
}

// Load policy on startup
loadPolicy();

