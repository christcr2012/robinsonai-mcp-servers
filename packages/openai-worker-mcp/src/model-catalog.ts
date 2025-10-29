/**
 * Unified Model Catalog
 * 
 * Contains both FREE Ollama models and PAID OpenAI models.
 * Smart model selection prioritizes FREE Ollama, escalates to PAID OpenAI only when needed.
 */

export interface ModelConfig {
  provider: 'ollama' | 'openai';
  model: string;
  baseURL?: string;
  costPerInputToken: number;
  costPerOutputToken: number;
  quality: 'basic' | 'standard' | 'premium' | 'best';
  maxTokens?: number;
  contextWindow?: number;
  description?: string;
}

/**
 * Unified model catalog with FREE Ollama + PAID OpenAI models
 */
export const MODEL_CATALOG: Record<string, ModelConfig> = {
  // ========================================
  // FREE OLLAMA MODELS (0 cost!)
  // ========================================
  
  'ollama/qwen2.5:3b': {
    provider: 'ollama',
    model: 'qwen2.5:3b',
    baseURL: 'http://localhost:11434/v1',
    costPerInputToken: 0,
    costPerOutputToken: 0,
    quality: 'basic',
    maxTokens: 4096,
    contextWindow: 32768,
    description: 'Fast, lightweight model for simple tasks',
  },
  
  'ollama/qwen2.5-coder:7b': {
    provider: 'ollama',
    model: 'qwen2.5-coder:7b',
    baseURL: 'http://localhost:11434/v1',
    costPerInputToken: 0,
    costPerOutputToken: 0,
    quality: 'standard',
    maxTokens: 8192,
    contextWindow: 32768,
    description: 'Good balance of speed and quality for coding tasks',
  },
  
  'ollama/qwen2.5-coder:32b': {
    provider: 'ollama',
    model: 'qwen2.5-coder:32b',
    baseURL: 'http://localhost:11434/v1',
    costPerInputToken: 0,
    costPerOutputToken: 0,
    quality: 'premium',
    maxTokens: 8192,
    contextWindow: 32768,
    description: 'High-quality coding model, slower but excellent results',
  },
  
  'ollama/deepseek-coder:33b': {
    provider: 'ollama',
    model: 'deepseek-coder:33b',
    baseURL: 'http://localhost:11434/v1',
    costPerInputToken: 0,
    costPerOutputToken: 0,
    quality: 'best',
    maxTokens: 8192,
    contextWindow: 16384,
    description: 'Best FREE model for complex coding tasks',
  },
  
  'ollama/codellama:34b': {
    provider: 'ollama',
    model: 'codellama:34b',
    baseURL: 'http://localhost:11434/v1',
    costPerInputToken: 0,
    costPerOutputToken: 0,
    quality: 'premium',
    maxTokens: 8192,
    contextWindow: 16384,
    description: 'Meta\'s CodeLlama, excellent for code generation',
  },
  
  // ========================================
  // PAID OPENAI MODELS
  // ========================================
  
  'openai/gpt-4o-mini': {
    provider: 'openai',
    model: 'gpt-4o-mini',
    costPerInputToken: 0.00015,  // $0.15 per 1M tokens
    costPerOutputToken: 0.0006,  // $0.60 per 1M tokens
    quality: 'premium',
    maxTokens: 16384,
    contextWindow: 128000,
    description: 'Affordable, intelligent small model for fast tasks',
  },
  
  'openai/gpt-4o': {
    provider: 'openai',
    model: 'gpt-4o',
    costPerInputToken: 0.0025,   // $2.50 per 1M tokens
    costPerOutputToken: 0.01,    // $10.00 per 1M tokens
    quality: 'best',
    maxTokens: 16384,
    contextWindow: 128000,
    description: 'High-intelligence flagship model for complex tasks',
  },
  
  'openai/o1-mini': {
    provider: 'openai',
    model: 'o1-mini',
    costPerInputToken: 0.003,    // $3.00 per 1M tokens
    costPerOutputToken: 0.012,   // $12.00 per 1M tokens
    quality: 'best',
    maxTokens: 65536,
    contextWindow: 128000,
    description: 'Reasoning model for complex problem-solving',
  },
  
  'openai/o1': {
    provider: 'openai',
    model: 'o1',
    costPerInputToken: 0.015,    // $15.00 per 1M tokens
    costPerOutputToken: 0.06,    // $60.00 per 1M tokens
    quality: 'best',
    maxTokens: 100000,
    contextWindow: 200000,
    description: 'Most capable reasoning model for hardest problems',
  },
};

/**
 * Cost policy configuration
 */
export const COST_POLICY = {
  HUMAN_APPROVAL_REQUIRED_OVER: 10.00,  // $10 per task
  MONTHLY_BUDGET: 25.00,                 // $25 per month
  DEFAULT_MAX_COST: 1.00,                // $1 per task default
  WARNING_THRESHOLD: 5.00,               // Warn at $5
};

/**
 * Select best model based on requirements
 * 
 * Strategy:
 * 1. Always try FREE Ollama first
 * 2. Escalate to PAID OpenAI only when:
 *    - Quality requirement exceeds Ollama capabilities
 *    - Budget allows for paid model
 *    - Task complexity justifies cost
 */
export function selectBestModel(params: {
  minQuality?: 'basic' | 'standard' | 'premium' | 'best';
  maxCost?: number;
  taskComplexity?: 'simple' | 'medium' | 'complex' | 'expert';
  preferFree?: boolean;
}): string {
  const {
    minQuality = 'standard',
    maxCost = COST_POLICY.DEFAULT_MAX_COST,
    taskComplexity = 'medium',
    preferFree = true,
  } = params;

  // ALWAYS prefer FREE Ollama when possible
  if (preferFree || maxCost === 0) {
    // Map quality to Ollama models
    switch (minQuality) {
      case 'basic':
        return 'ollama/qwen2.5:3b';
      case 'standard':
        return 'ollama/qwen2.5-coder:7b';
      case 'premium':
        return 'ollama/qwen2.5-coder:32b';
      case 'best':
        return 'ollama/deepseek-coder:33b';
    }
  }

  // If budget allows and quality demands it, use OpenAI
  if (maxCost > 0) {
    // For expert-level tasks, consider o1 models
    if (taskComplexity === 'expert' && maxCost >= 5.0) {
      return 'openai/o1-mini';
    }

    // For complex tasks, use gpt-4o
    if (taskComplexity === 'complex' && maxCost >= 1.0) {
      return 'openai/gpt-4o';
    }

    // For medium tasks, use gpt-4o-mini
    if (taskComplexity === 'medium' && maxCost >= 0.5) {
      return 'openai/gpt-4o-mini';
    }
  }

  // Fallback: Use best FREE Ollama model
  return 'ollama/deepseek-coder:33b';
}

/**
 * Estimate cost for a task
 */
export function estimateTaskCost(params: {
  modelId: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
}): number {
  const { modelId, estimatedInputTokens, estimatedOutputTokens } = params;

  const model = MODEL_CATALOG[modelId];
  if (!model) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  const inputCost = estimatedInputTokens * model.costPerInputToken;
  const outputCost = estimatedOutputTokens * model.costPerOutputToken;

  return inputCost + outputCost;
}

/**
 * Get model configuration
 */
export function getModelConfig(modelId: string): ModelConfig {
  const model = MODEL_CATALOG[modelId];
  if (!model) {
    throw new Error(`Unknown model: ${modelId}`);
  }
  return model;
}

/**
 * List all available models
 */
export function listModels(filter?: {
  provider?: 'ollama' | 'openai';
  quality?: 'basic' | 'standard' | 'premium' | 'best';
  maxCost?: number;
}): Array<{ id: string; config: ModelConfig }> {
  const models = Object.entries(MODEL_CATALOG);

  if (!filter) {
    return models.map(([id, config]) => ({ id, config }));
  }

  return models
    .filter(([id, config]) => {
      if (filter.provider && config.provider !== filter.provider) {
        return false;
      }
      if (filter.quality && config.quality !== filter.quality) {
        return false;
      }
      if (filter.maxCost !== undefined) {
        // Estimate cost for 1000 input + 1000 output tokens
        const cost = estimateTaskCost({
          modelId: id,
          estimatedInputTokens: 1000,
          estimatedOutputTokens: 1000,
        });
        if (cost > filter.maxCost) {
          return false;
        }
      }
      return true;
    })
    .map(([id, config]) => ({ id, config }));
}

/**
 * Check if cost requires human approval
 */
export function requiresApproval(estimatedCost: number): boolean {
  return estimatedCost > COST_POLICY.HUMAN_APPROVAL_REQUIRED_OVER;
}

/**
 * Check if within monthly budget
 */
export function withinBudget(currentMonthlySpend: number, estimatedCost: number): boolean {
  return (currentMonthlySpend + estimatedCost) <= COST_POLICY.MONTHLY_BUDGET;
}

