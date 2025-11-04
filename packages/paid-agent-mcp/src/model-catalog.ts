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
 * - preferredProvider: 'ollama'|'openai'|'claude'|'voyage'|'any' (specific provider)
 * - maxCost: budget limit
 * - taskComplexity: simple|medium|complex|expert
 * - minQuality: basic|standard|premium|best
 *
 * NEW: Intelligent task-based selection (v0.3.0+)
 * - Dynamically switches between OpenAI and Claude based on task
 * - Task-aware: code generation, analysis, refactoring, testing, etc.
 * - Language-aware: TypeScript, Python, Go, etc.
 * - Quality-first with cost optimization
 */

import { selectLLMForTask, type LLMTaskContext, type LLMRecommendation } from './llm-selector.js';

export interface ModelConfig {
  provider: 'ollama' | 'openai' | 'claude' | 'voyage';
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

  // ========================================
  // PAID VOYAGE AI MODELS
  // ========================================

  'voyage/voyage-code-2': {
    provider: 'voyage',
    model: 'voyage-code-2',
    costPerInputToken: 0.00012,  // $0.12 per 1K tokens
    costPerOutputToken: 0.00012, // $0.12 per 1K tokens
    quality: 'premium',
    maxTokens: 16000,
    contextWindow: 120000,
    description: 'Voyage Code 2 - optimized for software engineering tasks',
  },

  'voyage/voyage-3': {
    provider: 'voyage',
    model: 'voyage-3',
    costPerInputToken: 0.00014,  // $0.14 per 1K tokens
    costPerOutputToken: 0.00014, // $0.14 per 1K tokens
    quality: 'best',
    maxTokens: 20000,
    contextWindow: 200000,
    description: 'Voyage 3 - balanced premium model with long-context reasoning',
  },
};

function isProviderAvailable(provider: ModelConfig['provider']): boolean {
  switch (provider) {
    case 'ollama':
      return true;
    case 'openai':
      return Boolean(process.env.OPENAI_API_KEY);
    case 'claude':
      return Boolean(process.env.ANTHROPIC_API_KEY);
    case 'voyage':
      return Boolean(process.env.VOYAGE_API_KEY || process.env.ANTHROPIC_API_KEY);
    default:
      return false;
  }
}

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
  preferredProvider?: 'ollama' | 'openai' | 'claude' | 'voyage' | 'any';
  taskType?: 'code_generation' | 'code_analysis' | 'refactoring' | 'test_generation' | 'documentation' | 'debugging';
  language?: string;
  framework?: string;
  useIntelligentSelection?: boolean;
}): string {
  const {
    minQuality = 'standard',
    maxCost = COST_POLICY.DEFAULT_MAX_COST,
    taskComplexity = 'medium',
    preferFree = false,  // PAID agent defaults to PAID models (not FREE Ollama)
    preferredProvider = 'any',
    taskType = 'code_generation',
    language,
    framework,
    useIntelligentSelection = true,  // NEW: Enable intelligent selection by default
  } = params;

  // If maxCost is 0, MUST use FREE Ollama
  if (maxCost === 0) {
    console.error('[ModelCatalog] maxCost=0 → Using FREE Ollama');
    return resolveAvailableModel(selectFreeModel(minQuality), {
      minQuality,
      taskComplexity,
      maxCost,
      preferFree: true,
    });
  }

  // If preferFree is true, try FREE first
  if (preferFree) {
    console.error('[ModelCatalog] preferFree=true → Using FREE Ollama');
    return resolveAvailableModel(selectFreeModel(minQuality), {
      minQuality,
      taskComplexity,
      maxCost,
      preferFree: true,
    });
  }

  // If specific provider requested, use it
  if (preferredProvider === 'ollama') {
    console.error('[ModelCatalog] preferredProvider=ollama → Using FREE Ollama');
    return resolveAvailableModel(selectFreeModel(minQuality), {
      minQuality,
      taskComplexity,
      maxCost,
      preferFree: true,
    });
  }
  if (preferredProvider === 'claude') {
    console.error('[ModelCatalog] preferredProvider=claude → Using PAID Claude');
    return resolveAvailableModel(selectClaudeModel(taskComplexity, maxCost), {
      minQuality,
      taskComplexity,
      maxCost,
      preferFree,
    });
  }
  if (preferredProvider === 'openai') {
    console.error('[ModelCatalog] preferredProvider=openai → Using PAID OpenAI');
    return resolveAvailableModel(selectOpenAIModel(taskComplexity, maxCost), {
      minQuality,
      taskComplexity,
      maxCost,
      preferFree,
    });
  }
  if (preferredProvider === 'voyage') {
    console.error('[ModelCatalog] preferredProvider=voyage → Using Voyage AI');
    return resolveAvailableModel(selectVoyageModel(taskComplexity, maxCost, minQuality), {
      minQuality,
      taskComplexity,
      maxCost,
      preferFree,
    });
  }

  // NEW: Use intelligent task-based selection
  if (useIntelligentSelection && (preferredProvider === 'any')) {
    const taskContext: LLMTaskContext = {
      type: taskType,
      complexity: taskComplexity,
      language,
      framework,
      preferQuality: minQuality === 'best' || minQuality === 'premium',
      maxCostPer1M: maxCost,
      requiresReasoning: taskType === 'debugging' || taskComplexity === 'expert'
    };

    const recommendation = selectLLMForTask(taskContext);

    if (recommendation) {
      const modelId = `${recommendation.provider}/${recommendation.model}`;
      console.error(`[ModelCatalog] 🎯 Intelligent Selection: ${modelId}`);
      console.error(`[ModelCatalog] Reasoning: ${recommendation.reasoning}`);
      return resolveAvailableModel(modelId, {
        minQuality,
        taskComplexity,
        maxCost,
        preferFree,
      });
    }
  }

  // Fallback: select best PAID model based on budget and complexity
  console.error(`[ModelCatalog] Selecting PAID model: complexity=${taskComplexity}, maxCost=$${maxCost}`);
  const fallbackId = selectPaidModel(taskComplexity, maxCost, minQuality);
  return resolveAvailableModel(fallbackId, {
    minQuality,
    taskComplexity,
    maxCost,
    preferFree,
  });
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
 * Select best PAID model (OpenAI or Claude)
 */
function selectPaidModel(
  taskComplexity: 'simple' | 'medium' | 'complex' | 'expert',
  maxCost: number,
  minQuality: 'basic' | 'standard' | 'premium' | 'best'
): string {
  // For expert-level tasks with high budget, use best models
  if (taskComplexity === 'expert' && maxCost >= 10.0) {
    return 'claude/claude-3-5-sonnet-20241022';  // Best reasoning
  }
  if (taskComplexity === 'expert' && maxCost >= 5.0) {
    return 'openai/o1-mini';  // Good reasoning, cheaper
  }

  // For complex tasks, use premium models
  if (taskComplexity === 'complex' && maxCost >= 2.0) {
    return 'claude/claude-3-5-sonnet-20241022';  // Excellent for complex tasks
  }
  if (taskComplexity === 'complex' && maxCost >= 1.0) {
    return 'openai/gpt-4o';  // Good for complex tasks
  }

  // For medium tasks, use balanced models
  if (taskComplexity === 'medium' && maxCost >= 0.5) {
    return 'openai/gpt-4o-mini';  // Affordable and capable
  }

  // For simple tasks, use cheapest paid model
  if (maxCost >= 0.25) {
    return 'claude/claude-3-haiku-20240307';  // Cheapest paid option
  }

  // If budget too low for paid, fallback to FREE
  return selectFreeModel(minQuality);
}

/**
 * Select best Claude model (using latest 2025 models)
 */
function selectClaudeModel(
  taskComplexity: 'simple' | 'medium' | 'complex' | 'expert',
  maxCost: number
): string {
  if (taskComplexity === 'expert' && maxCost >= 10.0) {
    return 'claude/claude-opus-4.1';  // Most powerful - Opus 4.1
  }
  if ((taskComplexity === 'complex' || taskComplexity === 'expert') && maxCost >= 2.0) {
    return 'claude/claude-sonnet-4.5';  // Best balance - Sonnet 4.5
  }
  if (taskComplexity === 'medium' && maxCost >= 1.0) {
    return 'claude/claude-sonnet-3.7';  // Cost-effective Sonnet
  }
  return 'claude/claude-haiku-4.5';  // Fastest and most affordable - Haiku 4.5
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

function selectVoyageModel(
  taskComplexity: 'simple' | 'medium' | 'complex' | 'expert',
  maxCost: number,
  minQuality: 'basic' | 'standard' | 'premium' | 'best',
  taskType?: string
): string {
  // Task-specific model selection: voyage-code-2 is optimized for code tasks
  if (taskType && /code|refactor|test|debug|generate/i.test(taskType)) {
    if (taskComplexity === 'expert' || taskComplexity === 'complex') {
      if (maxCost >= 0.3) {
        return 'voyage/voyage-code-2'; // Optimized for code
      }
    }
    if (taskComplexity === 'medium' && maxCost >= 0.2) {
      return 'voyage/voyage-code-2';
    }
    if (taskComplexity === 'simple' && maxCost >= 0.15) {
      return 'voyage/voyage-code-2';
    }
  }

  // General task selection
  if (taskComplexity === 'expert' || taskComplexity === 'complex') {
    if (maxCost >= 0.5) {
      return 'voyage/voyage-3';
    }
    if (maxCost >= 0.3) {
      return 'voyage/voyage-code-2';
    }
  }

  if (taskComplexity === 'medium' && maxCost >= 0.25) {
    return 'voyage/voyage-code-2';
  }

  if (taskComplexity === 'simple' && maxCost >= 0.2) {
    return 'voyage/voyage-code-2';
  }

  // If budget insufficient, fall back to free model with requested quality
  return selectFreeModel(minQuality);
}

function selectProviderModel(
  provider: ModelConfig['provider'],
  taskComplexity: 'simple' | 'medium' | 'complex' | 'expert',
  maxCost: number,
  minQuality: 'basic' | 'standard' | 'premium' | 'best',
  taskType?: string
): string {
  switch (provider) {
    case 'ollama':
      return selectFreeModel(minQuality);
    case 'openai':
      return selectOpenAIModel(taskComplexity, maxCost);
    case 'claude':
      return selectClaudeModel(taskComplexity, maxCost);
    case 'voyage':
      return selectVoyageModel(taskComplexity, maxCost, minQuality, taskType);
    default:
      return selectFreeModel(minQuality);
  }
}

function resolveAvailableModel(
  modelId: string,
  context: {
    minQuality: 'basic' | 'standard' | 'premium' | 'best';
    taskComplexity: 'simple' | 'medium' | 'complex' | 'expert';
    maxCost: number;
    preferFree: boolean;
    taskType?: string;
  }
): string {
  const config = MODEL_CATALOG[modelId];
  if (config && isProviderAvailable(config.provider)) {
    return modelId;
  }

  const order: ModelConfig['provider'][] = context.preferFree
    ? ['ollama', 'openai', 'claude', 'voyage']
    : ['openai', 'claude', 'voyage', 'ollama'];

  for (const provider of order) {
    if (!isProviderAvailable(provider)) continue;
    return selectProviderModel(provider, context.taskComplexity, context.maxCost, context.minQuality, context.taskType);
  }

  // As a last resort, use free model even if provider unavailable (will throw later if unreachable)
  return selectFreeModel(context.minQuality);
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
  provider?: 'ollama' | 'openai' | 'claude' | 'voyage';
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

