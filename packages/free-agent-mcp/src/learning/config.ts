#!/usr/bin/env node
/**
 * Learning System Configuration
 * 
 * Controls automatic learning, SFT export, LoRA training, and model deployment
 */

export interface LearningConfig {
  // Enable/disable learning system
  enabled: boolean;

  // Reward calculation weights
  rewardWeights: {
    compile: number;
    tests: number;
    errors: number;
    human: number;
  };

  // Prompt bandit settings
  promptBandit: {
    epsilon: number; // Exploration rate (0.1 = 10% random)
    variants: string[]; // Prompt variant IDs
  };

  // Model router settings
  modelRouter: {
    epsilon: number; // Exploration rate
    maxCostPerToken: number; // Max cost for model selection
  };

  // Web knowledge settings
  webKnowledge: {
    enabled: boolean;
    maxCacheAgeDays: number;
    summarizeLength: number; // Paragraph count
  };

  // Automatic SFT export
  autoExport: {
    enabled: boolean;
    minRuns: number; // Min runs before export (e.g., 100)
    minReward: number; // Min reward to include (e.g., 0.7)
    maxExamples: number; // Max examples per export (e.g., 1000)
  };

  // Automatic LoRA training
  autoTrain: {
    enabled: boolean;
    minExamples: number; // Min examples before training (e.g., 500)
    baseModel: string; // Base model for fine-tuning
    loraRank: number; // LoRA rank (16 is good default)
    epochs: number; // Training epochs
    batchSize: number;
    learningRate: number;
  };

  // Automatic Ollama deployment
  autoDeploy: {
    enabled: boolean;
    modelNamePrefix: string; // e.g., "my-coder-tuned"
    temperature: number;
    topP: number;
    topK: number;
  };

  // Drift detection
  driftDetection: {
    enabled: boolean;
    minPerformanceDrop: number; // e.g., 0.05 = 5% drop triggers rollback
    evaluationRuns: number; // Number of runs to evaluate new model
  };
}

export const DEFAULT_CONFIG: LearningConfig = {
  enabled: true,

  rewardWeights: {
    compile: 0.25,
    tests: 0.25,
    errors: 0.25,
    human: 0.25,
  },

  promptBandit: {
    epsilon: 0.1,
    variants: ['default', 'detailed', 'concise'],
  },

  modelRouter: {
    epsilon: 0.1,
    maxCostPerToken: 0.002, // $2 per 1M tokens
  },

  webKnowledge: {
    enabled: true,
    maxCacheAgeDays: 7,
    summarizeLength: 3,
  },

  autoExport: {
    enabled: true,
    minRuns: 100, // Export after 100 runs
    minReward: 0.7, // Only export high-quality runs
    maxExamples: 1000,
  },

  autoTrain: {
    enabled: true,
    minExamples: 500, // Train after 500 examples
    baseModel: 'qwen2.5-coder:7b',
    loraRank: 16,
    epochs: 3,
    batchSize: 2,
    learningRate: 2e-4,
  },

  autoDeploy: {
    enabled: true,
    modelNamePrefix: 'my-coder-tuned',
    temperature: 0.2,
    topP: 0.9,
    topK: 40,
  },

  driftDetection: {
    enabled: true,
    minPerformanceDrop: 0.05, // 5% drop triggers rollback
    evaluationRuns: 20, // Evaluate over 20 runs
  },
};

/**
 * Load learning config from file or use defaults
 */
export function loadLearningConfig(repoRoot: string): LearningConfig {
  const { readFileSync, existsSync } = require('fs');
  const { join } = require('path');

  const configPath = join(repoRoot, '.agent', 'learning-config.json');

  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      return { ...DEFAULT_CONFIG, ...config };
    } catch (error) {
      console.warn('⚠️  Failed to load learning config, using defaults:', error);
      return DEFAULT_CONFIG;
    }
  }

  return DEFAULT_CONFIG;
}

/**
 * Save learning config to file
 */
export function saveLearningConfig(repoRoot: string, config: LearningConfig): void {
  const { writeFileSync, mkdirSync } = require('fs');
  const { join } = require('path');

  const agentDir = join(repoRoot, '.agent');
  mkdirSync(agentDir, { recursive: true });

  const configPath = join(agentDir, 'learning-config.json');
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

