/**
 * Intelligent Task-Based Model Selector
 * 
 * Dynamically selects the best model for each task based on:
 * - Task type (code, docs, general)
 * - Task complexity (simple, medium, complex)
 * - Quality requirements
 * - Cost constraints
 * - Available providers
 * 
 * Can switch between:
 * - OpenAI (text-embedding-3-small, text-embedding-3-large)
 * - Voyage AI (voyage-code-2, voyage-3)
 * - Ollama (nomic-embed-text, mxbai-embed-large)
 */

export type TaskType = 'code' | 'documentation' | 'general' | 'search';
export type TaskComplexity = 'simple' | 'medium' | 'complex';

export interface TaskContext {
  type: TaskType;
  complexity: TaskComplexity;
  fileExtensions?: string[];
  estimatedTokens?: number;
  preferQuality?: boolean;
  maxCostPer1M?: number;
}

export interface ModelRecommendation {
  provider: 'openai' | 'voyage' | 'ollama';
  model: string;
  costPer1M: number;
  dimensions: number;
  reasoning: string;
  qualityScore: number; // 0-100
  speedScore: number;   // 0-100
  valueScore: number;   // 0-100 (quality/cost ratio)
}

/**
 * Model database with capabilities and costs
 */
const MODEL_DATABASE = {
  openai: {
    'text-embedding-3-small': {
      costPer1M: 0.02,
      dimensions: 1536,
      qualityScore: 80,
      speedScore: 95,
      bestFor: ['general', 'documentation', 'search'],
      strengths: ['fast', 'cheap', 'good-quality']
    },
    'text-embedding-3-large': {
      costPer1M: 0.13,
      dimensions: 3072,
      qualityScore: 95,
      speedScore: 75,
      bestFor: ['code', 'complex-search', 'high-precision'],
      strengths: ['best-quality', 'high-dimensions', 'precise']
    }
  },
  voyage: {
    'voyage-code-2': {
      costPer1M: 0.10,
      dimensions: 1536,
      qualityScore: 95,
      speedScore: 80,
      bestFor: ['code', 'technical-docs', 'api-docs'],
      strengths: ['code-optimized', 'technical', 'high-quality']
    },
    'voyage-3': {
      costPer1M: 0.12,
      dimensions: 1024,
      qualityScore: 98,
      speedScore: 75,
      bestFor: ['general', 'complex-search', 'multilingual'],
      strengths: ['best-overall', 'multilingual', 'state-of-art']
    }
  },
  ollama: {
    'nomic-embed-text': {
      costPer1M: 0,
      dimensions: 768,
      qualityScore: 65,
      speedScore: 60,
      bestFor: ['general', 'simple-search', 'free'],
      strengths: ['free', 'local', 'privacy']
    },
    'mxbai-embed-large': {
      costPer1M: 0,
      dimensions: 1024,
      qualityScore: 70,
      speedScore: 55,
      bestFor: ['general', 'medium-search', 'free'],
      strengths: ['free', 'local', 'better-quality']
    }
  }
} as const;

/**
 * Check which providers are available based on API keys
 */
function getAvailableProviders(): Set<'openai' | 'voyage' | 'ollama'> {
  const available = new Set<'openai' | 'voyage' | 'ollama'>();
  
  if (process.env.OPENAI_API_KEY) {
    available.add('openai');
  }
  
  if (process.env.VOYAGE_API_KEY || process.env.ANTHROPIC_API_KEY) {
    available.add('voyage');
  }
  
  // Assume Ollama is available if base URL is set or default
  if (process.env.OLLAMA_BASE_URL || process.env.EMBED_PROVIDER === 'ollama') {
    available.add('ollama');
  }
  
  return available;
}

/**
 * Calculate value score (quality per dollar)
 */
function calculateValueScore(qualityScore: number, costPer1M: number): number {
  if (costPer1M === 0) return 100; // Free is infinite value
  return Math.min(100, (qualityScore / costPer1M) * 0.5);
}

/**
 * Score a model for a specific task
 */
function scoreModelForTask(
  provider: 'openai' | 'voyage' | 'ollama',
  modelName: string,
  task: TaskContext
): number {
  const providerModels = MODEL_DATABASE[provider];
  const model = (providerModels as any)[modelName];
  if (!model) return 0;

  let score = 0;

  // Base quality score
  score += model.qualityScore * 0.4;

  // Task type match
  if (model.bestFor.includes(task.type)) {
    score += 20;
  }

  // Complexity match
  if (task.complexity === 'simple' && model.qualityScore < 80) {
    score += 10; // Prefer cheaper models for simple tasks
  } else if (task.complexity === 'complex' && model.qualityScore > 90) {
    score += 20; // Prefer best models for complex tasks
  }

  // Code-specific optimization
  if (task.type === 'code') {
    if (provider === 'voyage' && modelName === 'voyage-code-2') {
      score += 25; // Voyage Code 2 is optimized for code
    } else if (provider === 'openai' && modelName === 'text-embedding-3-large') {
      score += 15; // Large model is good for code too
    }
  }

  // Quality preference
  if (task.preferQuality && model.qualityScore > 90) {
    score += 15;
  }

  // Cost constraint
  if (task.maxCostPer1M && model.costPer1M > task.maxCostPer1M) {
    score -= 50; // Heavy penalty for exceeding budget
  }

  // Speed bonus for simple tasks
  if (task.complexity === 'simple') {
    score += model.speedScore * 0.1;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Select the best model for a given task
 */
export function selectModelForTask(task: TaskContext): ModelRecommendation | null {
  const available = getAvailableProviders();
  
  if (available.size === 0) {
    console.warn('[ModelSelector] No embedding providers available');
    return null;
  }

  const candidates: ModelRecommendation[] = [];

  // Score all available models
  for (const provider of available) {
    const models = MODEL_DATABASE[provider];
    
    for (const [modelName, modelInfo] of Object.entries(models)) {
      const score = scoreModelForTask(provider, modelName, task);
      const valueScore = calculateValueScore(modelInfo.qualityScore, modelInfo.costPer1M);
      
      candidates.push({
        provider,
        model: modelName,
        costPer1M: modelInfo.costPer1M,
        dimensions: modelInfo.dimensions,
        qualityScore: modelInfo.qualityScore,
        speedScore: modelInfo.speedScore,
        valueScore,
        reasoning: generateReasoning(provider, modelName, task, score)
      });
    }
  }

  // Sort by score (highest first)
  candidates.sort((a, b) => {
    const scoreA = scoreModelForTask(a.provider, a.model, task);
    const scoreB = scoreModelForTask(b.provider, b.model, task);
    return scoreB - scoreA;
  });

  const best = candidates[0];
  
  if (best) {
    console.log(`[ModelSelector] Selected ${best.provider}/${best.model} for ${task.type} task (${task.complexity})`);
    console.log(`[ModelSelector] Reasoning: ${best.reasoning}`);
    console.log(`[ModelSelector] Quality: ${best.qualityScore}/100, Cost: $${best.costPer1M}/1M, Value: ${best.valueScore.toFixed(1)}/100`);
  }

  return best;
}

/**
 * Generate human-readable reasoning for model selection
 */
function generateReasoning(
  provider: string,
  model: string,
  task: TaskContext,
  score: number
): string {
  const providerModels = MODEL_DATABASE[provider as keyof typeof MODEL_DATABASE];
  const modelInfo = (providerModels as any)[model];
  
  const reasons: string[] = [];

  // Task type match
  if (modelInfo.bestFor.includes(task.type)) {
    reasons.push(`optimized for ${task.type}`);
  }

  // Quality
  if (task.preferQuality && modelInfo.qualityScore > 90) {
    reasons.push('highest quality');
  }

  // Cost
  if (modelInfo.costPer1M === 0) {
    reasons.push('free');
  } else if (modelInfo.costPer1M < 0.05) {
    reasons.push('very affordable');
  }

  // Strengths
  if (modelInfo.strengths.length > 0) {
    reasons.push(modelInfo.strengths.slice(0, 2).join(', '));
  }

  return reasons.join(', ') || 'general purpose';
}

/**
 * Detect task type from file extensions
 */
export function detectTaskType(fileExtensions: string[]): TaskType {
  const codeExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.c', '.cpp'];
  const docExts = ['.md', '.mdx', '.txt', '.rst'];
  
  const hasCode = fileExtensions.some(ext => codeExts.includes(ext));
  const hasDocs = fileExtensions.some(ext => docExts.includes(ext));
  
  if (hasCode && !hasDocs) return 'code';
  if (hasDocs && !hasCode) return 'documentation';
  return 'general';
}

/**
 * Estimate task complexity from file count and size
 */
export function estimateComplexity(fileCount: number, avgFileSize: number): TaskComplexity {
  if (fileCount < 100 && avgFileSize < 1000) return 'simple';
  if (fileCount < 1000 && avgFileSize < 5000) return 'medium';
  return 'complex';
}

/**
 * Get all available models with their capabilities
 */
export function listAvailableModels(): ModelRecommendation[] {
  const available = getAvailableProviders();
  const models: ModelRecommendation[] = [];

  for (const provider of available) {
    const providerModels = MODEL_DATABASE[provider];
    
    for (const [modelName, modelInfo] of Object.entries(providerModels)) {
      const valueScore = calculateValueScore(modelInfo.qualityScore, modelInfo.costPer1M);
      
      models.push({
        provider,
        model: modelName,
        costPer1M: modelInfo.costPer1M,
        dimensions: modelInfo.dimensions,
        qualityScore: modelInfo.qualityScore,
        speedScore: modelInfo.speedScore,
        valueScore,
        reasoning: modelInfo.strengths.join(', ')
      });
    }
  }

  return models.sort((a, b) => b.qualityScore - a.qualityScore);
}

