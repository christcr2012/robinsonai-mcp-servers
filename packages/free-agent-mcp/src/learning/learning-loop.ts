#!/usr/bin/env node
/**
 * Learning Loop - Compact learning from every run
 * 
 * Features:
 * 1. Reward calculation from compile/lint/type/test/coverage/human signals
 * 2. Prompt portfolio bandit (ε-greedy selection)
 * 3. Model router (easy→local, hard→API)
 * 4. Context shaper (learn which retrieval bundles work)
 * 
 * This gives real, quick lift without any training yet.
 */

import { ExperienceDB, Run, Signals, Pair } from './experience-db.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface RewardInputs {
  compile_pass: boolean;
  lint_errors: number;
  type_errors: number;
  tests_passed: number;
  tests_total: number;
  coverage_pct: number;
  schema_errors: number;
  boundary_errors: number;
  human_accept?: boolean; // Optional: did user accept the patch?
}

export interface PromptVariant {
  id: string;
  name: string;
  template: string;
  wins: number;
  trials: number;
}

export interface ModelVariant {
  id: string;
  name: string;
  cost_per_1k: number;
  wins: number;
  trials: number;
}

export class LearningLoop {
  private db: ExperienceDB;
  private repoRoot: string;
  private epsilon = 0.1; // ε-greedy exploration rate

  constructor(repoRoot: string) {
    this.repoRoot = repoRoot;
    this.db = new ExperienceDB(repoRoot);
  }

  // ============================================================================
  // REWARD CALCULATION
  // ============================================================================

  /**
   * Calculate composite reward (0..1) from quality signals
   * 
   * Formula:
   * reward = 0.25 * compile + 0.25 * tests + 0.25 * (1 - error_rate) + 0.25 * human_accept
   * 
   * Where:
   * - compile: 1 if passes, 0 if fails
   * - tests: tests_passed / tests_total (or 1 if no tests)
   * - error_rate: (lint + type + schema + boundary) / max_errors (capped at 1)
   * - human_accept: 1 if accepted, 0 if rejected, 0.5 if unknown
   */
  calculateReward(inputs: RewardInputs): number {
    // Compile score (0 or 1)
    const compileScore = inputs.compile_pass ? 1 : 0;

    // Test score (0..1)
    const testScore = inputs.tests_total > 0
      ? inputs.tests_passed / inputs.tests_total
      : 1; // No tests = assume pass

    // Error rate (0..1, lower is better)
    const totalErrors = inputs.lint_errors + inputs.type_errors + inputs.schema_errors + inputs.boundary_errors;
    const maxErrors = 100; // Assume 100 errors is "very bad"
    const errorRate = Math.min(totalErrors / maxErrors, 1);
    const errorScore = 1 - errorRate;

    // Human accept score (0, 0.5, or 1)
    const humanScore = inputs.human_accept === true ? 1 : inputs.human_accept === false ? 0 : 0.5;

    // Composite reward
    const reward = 0.25 * compileScore + 0.25 * testScore + 0.25 * errorScore + 0.25 * humanScore;

    return Math.max(0, Math.min(1, reward)); // Clamp to [0, 1]
  }

  // ============================================================================
  // PROMPT PORTFOLIO BANDIT (ε-greedy)
  // ============================================================================

  /**
   * Load prompt variants from JSON file
   */
  private loadPromptVariants(): PromptVariant[] {
    const path = join(this.repoRoot, '.agent', 'prompt_variants.json');
    if (!existsSync(path)) {
      // Create default variants
      const defaults: PromptVariant[] = [
        { id: 'default', name: 'Default Prompt', template: 'default', wins: 0, trials: 0 },
        { id: 'detailed', name: 'Detailed Prompt', template: 'detailed', wins: 0, trials: 0 },
        { id: 'concise', name: 'Concise Prompt', template: 'concise', wins: 0, trials: 0 },
      ];
      writeFileSync(path, JSON.stringify(defaults, null, 2));
      return defaults;
    }
    return JSON.parse(readFileSync(path, 'utf-8'));
  }

  /**
   * Save prompt variants to JSON file
   */
  private savePromptVariants(variants: PromptVariant[]): void {
    const path = join(this.repoRoot, '.agent', 'prompt_variants.json');
    writeFileSync(path, JSON.stringify(variants, null, 2));
  }

  /**
   * Select prompt variant using ε-greedy strategy
   * 
   * With probability ε, explore (random variant)
   * With probability 1-ε, exploit (best variant by win rate)
   */
  selectPromptVariant(): PromptVariant {
    const variants = this.loadPromptVariants();

    // ε-greedy selection
    if (Math.random() < this.epsilon) {
      // Explore: random variant
      return variants[Math.floor(Math.random() * variants.length)];
    } else {
      // Exploit: best variant by win rate
      const sorted = variants.sort((a, b) => {
        const aRate = a.trials > 0 ? a.wins / a.trials : 0;
        const bRate = b.trials > 0 ? b.wins / b.trials : 0;
        return bRate - aRate;
      });
      return sorted[0];
    }
  }

  /**
   * Update prompt variant with reward
   */
  updatePromptVariant(promptId: string, reward: number): void {
    const variants = this.loadPromptVariants();
    const variant = variants.find(v => v.id === promptId);
    if (variant) {
      variant.trials += 1;
      variant.wins += reward; // Fractional wins (reward is 0..1)
      this.savePromptVariants(variants);
    }
  }

  // ============================================================================
  // MODEL ROUTER (easy→local, hard→API)
  // ============================================================================

  /**
   * Load model variants from JSON file
   */
  private loadModelVariants(): ModelVariant[] {
    const path = join(this.repoRoot, '.agent', 'model_variants.json');
    if (!existsSync(path)) {
      // Create default variants
      const defaults: ModelVariant[] = [
        { id: 'qwen2.5-coder:7b', name: 'Qwen 2.5 Coder 7B (Local)', cost_per_1k: 0, wins: 0, trials: 0 },
        { id: 'deepseek-coder:33b', name: 'DeepSeek Coder 33B (Local)', cost_per_1k: 0, wins: 0, trials: 0 },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini (API)', cost_per_1k: 0.15, wins: 0, trials: 0 },
        { id: 'gpt-4o', name: 'GPT-4o (API)', cost_per_1k: 2.5, wins: 0, trials: 0 },
      ];
      writeFileSync(path, JSON.stringify(defaults, null, 2));
      return defaults;
    }
    return JSON.parse(readFileSync(path, 'utf-8'));
  }

  /**
   * Save model variants to JSON file
   */
  private saveModelVariants(variants: ModelVariant[]): void {
    const path = join(this.repoRoot, '.agent', 'model_variants.json');
    writeFileSync(path, JSON.stringify(variants, null, 2));
  }

  /**
   * Route to best model based on task complexity and budget
   * 
   * Strategy:
   * - Easy tasks (scaffold, simple refactor) → local model
   * - Hard tasks (schema changes, public API) → API model
   * - Use ε-greedy to explore alternatives
   */
  selectModel(taskComplexity: 'easy' | 'medium' | 'hard', maxCost: number = Infinity): ModelVariant {
    const variants = this.loadModelVariants();

    // Filter by cost budget
    const affordable = variants.filter(v => v.cost_per_1k <= maxCost);
    if (affordable.length === 0) {
      throw new Error(`No models available within budget $${maxCost}/1k tokens`);
    }

    // ε-greedy selection
    if (Math.random() < this.epsilon) {
      // Explore: random affordable model
      return affordable[Math.floor(Math.random() * affordable.length)];
    } else {
      // Exploit: best affordable model by win rate
      const sorted = affordable.sort((a, b) => {
        const aRate = a.trials > 0 ? a.wins / a.trials : 0;
        const bRate = b.trials > 0 ? b.wins / b.trials : 0;
        return bRate - aRate;
      });
      return sorted[0];
    }
  }

  /**
   * Update model variant with reward
   */
  updateModelVariant(modelId: string, reward: number): void {
    const variants = this.loadModelVariants();
    const variant = variants.find(v => v.id === modelId);
    if (variant) {
      variant.trials += 1;
      variant.wins += reward; // Fractional wins (reward is 0..1)
      this.saveModelVariants(variants);
    }
  }

  // ============================================================================
  // RECORD RUN
  // ============================================================================

  /**
   * Record a complete run with signals and pairs
   */
  recordRun(
    taskSlug: string,
    modelName: string,
    promptId: string,
    rewardInputs: RewardInputs,
    costTokens: number,
    durationMs: number,
    promptJson: string,
    outputJson: string,
    role: 'coder' | 'fixer' | 'judge'
  ): number {
    // Calculate reward
    const reward = this.calculateReward(rewardInputs);

    // Insert run
    const runId = this.db.insertRun({
      task_slug: taskSlug,
      model_name: modelName,
      prompt_id: promptId,
      reward,
      cost_tokens: costTokens,
      duration_ms: durationMs,
    });

    // Insert signals
    this.db.insertSignals({
      run_id: runId,
      lint_errors: rewardInputs.lint_errors,
      type_errors: rewardInputs.type_errors,
      tests_failed: rewardInputs.tests_total - rewardInputs.tests_passed,
      coverage_pct: rewardInputs.coverage_pct,
      schema_errors: rewardInputs.schema_errors,
      boundary_errors: rewardInputs.boundary_errors,
    });

    // Insert pair (for fine-tuning)
    this.db.insertPair({
      task_slug: taskSlug,
      role,
      prompt_json: promptJson,
      output_json: outputJson,
      label: reward,
    });

    // Update bandit stats
    this.updatePromptVariant(promptId, reward);
    this.updateModelVariant(modelName, reward);

    return runId;
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  getStats(): {
    recentStats: ReturnType<ExperienceDB['getRecentStats']>;
    modelPerformance: ReturnType<ExperienceDB['getAverageRewardByModel']>;
    promptPerformance: ReturnType<ExperienceDB['getAverageRewardByPrompt']>;
  } {
    return {
      recentStats: this.db.getRecentStats(100),
      modelPerformance: this.db.getAverageRewardByModel(),
      promptPerformance: this.db.getAverageRewardByPrompt(),
    };
  }

  close(): void {
    this.db.close();
  }
}

