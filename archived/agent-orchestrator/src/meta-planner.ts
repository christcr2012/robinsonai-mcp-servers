/**
 * Meta-Planner: Intelligent Model Selection for Multi-Layer Planning
 * 
 * This is the "brain" that decides which AI models should be used at each layer:
 * - Layer 1: Architect (strategic planning)
 * - Layer 2: Orchestrator (tactical decisions)
 * - Layer 3: Workers (execution)
 * - Layer 4: Optimizer (learning)
 * 
 * Philosophy: "Spend pennies on planning to save dollars on execution"
 * 
 * Uses GPT-4o-mini (~$0.005 per decision) to make intelligent choices that
 * can save $1-10 on execution by selecting the right models.
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Check which API keys are available
const AVAILABLE_PROVIDERS = {
  openai: !!process.env.OPENAI_API_KEY,
  anthropic: !!process.env.ANTHROPIC_API_KEY,
};

// Initialize clients only if API keys are available
let openai: OpenAI | null = null;
let anthropic: Anthropic | null = null;

if (AVAILABLE_PROVIDERS.openai) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

if (AVAILABLE_PROVIDERS.anthropic) {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

export interface TaskAnalysis {
  userRequest: string;
  estimatedSteps: number;
  estimatedComplexity: 'simple' | 'medium' | 'complex' | 'critical';
  budget?: number;
  timeConstraint?: 'fast' | 'normal' | 'thorough';
}

export interface ModelSelectionStrategy {
  architect: {
    model: string;
    reason: string;
    estimatedCost: number;
  };
  orchestrator: {
    useAI: boolean;
    model: string | null;
    reason: string;
    costPerStep: number;
    totalCost: number;
  };
  workers: {
    defaultModel: 'ollama' | 'gpt-4o-mini' | 'gpt-4o' | 'claude-sonnet';
    escalationRules: {
      simple: string;
      medium: string;
      complex: string;
      critical: string;
    };
    reason: string;
    estimatedCost: number;
  };
  optimizer: {
    useAI: boolean;
    model: string | null;
    reason: string;
    cost: number;
  };
  summary: {
    totalEstimatedCost: number;
    expectedSavings: number;
    confidence: number; // 0-1
    reasoning: string;
  };
}

/**
 * Analyze task and decide which models to use at each layer
 */
export async function analyzeAndSelectModels(
  analysis: TaskAnalysis
): Promise<ModelSelectionStrategy> {
  const { userRequest, estimatedSteps, estimatedComplexity, budget = 10.0, timeConstraint = 'normal' } = analysis;

  // Build the prompt for GPT-4o-mini
  const prompt = `You are a Meta-Planner AI that decides which AI models should be used for different parts of a software development task.

TASK ANALYSIS:
- User Request: "${userRequest}"
- Estimated Steps: ${estimatedSteps}
- Complexity: ${estimatedComplexity}
- Budget: $${budget}
- Time Constraint: ${timeConstraint}

AVAILABLE MODELS:

**FREE Models (Ollama - $0 cost)**:
- qwen2.5:3b - Very fast, basic quality
- qwen2.5-coder:7b - Fast, good quality (RECOMMENDED for most tasks)
- deepseek-coder:1.3b - Fastest, basic quality

**PAID Models (OpenAI/Claude)**:
- gpt-4o-mini - $0.15/1M input, $0.60/1M output (~$0.01 per planning task, ~$0.50 per execution task)
- gpt-4o - $2.50/1M input, $10/1M output (~$0.05 per planning task, ~$2.00 per execution task)
- claude-3-5-sonnet - $3/1M input, $15/1M output (~$0.03 per planning task, ~$1.50 per execution task)
- claude-3-haiku - $0.25/1M input, $1.25/1M output (~$0.002 per planning task, ~$0.25 per execution task)

DECISION LAYERS:

1. **Architect (Strategic Planning)**: Breaks down user request into steps
   - FREE Ollama: $0, medium quality, may timeout
   - gpt-4o-mini: ~$0.01, good quality, reliable
   - gpt-4o: ~$0.05, excellent quality, best for complex tasks
   - claude-sonnet: ~$0.03, great at planning

2. **Orchestrator (Tactical Decisions)**: Decides FREE vs PAID for each step
   - Hardcoded rules: $0, fast, dumb
   - gpt-4o-mini: ~$0.005/step, smart decisions
   - claude-haiku: ~$0.002/step, fast and cheap

3. **Workers (Execution)**: Execute individual steps
   - FREE Ollama: $0, good for simple/medium tasks
   - gpt-4o-mini: ~$0.50/task, good for complex tasks
   - gpt-4o: ~$2.00/task, best for critical tasks
   - claude-sonnet: ~$1.50/task, great for architecture

4. **Optimizer (Learning)**: Analyzes patterns and recommends improvements
   - No AI: $0, just tracking
   - gpt-4o-mini (batch): ~$0.10/month, pattern detection

YOUR TASK:
Analyze this task and decide which models to use at each layer to MAXIMIZE quality while MINIMIZING cost.

CRITICAL RULES:
1. **Architect**: If task is simple (1-5 steps), use FREE Ollama. If medium (6-20 steps), use gpt-4o-mini. If complex (21+ steps), use gpt-4o or claude-sonnet.
2. **Orchestrator**: Only use AI if there are 10+ steps AND complexity is medium/high. Otherwise use hardcoded rules.
3. **Workers**: Default to FREE Ollama. Only use PAID for steps that are complex, critical, or involve architecture/design.
4. **Optimizer**: Only use AI if we have 100+ historical tasks. Otherwise just track.
5. **Budget**: Total cost should not exceed the budget.
6. **Quality**: Better planning enables better execution. Spending $0.01 on planning can save $1.00 on execution.

Respond with ONLY a JSON object (no markdown, no explanation):
{
  "architect": {
    "model": "gpt-4o-mini",
    "reason": "Medium complexity task with 15 steps needs good planning",
    "estimatedCost": 0.01
  },
  "orchestrator": {
    "useAI": true,
    "model": "gpt-4o-mini",
    "reason": "15 steps need intelligent FREE vs PAID decisions",
    "costPerStep": 0.005,
    "totalCost": 0.075
  },
  "workers": {
    "defaultModel": "ollama",
    "escalationRules": {
      "simple": "ollama",
      "medium": "ollama",
      "complex": "gpt-4o-mini",
      "critical": "gpt-4o"
    },
    "reason": "Most steps are simple tool additions, use FREE. Escalate only for complex logic.",
    "estimatedCost": 2.0
  },
  "optimizer": {
    "useAI": false,
    "model": null,
    "reason": "Not enough historical data yet",
    "cost": 0
  },
  "summary": {
    "totalEstimatedCost": 2.085,
    "expectedSavings": 15.0,
    "confidence": 0.85,
    "reasoning": "Good planning ($0.085) enables efficient execution ($2.00). Saves $15 vs using PAID for everything."
  }
}`;

  try {
    console.error('[MetaPlanner] 🧠 Analyzing task and selecting models...');

    // Check if we have any PAID API keys available
    if (!AVAILABLE_PROVIDERS.openai && !AVAILABLE_PROVIDERS.anthropic) {
      console.error('[MetaPlanner] ⚠️  No PAID API keys available (OpenAI or Anthropic)');
      console.error('[MetaPlanner] 💡 Recommendation: Set OPENAI_API_KEY or ANTHROPIC_API_KEY for intelligent model selection');
      console.error('[MetaPlanner] 📝 Using fallback strategy (FREE Ollama only)');
      return getFallbackStrategy(analysis);
    }

    // Prefer OpenAI (GPT-4o-mini) for Meta-Planning (cheaper and faster)
    if (AVAILABLE_PROVIDERS.openai && openai) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a Meta-Planner AI that makes intelligent decisions about which AI models to use for different parts of a task. You always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const content = response.choices[0].message.content || '{}';
      const strategy = JSON.parse(content) as ModelSelectionStrategy;

      console.error('[MetaPlanner] ✅ Model selection strategy generated (OpenAI GPT-4o-mini)');
      console.error(`[MetaPlanner] 📊 Total estimated cost: $${strategy.summary.totalEstimatedCost.toFixed(3)}`);
      console.error(`[MetaPlanner] 💰 Expected savings: $${strategy.summary.expectedSavings.toFixed(2)}`);
      console.error(`[MetaPlanner] 🎯 Confidence: ${(strategy.summary.confidence * 100).toFixed(0)}%`);

      return strategy;
    }

    // Fallback to Anthropic (Claude Haiku) if OpenAI not available
    if (AVAILABLE_PROVIDERS.anthropic && anthropic) {
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: `You are a Meta-Planner AI that makes intelligent decisions about which AI models to use for different parts of a task. You always respond with valid JSON only.\n\n${prompt}`
          }
        ],
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '{}';
      const strategy = JSON.parse(content) as ModelSelectionStrategy;

      console.error('[MetaPlanner] ✅ Model selection strategy generated (Claude Haiku)');
      console.error(`[MetaPlanner] 📊 Total estimated cost: $${strategy.summary.totalEstimatedCost.toFixed(3)}`);
      console.error(`[MetaPlanner] 💰 Expected savings: $${strategy.summary.expectedSavings.toFixed(2)}`);
      console.error(`[MetaPlanner] 🎯 Confidence: ${(strategy.summary.confidence * 100).toFixed(0)}%`);

      return strategy;
    }

    // Should never reach here, but just in case
    console.error('[MetaPlanner] ⚠️  No PAID providers available, using fallback');
    return getFallbackStrategy(analysis);
  } catch (error: any) {
    console.error('[MetaPlanner] ❌ Failed to generate strategy, using fallback:', error.message);

    // Fallback strategy: Conservative defaults
    return getFallbackStrategy(analysis);
  }
}

/**
 * Fallback strategy when Meta-Planner fails
 */
function getFallbackStrategy(analysis: TaskAnalysis): ModelSelectionStrategy {
  const { estimatedSteps, estimatedComplexity } = analysis;

  return {
    architect: {
      model: estimatedComplexity === 'simple' ? 'ollama' : 'gpt-4o-mini',
      reason: 'Fallback: Use FREE for simple, PAID for complex',
      estimatedCost: estimatedComplexity === 'simple' ? 0 : 0.01,
    },
    orchestrator: {
      useAI: false,
      model: null,
      reason: 'Fallback: Use hardcoded rules',
      costPerStep: 0,
      totalCost: 0,
    },
    workers: {
      defaultModel: 'ollama',
      escalationRules: {
        simple: 'ollama',
        medium: 'ollama',
        complex: 'gpt-4o-mini',
        critical: 'gpt-4o',
      },
      reason: 'Fallback: Conservative defaults',
      estimatedCost: estimatedSteps * 0.1,
    },
    optimizer: {
      useAI: false,
      model: null,
      reason: 'Fallback: Just track',
      cost: 0,
    },
    summary: {
      totalEstimatedCost: 0.01 + (estimatedSteps * 0.1),
      expectedSavings: 0,
      confidence: 0.5,
      reasoning: 'Fallback strategy due to Meta-Planner failure',
    },
  };
}

/**
 * Get recommendation for which API keys to set up
 */
export function getAPIKeyRecommendation(strategy: ModelSelectionStrategy): {
  needed: string[];
  optional: string[];
  message: string;
} | null {
  const needed: string[] = [];
  const optional: string[] = [];

  // Check Architect model
  if (strategy.architect.model.startsWith('openai/') || strategy.architect.model === 'gpt-4o-mini' || strategy.architect.model === 'gpt-4o') {
    if (!AVAILABLE_PROVIDERS.openai) {
      needed.push('OPENAI_API_KEY');
    }
  } else if (strategy.architect.model.startsWith('claude/') || strategy.architect.model.includes('claude')) {
    if (!AVAILABLE_PROVIDERS.anthropic) {
      needed.push('ANTHROPIC_API_KEY');
    }
  }

  // Check Orchestrator model
  if (strategy.orchestrator.useAI && strategy.orchestrator.model) {
    if (strategy.orchestrator.model.startsWith('openai/') || strategy.orchestrator.model.includes('gpt')) {
      if (!AVAILABLE_PROVIDERS.openai && !needed.includes('OPENAI_API_KEY')) {
        needed.push('OPENAI_API_KEY');
      }
    } else if (strategy.orchestrator.model.startsWith('claude/') || strategy.orchestrator.model.includes('claude')) {
      if (!AVAILABLE_PROVIDERS.anthropic && !needed.includes('ANTHROPIC_API_KEY')) {
        needed.push('ANTHROPIC_API_KEY');
      }
    }
  }

  // Check Worker models
  const workerModels = Object.values(strategy.workers.escalationRules);
  for (const model of workerModels) {
    if (model.includes('gpt') || model.includes('openai')) {
      if (!AVAILABLE_PROVIDERS.openai && !needed.includes('OPENAI_API_KEY') && !optional.includes('OPENAI_API_KEY')) {
        optional.push('OPENAI_API_KEY');
      }
    } else if (model.includes('claude')) {
      if (!AVAILABLE_PROVIDERS.anthropic && !needed.includes('ANTHROPIC_API_KEY') && !optional.includes('ANTHROPIC_API_KEY')) {
        optional.push('ANTHROPIC_API_KEY');
      }
    }
  }

  // If no missing keys, return null
  if (needed.length === 0 && optional.length === 0) {
    return null;
  }

  // Build message
  let message = '\n🔑 **API Key Recommendation**\n\n';

  if (needed.length > 0) {
    message += '**REQUIRED** (for optimal performance):\n';
    for (const key of needed) {
      message += `  - ${key}\n`;
    }
    message += '\n';
  }

  if (optional.length > 0) {
    message += '**OPTIONAL** (for better quality on complex tasks):\n';
    for (const key of optional) {
      message += `  - ${key}\n`;
    }
    message += '\n';
  }

  message += 'Set these in your .env.local file to enable the recommended models.\n';
  message += 'Without these keys, the system will use FREE Ollama models (slower, lower quality).\n';

  return { needed, optional, message };
}

/**
 * Quick estimate of task complexity and steps
 */
export function estimateTask(userRequest: string): TaskAnalysis {
  const requestLower = userRequest.toLowerCase();
  
  // Estimate steps based on keywords
  let estimatedSteps = 5; // default
  
  if (/\d+/.test(userRequest)) {
    const numbers = userRequest.match(/\d+/g);
    if (numbers) {
      const maxNumber = Math.max(...numbers.map(n => parseInt(n, 10)));
      if (maxNumber > 10) {
        estimatedSteps = Math.min(maxNumber, 100);
      }
    }
  }
  
  // Estimate complexity
  let estimatedComplexity: 'simple' | 'medium' | 'complex' | 'critical' = 'medium';
  
  if (requestLower.includes('simple') || requestLower.includes('basic') || estimatedSteps <= 5) {
    estimatedComplexity = 'simple';
  } else if (requestLower.includes('complex') || requestLower.includes('architecture') || estimatedSteps > 50) {
    estimatedComplexity = 'complex';
  } else if (requestLower.includes('critical') || requestLower.includes('production') || requestLower.includes('security')) {
    estimatedComplexity = 'critical';
  }
  
  return {
    userRequest,
    estimatedSteps,
    estimatedComplexity,
  };
}

