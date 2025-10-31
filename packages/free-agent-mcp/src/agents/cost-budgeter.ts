/*
  cost-budgeter.ts – Cost + Latency Budgeter
  ------------------------------------------
  Keep per-task model + CPU budgets; route models dynamically.
  
  Strategy:
  - Track tokens/time per task
  - Route to cheapest model that meets quality requirements
  - Fall back to local model for refactors
  - Use API model for hard fixes
*/

export type Budget = {
  maxTokens: number;
  maxMs: number;
  maxCost?: number; // USD
};

export type ModelCapabilities = {
  name: string;
  provider: 'ollama' | 'openai' | 'anthropic';
  costPer1kInput: number; // USD
  costPer1kOutput: number; // USD
  avgLatencyMs: number;
  quality: 'basic' | 'standard' | 'premium' | 'expert';
  strengths: string[];
};

export type TaskProfile = {
  type: string;
  complexity: 'simple' | 'medium' | 'complex' | 'expert';
  requiresReasoning: boolean;
  requiresCreativity: boolean;
  requiresAccuracy: boolean;
};

export type ModelSelection = {
  model: ModelCapabilities;
  estimatedCost: number;
  estimatedLatency: number;
  reason: string;
};

/**
 * Model catalog with capabilities
 */
export const MODEL_CATALOG: ModelCapabilities[] = [
  // Ollama (FREE)
  {
    name: 'qwen2.5-coder:7b',
    provider: 'ollama',
    costPer1kInput: 0,
    costPer1kOutput: 0,
    avgLatencyMs: 2000,
    quality: 'standard',
    strengths: ['refactoring', 'formatting', 'simple-fixes'],
  },
  {
    name: 'deepseek-coder:33b',
    provider: 'ollama',
    costPer1kInput: 0,
    costPer1kOutput: 0,
    avgLatencyMs: 5000,
    quality: 'premium',
    strengths: ['complex-logic', 'algorithms', 'debugging'],
  },
  
  // OpenAI
  {
    name: 'gpt-4o-mini',
    provider: 'openai',
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
    avgLatencyMs: 1500,
    quality: 'standard',
    strengths: ['api-design', 'schemas', 'types'],
  },
  {
    name: 'gpt-4o',
    provider: 'openai',
    costPer1kInput: 0.0025,
    costPer1kOutput: 0.01,
    avgLatencyMs: 2500,
    quality: 'premium',
    strengths: ['complex-reasoning', 'architecture', 'security'],
  },
  
  // Anthropic
  {
    name: 'claude-3-5-sonnet',
    provider: 'anthropic',
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
    avgLatencyMs: 3000,
    quality: 'expert',
    strengths: ['long-refactors', 'code-review', 'documentation'],
  },
];

/**
 * Pick best model for task within budget
 */
export function pickModel(
  task: TaskProfile,
  budget: Budget
): ModelSelection {
  // Filter models that fit budget
  const affordable = MODEL_CATALOG.filter(m => {
    const estimatedCost = estimateCost(m, budget.maxTokens);
    return estimatedCost <= (budget.maxCost || Infinity) && m.avgLatencyMs <= budget.maxMs;
  });
  
  if (affordable.length === 0) {
    throw new Error('No models fit budget constraints');
  }
  
  // Score each model
  const scored = affordable.map(m => ({
    model: m,
    score: scoreModel(m, task),
  }));
  
  // Sort by score (descending)
  scored.sort((a, b) => b.score - a.score);
  
  const selected = scored[0].model;
  const estimatedCost = estimateCost(selected, budget.maxTokens);
  
  return {
    model: selected,
    estimatedCost,
    estimatedLatency: selected.avgLatencyMs,
    reason: explainSelection(selected, task),
  };
}

/**
 * Score model for task
 */
function scoreModel(model: ModelCapabilities, task: TaskProfile): number {
  let score = 0;
  
  // Quality match
  const qualityScore = {
    basic: 1,
    standard: 2,
    premium: 3,
    expert: 4,
  };
  
  const requiredQuality = {
    simple: 'basic',
    medium: 'standard',
    complex: 'premium',
    expert: 'expert',
  }[task.complexity];
  
  if (qualityScore[model.quality] >= qualityScore[requiredQuality as keyof typeof qualityScore]) {
    score += 10;
  }
  
  // Strength match
  const taskKeywords = [
    task.type,
    task.complexity,
    task.requiresReasoning ? 'reasoning' : '',
    task.requiresCreativity ? 'creativity' : '',
    task.requiresAccuracy ? 'accuracy' : '',
  ].filter(Boolean);
  
  for (const strength of model.strengths) {
    if (taskKeywords.some(kw => strength.includes(kw) || kw.includes(strength))) {
      score += 5;
    }
  }
  
  // Cost efficiency (prefer cheaper if quality is sufficient)
  if (model.costPer1kInput === 0) {
    score += 20; // Strongly prefer free models
  } else if (model.costPer1kInput < 0.001) {
    score += 10;
  } else if (model.costPer1kInput < 0.003) {
    score += 5;
  }
  
  return score;
}

/**
 * Estimate cost for model
 */
function estimateCost(model: ModelCapabilities, tokens: number): number {
  // Assume 50/50 input/output split
  const inputTokens = tokens * 0.5;
  const outputTokens = tokens * 0.5;
  
  return (
    (inputTokens / 1000) * model.costPer1kInput +
    (outputTokens / 1000) * model.costPer1kOutput
  );
}

/**
 * Explain why model was selected
 */
function explainSelection(model: ModelCapabilities, task: TaskProfile): string {
  if (model.provider === 'ollama') {
    return `Selected ${model.name} (FREE) - sufficient quality for ${task.complexity} ${task.type}`;
  }
  
  return `Selected ${model.name} - best match for ${task.complexity} ${task.type} (strengths: ${model.strengths.join(', ')})`;
}

/**
 * Create task profile from Design Card
 */
export function profileTask(taskType: string, description: string): TaskProfile {
  const lower = description.toLowerCase();
  
  // Detect complexity
  let complexity: TaskProfile['complexity'] = 'medium';
  if (/simple|basic|trivial|rename|format/i.test(lower)) {
    complexity = 'simple';
  } else if (/complex|advanced|algorithm|architecture/i.test(lower)) {
    complexity = 'complex';
  } else if (/expert|critical|security|performance/i.test(lower)) {
    complexity = 'expert';
  }
  
  // Detect requirements
  const requiresReasoning = /reason|logic|decide|analyze|evaluate/i.test(lower);
  const requiresCreativity = /design|create|generate|invent/i.test(lower);
  const requiresAccuracy = /critical|production|security|data|schema/i.test(lower);
  
  return {
    type: taskType,
    complexity,
    requiresReasoning,
    requiresCreativity,
    requiresAccuracy,
  };
}

/**
 * Track actual cost and latency
 */
export type TaskExecution = {
  taskId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  cost: number;
  success: boolean;
};

export class BudgetTracker {
  private executions: TaskExecution[] = [];
  private totalCost = 0;
  
  record(execution: TaskExecution) {
    this.executions.push(execution);
    this.totalCost += execution.cost;
  }
  
  getTotalCost(): number {
    return this.totalCost;
  }
  
  getAverageCost(taskType?: string): number {
    const filtered = taskType
      ? this.executions.filter(e => e.taskId.includes(taskType))
      : this.executions;
    
    if (filtered.length === 0) return 0;
    
    return filtered.reduce((sum, e) => sum + e.cost, 0) / filtered.length;
  }
  
  getSuccessRate(model?: string): number {
    const filtered = model
      ? this.executions.filter(e => e.model === model)
      : this.executions;
    
    if (filtered.length === 0) return 0;
    
    const successes = filtered.filter(e => e.success).length;
    return successes / filtered.length;
  }
  
  getStats(): {
    totalExecutions: number;
    totalCost: number;
    averageCost: number;
    successRate: number;
    byModel: Record<string, { count: number; cost: number; successRate: number }>;
  } {
    const byModel: Record<string, { count: number; cost: number; successRate: number }> = {};
    
    for (const exec of this.executions) {
      if (!byModel[exec.model]) {
        byModel[exec.model] = { count: 0, cost: 0, successRate: 0 };
      }
      
      byModel[exec.model].count++;
      byModel[exec.model].cost += exec.cost;
    }
    
    // Calculate success rates
    for (const model in byModel) {
      byModel[model].successRate = this.getSuccessRate(model);
    }
    
    return {
      totalExecutions: this.executions.length,
      totalCost: this.totalCost,
      averageCost: this.getAverageCost(),
      successRate: this.getSuccessRate(),
      byModel,
    };
  }
}

