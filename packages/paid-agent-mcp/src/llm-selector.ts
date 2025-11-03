/**
 * Intelligent Task-Based LLM Selector for Code Generation
 * 
 * Dynamically selects the best LLM for each task based on:
 * - Task type (code generation, analysis, refactoring, testing)
 * - Task complexity (simple, medium, complex, expert)
 * - Code language/framework
 * - Quality requirements
 * - Cost constraints
 * - Available providers
 * 
 * Can switch between:
 * - OpenAI (GPT-4o-mini, GPT-4o, o1-mini, o1-preview)
 * - Claude (Haiku 3, Sonnet 3.5, Opus 3)
 */

export type LLMTaskType = 'code_generation' | 'code_analysis' | 'refactoring' | 'test_generation' | 'documentation' | 'debugging';
export type LLMComplexity = 'simple' | 'medium' | 'complex' | 'expert';

export interface LLMTaskContext {
  type: LLMTaskType;
  complexity: LLMComplexity;
  language?: string;
  framework?: string;
  estimatedTokens?: number;
  preferQuality?: boolean;
  maxCostPer1M?: number;
  requiresReasoning?: boolean; // For o1 models
}

export interface LLMRecommendation {
  provider: 'openai' | 'claude';
  model: string;
  inputCostPer1M: number;
  outputCostPer1M: number;
  contextWindow: number;
  reasoning: string;
  qualityScore: number;   // 0-100
  speedScore: number;     // 0-100
  valueScore: number;     // 0-100 (quality/cost ratio)
  codeScore: number;      // 0-100 (code-specific quality)
}

/**
 * LLM database with capabilities and costs
 */
const LLM_DATABASE = {
  openai: {
    'gpt-4o-mini': {
      inputCostPer1M: 0.15,
      outputCostPer1M: 0.60,
      contextWindow: 128000,
      qualityScore: 75,
      speedScore: 95,
      codeScore: 70,
      bestFor: ['simple', 'medium', 'documentation', 'test_generation'],
      strengths: ['fast', 'cheap', 'good-enough', 'high-throughput']
    },
    'gpt-4o': {
      inputCostPer1M: 2.50,
      outputCostPer1M: 10.00,
      contextWindow: 128000,
      qualityScore: 90,
      speedScore: 85,
      codeScore: 88,
      bestFor: ['medium', 'complex', 'code_generation', 'refactoring'],
      strengths: ['balanced', 'reliable', 'good-code', 'fast']
    },
    'o1-mini': {
      inputCostPer1M: 3.00,
      outputCostPer1M: 12.00,
      contextWindow: 128000,
      qualityScore: 92,
      speedScore: 70,
      codeScore: 90,
      bestFor: ['complex', 'debugging', 'reasoning'],
      strengths: ['reasoning', 'problem-solving', 'complex-logic', 'debugging']
    },
    'o1-preview': {
      inputCostPer1M: 15.00,
      outputCostPer1M: 60.00,
      contextWindow: 128000,
      qualityScore: 98,
      speedScore: 50,
      codeScore: 95,
      bestFor: ['expert', 'complex', 'reasoning', 'architecture'],
      strengths: ['best-reasoning', 'expert-level', 'complex-problems', 'architecture']
    }
  },
  claude: {
    'claude-3-haiku-20240307': {
      inputCostPer1M: 0.25,
      outputCostPer1M: 1.25,
      contextWindow: 200000,
      qualityScore: 78,
      speedScore: 98,
      codeScore: 75,
      bestFor: ['simple', 'medium', 'documentation', 'analysis'],
      strengths: ['fastest', 'cheapest', 'large-context', 'good-value']
    },
    'claude-3-5-sonnet-20241022': {
      inputCostPer1M: 3.00,
      outputCostPer1M: 15.00,
      contextWindow: 200000,
      qualityScore: 98,
      speedScore: 80,
      codeScore: 98,
      bestFor: ['code_generation', 'complex', 'expert', 'refactoring'],
      strengths: ['best-for-code', 'excellent-quality', 'large-context', 'precise']
    },
    'claude-3-opus-20240229': {
      inputCostPer1M: 15.00,
      outputCostPer1M: 75.00,
      contextWindow: 200000,
      qualityScore: 100,
      speedScore: 60,
      codeScore: 95,
      bestFor: ['expert', 'complex', 'architecture', 'critical'],
      strengths: ['best-overall', 'highest-quality', 'large-context', 'critical-tasks']
    }
  }
} as const;

/**
 * Check which providers are available based on API keys
 */
function getAvailableProviders(): Set<'openai' | 'claude'> {
  const available = new Set<'openai' | 'claude'>();
  
  if (process.env.OPENAI_API_KEY) {
    available.add('openai');
  }
  
  if (process.env.ANTHROPIC_API_KEY) {
    available.add('claude');
  }
  
  return available;
}

/**
 * Calculate value score (quality per dollar)
 */
function calculateValueScore(qualityScore: number, avgCostPer1M: number): number {
  if (avgCostPer1M === 0) return 100;
  return Math.min(100, (qualityScore / avgCostPer1M) * 2);
}

/**
 * Score an LLM for a specific task
 */
function scoreLLMForTask(
  provider: 'openai' | 'claude',
  modelName: string,
  task: LLMTaskContext
): number {
  const providerModels = LLM_DATABASE[provider];
  const model = (providerModels as any)[modelName];
  if (!model) return 0;

  let score = 0;

  // Base quality score (30% weight)
  score += model.qualityScore * 0.3;

  // Code-specific quality (30% weight)
  if (task.type === 'code_generation' || task.type === 'refactoring') {
    score += model.codeScore * 0.3;
  } else {
    score += model.qualityScore * 0.3;
  }

  // Task type match (20 points)
  if (model.bestFor.includes(task.type)) {
    score += 20;
  }

  // Complexity match (20 points)
  if (model.bestFor.includes(task.complexity)) {
    score += 20;
  }

  // Claude Sonnet 3.5 is BEST for code (25 points)
  if (task.type === 'code_generation' && provider === 'claude' && modelName === 'claude-3-5-sonnet-20241022') {
    score += 25;
  }

  // o1 models for reasoning tasks (20 points)
  if (task.requiresReasoning && (modelName === 'o1-mini' || modelName === 'o1-preview')) {
    score += 20;
  }

  // Quality preference (15 points)
  if (task.preferQuality && model.qualityScore > 95) {
    score += 15;
  }

  // Cost constraint (heavy penalty)
  const avgCost = (model.inputCostPer1M + model.outputCostPer1M) / 2;
  if (task.maxCostPer1M && avgCost > task.maxCostPer1M) {
    score -= 50;
  }

  // Speed bonus for simple tasks (10 points)
  if (task.complexity === 'simple') {
    score += model.speedScore * 0.1;
  }

  // Language/framework specific bonuses
  if (task.language === 'typescript' || task.language === 'javascript') {
    if (provider === 'claude' && modelName === 'claude-3-5-sonnet-20241022') {
      score += 10; // Sonnet 3.5 is excellent for TS/JS
    }
  }

  if (task.language === 'python') {
    if (provider === 'openai' && modelName === 'gpt-4o') {
      score += 10; // GPT-4o is excellent for Python
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Select the best LLM for a given task
 */
export function selectLLMForTask(task: LLMTaskContext): LLMRecommendation | null {
  const available = getAvailableProviders();
  
  if (available.size === 0) {
    console.warn('[LLMSelector] No LLM providers available');
    return null;
  }

  const candidates: LLMRecommendation[] = [];

  // Score all available models
  for (const provider of available) {
    const models = LLM_DATABASE[provider];
    
    for (const [modelName, modelInfo] of Object.entries(models)) {
      const score = scoreLLMForTask(provider, modelName, task);
      const avgCost = (modelInfo.inputCostPer1M + modelInfo.outputCostPer1M) / 2;
      const valueScore = calculateValueScore(modelInfo.qualityScore, avgCost);
      
      candidates.push({
        provider,
        model: modelName,
        inputCostPer1M: modelInfo.inputCostPer1M,
        outputCostPer1M: modelInfo.outputCostPer1M,
        contextWindow: modelInfo.contextWindow,
        qualityScore: modelInfo.qualityScore,
        speedScore: modelInfo.speedScore,
        codeScore: modelInfo.codeScore,
        valueScore,
        reasoning: generateReasoning(provider, modelName, task, score)
      });
    }
  }

  // Sort by score (highest first)
  candidates.sort((a, b) => {
    const scoreA = scoreLLMForTask(a.provider, a.model, task);
    const scoreB = scoreLLMForTask(b.provider, b.model, task);
    return scoreB - scoreA;
  });

  const best = candidates[0];
  
  if (best) {
    console.log(`[LLMSelector] 🎯 Selected ${best.provider}/${best.model} for ${task.type} (${task.complexity})`);
    console.log(`[LLMSelector] Reasoning: ${best.reasoning}`);
    console.log(`[LLMSelector] Quality: ${best.qualityScore}/100, Code: ${best.codeScore}/100`);
    console.log(`[LLMSelector] Cost: $${best.inputCostPer1M}/$${best.outputCostPer1M} per 1M tokens`);
  }

  return best;
}

/**
 * Generate human-readable reasoning for LLM selection
 */
function generateReasoning(
  provider: string,
  model: string,
  task: LLMTaskContext,
  score: number
): string {
  const providerModels = LLM_DATABASE[provider as keyof typeof LLM_DATABASE];
  const modelInfo = (providerModels as any)[model];
  
  const reasons: string[] = [];

  // Task type match
  if (modelInfo.bestFor.includes(task.type)) {
    reasons.push(`optimized for ${task.type.replace('_', ' ')}`);
  }

  // Quality
  if (task.preferQuality && modelInfo.qualityScore > 95) {
    reasons.push('highest quality');
  }

  // Code-specific
  if (task.type === 'code_generation' && modelInfo.codeScore > 95) {
    reasons.push('best for code');
  }

  // Cost
  const avgCost = (modelInfo.inputCostPer1M + modelInfo.outputCostPer1M) / 2;
  if (avgCost < 1) {
    reasons.push('very affordable');
  } else if (avgCost < 5) {
    reasons.push('good value');
  }

  // Strengths
  if (modelInfo.strengths.length > 0) {
    reasons.push(modelInfo.strengths.slice(0, 2).join(', '));
  }

  return reasons.join(', ') || 'general purpose';
}

/**
 * Get all available LLMs with their capabilities
 */
export function listAvailableLLMs(): LLMRecommendation[] {
  const available = getAvailableProviders();
  const models: LLMRecommendation[] = [];

  for (const provider of available) {
    const providerModels = LLM_DATABASE[provider];
    
    for (const [modelName, modelInfo] of Object.entries(providerModels)) {
      const avgCost = (modelInfo.inputCostPer1M + modelInfo.outputCostPer1M) / 2;
      const valueScore = calculateValueScore(modelInfo.qualityScore, avgCost);
      
      models.push({
        provider,
        model: modelName,
        inputCostPer1M: modelInfo.inputCostPer1M,
        outputCostPer1M: modelInfo.outputCostPer1M,
        contextWindow: modelInfo.contextWindow,
        qualityScore: modelInfo.qualityScore,
        speedScore: modelInfo.speedScore,
        codeScore: modelInfo.codeScore,
        valueScore,
        reasoning: modelInfo.strengths.join(', ')
      });
    }
  }

  return models.sort((a, b) => b.codeScore - a.codeScore);
}

