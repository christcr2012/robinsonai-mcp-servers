/**
 * Unified Model Catalog
 *
 * Contains ALL models: FREE Ollama + PAID OpenAI + PAID Claude
 *
 * BOTH agents can use ANY model:
 * - free-agent-mcp: PREFERS FREE (Ollama) but CAN use PAID (OpenAI/Claude) if requested
 * - paid-agent-mcp: PREFERS PAID (OpenAI/Claude) but CAN use FREE (Ollama) if requested
 *
 * Smart model selection based on:
 * - preferFree: true/false (which models to prefer)
 * - preferredProvider: 'ollama'|'openai'|'claude'|'any' (specific provider)
 * - maxCost: budget limit
 * - taskComplexity: simple|medium|complex|expert
 * - minQuality: basic|standard|premium|best
 */

export interface ModelConfig {
  provider: 'ollama' | 'openai' | 'claude' | 'kimi' | 'voyage';
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
  // PAID KIMI/MOONSHOT MODELS (CHEAPEST!)
  // ========================================

  'kimi/moonshot-v1-8k': {
    provider: 'kimi',
    model: 'moonshot-v1-8k',
    costPerInputToken: 0.0000002,   // $0.20 per 1M tokens
    costPerOutputToken: 0.000002,   // $2.00 per 1M tokens
    quality: 'standard',
    maxTokens: 8192,
    contextWindow: 8192,
    description: 'Kimi 8K - Cheapest paid option, great for code generation',
  },

  'kimi/moonshot-v1-32k': {
    provider: 'kimi',
    model: 'moonshot-v1-32k',
    costPerInputToken: 0.0000002,   // $0.20 per 1M tokens (same as 8k)
    costPerOutputToken: 0.000002,   // $2.00 per 1M tokens (same as 8k)
    quality: 'premium',
    maxTokens: 32768,
    contextWindow: 32768,
    description: 'Kimi 32K - Cheapest paid option with longer context',
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

  // ========================================
  // PAID CLAUDE MODELS (Anthropic) - Full Lineup
  // ========================================

  // Claude 4.5 Series (Latest - 2025)
  'claude/claude-haiku-4.5': {
    provider: 'claude',
    model: 'claude-haiku-4.5',
    costPerInputToken: 0.001,    // $1.00 per 1M tokens
    costPerOutputToken: 0.005,   // $5.00 per 1M tokens
    quality: 'premium',
    maxTokens: 8192,
    contextWindow: 200000,
    description: 'Latest Haiku 4.5 - fastest, most cost-efficient Claude model',
  },

  'claude/claude-sonnet-4.5': {
    provider: 'claude',
    model: 'claude-sonnet-4.5',
    costPerInputToken: 0.003,    // $3.00 per 1M tokens
    costPerOutputToken: 0.015,   // $15.00 per 1M tokens
    quality: 'best',
    maxTokens: 8192,
    contextWindow: 200000,
    description: 'Latest Sonnet 4.5 - best model for agents, coding, and computer use',
  },

  // Claude 4.x Series
  'claude/claude-opus-4.1': {
    provider: 'claude',
    model: 'claude-opus-4.1',
    costPerInputToken: 0.015,    // $15.00 per 1M tokens
    costPerOutputToken: 0.075,   // $75.00 per 1M tokens
    quality: 'best',
    maxTokens: 8192,
    contextWindow: 200000,
    description: 'Opus 4.1 - most powerful Claude model with improved reliability',
  },

  'claude/claude-sonnet-4': {
    provider: 'claude',
    model: 'claude-sonnet-4',
    costPerInputToken: 0.003,    // $3.00 per 1M tokens
    costPerOutputToken: 0.015,   // $15.00 per 1M tokens
    quality: 'best',
    maxTokens: 8192,
    contextWindow: 200000,
    description: 'Sonnet 4 - balanced model offering strong capability at moderate cost',
  },

  'claude/claude-opus-4': {
    provider: 'claude',
    model: 'claude-opus-4',
    costPerInputToken: 0.015,    // $15.00 per 1M tokens
    costPerOutputToken: 0.075,   // $75.00 per 1M tokens
    quality: 'best',
    maxTokens: 8192,
    contextWindow: 200000,
    description: 'Opus 4 - premium model for the most complex, high-quality tasks',
  },

  // Claude 3.x Series (Still available)
  'claude/claude-sonnet-3.7': {
    provider: 'claude',
    model: 'claude-sonnet-3.7',
    costPerInputToken: 0.003,    // $3.00 per 1M tokens
    costPerOutputToken: 0.015,   // $15.00 per 1M tokens
    quality: 'premium',
    maxTokens: 8192,
    contextWindow: 200000,
    description: 'Sonnet 3.7 - cost-effective for high-volume workloads',
  },

  'claude/claude-3-5-sonnet-20241022': {
    provider: 'claude',
    model: 'claude-3-5-sonnet-20241022',
    costPerInputToken: 0.003,    // $3.00 per 1M tokens
    costPerOutputToken: 0.015,   // $15.00 per 1M tokens
    quality: 'best',
    maxTokens: 8192,
    contextWindow: 200000,
    description: 'Claude 3.5 Sonnet - excellent for complex reasoning',
  },

  'claude/claude-3-5-haiku-20241022': {
    provider: 'claude',
    model: 'claude-3-5-haiku-20241022',
    costPerInputToken: 0.0008,   // $0.80 per 1M tokens
    costPerOutputToken: 0.004,   // $4.00 per 1M tokens
    quality: 'premium',
    maxTokens: 8192,
    contextWindow: 200000,
    description: 'Claude 3.5 Haiku - fast and affordable',
  },

  'claude/claude-3-opus-20240229': {
    provider: 'claude',
    model: 'claude-3-opus-20240229',
    costPerInputToken: 0.015,    // $15.00 per 1M tokens
    costPerOutputToken: 0.075,   // $75.00 per 1M tokens
    quality: 'best',
    maxTokens: 4096,
    contextWindow: 200000,
    description: 'Claude 3 Opus - powerful legacy model',
  },

  'claude/claude-3-haiku-20240307': {
    provider: 'claude',
    model: 'claude-3-haiku-20240307',
    costPerInputToken: 0.00025,  // $0.25 per 1M tokens
    costPerOutputToken: 0.00125, // $1.25 per 1M tokens
    quality: 'standard',
    maxTokens: 4096,
    contextWindow: 200000,
    description: 'Claude 3 Haiku - cheapest Claude option for simple tasks',
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
 * 1. If preferFree=true: Try FREE Ollama first, escalate to PAID only if needed
 * 2. If preferFree=false: Use PAID models (OpenAI/Claude) based on budget and complexity
 * 3. Both agents can use ANY model - the preference just changes the default selection
 *
 * This allows:
 * - free-agent-mcp: Defaults to FREE, but can use PAID if requested
 * - paid-agent-mcp: Defaults to PAID, but can use FREE if requested
 *
 * WHEN CLAUDE IS SELECTED:
 * - Expert tasks with high budget (maxCost >= $10) → Claude Sonnet
 * - Complex tasks with high budget (maxCost >= $2) → Claude Sonnet
 * - Simple tasks with low budget (maxCost >= $0.25) → Claude Haiku
 * - Explicit request (preferredProvider: 'claude') → Claude Sonnet
 */
export function selectBestModel(params: {
  minQuality?: 'basic' | 'standard' | 'premium' | 'best';
  maxCost?: number;
  taskComplexity?: 'simple' | 'medium' | 'complex' | 'expert';
  preferFree?: boolean;
  preferredProvider?: 'ollama' | 'openai' | 'claude' | 'kimi' | 'voyage' | 'any';
}): string {
  const {
    minQuality = 'standard',
    maxCost = COST_POLICY.DEFAULT_MAX_COST,
    taskComplexity = 'medium',
    preferFree = true,
    preferredProvider = 'any',
  } = params;

  // If maxCost is 0, MUST use FREE Ollama
  if (maxCost === 0) {
    console.error('[ModelCatalog] maxCost=0 → Using FREE Ollama');
    return selectFreeModel(minQuality);
  }

  // If preferFree is true, try FREE first
  if (preferFree) {
    console.error('[ModelCatalog] preferFree=true → Using FREE Ollama');
    return selectFreeModel(minQuality);
  }

  // If specific provider requested, use it
  if (preferredProvider === 'ollama') {
    console.error('[ModelCatalog] preferredProvider=ollama → Using FREE Ollama');
    return selectFreeModel(minQuality);
  }
  if (preferredProvider === 'claude') {
    console.error('[ModelCatalog] preferredProvider=claude → Using PAID Claude');
    return selectClaudeModel(taskComplexity, maxCost);
  }
  if (preferredProvider === 'openai') {
    console.error('[ModelCatalog] preferredProvider=openai → Using PAID OpenAI');
    return selectOpenAIModel(taskComplexity, maxCost);
  }
  if (preferredProvider === 'kimi') {
    console.error('[ModelCatalog] preferredProvider=kimi → Using PAID Kimi');
    return selectKimiModel(taskComplexity, maxCost);
  }

  // Otherwise, select best PAID model based on budget and complexity
  console.error(`[ModelCatalog] Selecting PAID model: complexity=${taskComplexity}, maxCost=$${maxCost}`);
  return selectPaidModel(taskComplexity, maxCost, minQuality);
}

/**
 * Select best FREE Ollama model
 */
function selectFreeModel(minQuality: 'basic' | 'standard' | 'premium' | 'best'): string {
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

/**
 * Select best PAID model (Kimi, OpenAI, or Claude)
 *
 * STRATEGY: Prefer Kimi for cheap tasks (best bang for buck!)
 */
function selectPaidModel(
  taskComplexity: 'simple' | 'medium' | 'complex' | 'expert',
  maxCost: number,
  minQuality: 'basic' | 'standard' | 'premium' | 'best'
): string {
  // For expert-level tasks with high budget, use best models
  if (taskComplexity === 'expert' && maxCost >= 10.0) {
    return 'claude/claude-opus-4.1';  // Most powerful - Opus 4.1
  }
  if (taskComplexity === 'expert' && maxCost >= 5.0) {
    return 'openai/o1-mini';  // Good reasoning, cheaper
  }

  // For complex tasks, use premium models
  if (taskComplexity === 'complex' && maxCost >= 2.0) {
    return 'claude/claude-sonnet-4.5';  // Latest Sonnet 4.5 - excellent for complex tasks
  }
  if (taskComplexity === 'complex' && maxCost >= 1.0) {
    return 'openai/gpt-4o';  // Good for complex tasks
  }

  // For medium tasks, prefer Kimi (cheapest!) or OpenAI
  if (taskComplexity === 'medium' && maxCost >= 0.5) {
    // Kimi is MUCH cheaper - use it if available
    if (process.env.KIMI_API_KEY) {
      return 'kimi/moonshot-v1-32k';  // Cheapest with longer context
    }
    return 'openai/gpt-4o-mini';  // Fallback to OpenAI
  }

  // For simple tasks, use CHEAPEST paid model (Kimi!)
  if (maxCost >= 0.01) {  // Kimi is SO cheap, even $0.01 budget works
    if (process.env.KIMI_API_KEY) {
      return 'kimi/moonshot-v1-8k';  // Cheapest option
    }
    return 'claude/claude-3-haiku-20240307';  // Fallback to Claude Haiku
  }

  // If budget too low for paid, fallback to FREE
  return selectFreeModel(minQuality);
}

/**
 * Select best Claude model
 */
function selectClaudeModel(
  taskComplexity: 'simple' | 'medium' | 'complex' | 'expert',
  maxCost: number
): string {
  if (taskComplexity === 'expert' && maxCost >= 10.0) {
    return 'claude/claude-3-opus-20240229';  // Most powerful
  }
  if ((taskComplexity === 'complex' || taskComplexity === 'expert') && maxCost >= 2.0) {
    return 'claude/claude-3-5-sonnet-20241022';  // Best balance
  }
  return 'claude/claude-3-haiku-20240307';  // Fast and affordable
}

/**
 * Select best OpenAI model
 */
function selectOpenAIModel(
  taskComplexity: 'simple' | 'medium' | 'complex' | 'expert',
  maxCost: number
): string {
  if (taskComplexity === 'expert' && maxCost >= 10.0) {
    return 'openai/o1';  // Most powerful reasoning
  }
  if (taskComplexity === 'expert' && maxCost >= 5.0) {
    return 'openai/o1-mini';  // Good reasoning
  }
  if (taskComplexity === 'complex' && maxCost >= 1.0) {
    return 'openai/gpt-4o';  // High intelligence
  }
  return 'openai/gpt-4o-mini';  // Affordable and capable
}

/**
 * Select best Kimi model
 *
 * Kimi is EXTREMELY cheap ($0.20/$2.00 per 1M tokens)
 * Best bang for buck for code generation and analysis
 */
function selectKimiModel(
  taskComplexity: 'simple' | 'medium' | 'complex' | 'expert',
  maxCost: number
): string {
  // For any task, prefer 32K context (same price as 8K)
  if (maxCost >= 0.01) {
    return 'kimi/moonshot-v1-32k';  // 32K context, same price as 8K
  }

  // Fallback to 8K if budget is extremely tight
  return 'kimi/moonshot-v1-8k';
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

