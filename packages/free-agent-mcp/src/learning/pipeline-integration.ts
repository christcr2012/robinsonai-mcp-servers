#!/usr/bin/env node
/**
 * Pipeline Integration - Hook learning system into agent pipeline
 * 
 * This module provides easy integration points for the main agent pipeline
 * to automatically record runs and trigger learning automation.
 */

import { AutoLearner, RunResult } from './auto-learner.js';
import { LearningLoop } from './learning-loop.js';
import { WebKnowledge } from './web-knowledge.js';
import { loadLearningConfig } from './config.js';

export class LearningPipeline {
  private learner: AutoLearner;
  private loop: LearningLoop;
  private web: WebKnowledge;
  private repoRoot: string;

  constructor(repoRoot: string) {
    this.repoRoot = repoRoot;
    this.learner = new AutoLearner(repoRoot);
    this.loop = new LearningLoop(repoRoot);
    this.web = new WebKnowledge(repoRoot);
  }

  /**
   * Select best prompt variant using bandit
   */
  selectPrompt() {
    return this.loop.selectPromptVariant();
  }

  /**
   * Select best model using router
   */
  selectModel(taskComplexity: 'easy' | 'medium' | 'hard', maxCost: number = Infinity) {
    return this.loop.selectModel(taskComplexity, maxCost);
  }

  /**
   * Fetch web knowledge if enabled in design card
   */
  async fetchWebKnowledge(designCard: any, query: string, library?: string): Promise<string> {
    if (!this.web.isWebEnabled(designCard)) {
      return '';
    }

    const pages = await this.web.searchDocs(query, library);
    return this.web.formatForPrompt(pages);
  }

  /**
   * Record a run after execution
   */
  async recordRun(
    taskSlug: string,
    modelName: string,
    promptId: string,
    result: RunResult,
    role: 'coder' | 'fixer' | 'judge' = 'coder',
    humanAccept?: boolean
  ): Promise<void> {
    await this.learner.recordRun(taskSlug, modelName, promptId, result, role, humanAccept);
  }

  /**
   * Get learning stats
   */
  getStats() {
    return this.learner.getStats();
  }

  /**
   * Close all connections
   */
  close(): void {
    this.learner.close();
    this.loop.close();
    this.web.close();
  }
}

/**
 * Example integration with agent pipeline
 */
export async function runAgentWithLearning(
  repoRoot: string,
  designCard: any,
  taskComplexity: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<any> {
  const learning = new LearningPipeline(repoRoot);

  try {
    // 1. Select prompt and model using bandit/router
    const prompt = learning.selectPrompt();
    const model = learning.selectModel(taskComplexity, 0.002); // Max $2/1M tokens

    console.log(`📝 Using prompt: ${prompt.name}`);
    console.log(`🤖 Using model: ${model.name}`);

    // 2. Fetch web knowledge if enabled
    const webKnowledge = await learning.fetchWebKnowledge(
      designCard,
      designCard.goals?.[0] || '',
      designCard.library
    );

    if (webKnowledge) {
      console.log(`🌐 Fetched web knowledge (${webKnowledge.length} chars)`);
    }

    // 3. Run agent (this is where you'd call your actual agent)
    const startTime = Date.now();
    
    // TODO: Replace with actual agent execution
    const result: RunResult = await executeAgent(designCard, prompt, model, webKnowledge);
    
    const duration = Date.now() - startTime;
    result.duration_ms = duration;

    // 4. Record run (triggers auto-export, auto-train, auto-deploy if thresholds met)
    await learning.recordRun(
      designCard.name,
      model.id,
      prompt.id,
      result,
      'coder',
      undefined // Human accept will be set later
    );

    // 5. Show stats
    const stats = learning.getStats();
    console.log(`\n📊 Learning Stats:`);
    console.log(`   Recent avg reward: ${stats.recentStats.avgReward.toFixed(2)}`);
    console.log(`   Recent avg cost: ${stats.recentStats.avgCost} tokens`);
    console.log(`   Recent avg duration: ${stats.recentStats.avgDuration}ms`);

    return result;
  } finally {
    learning.close();
  }
}

/**
 * Placeholder for actual agent execution
 * Replace this with your real agent pipeline
 */
async function executeAgent(
  designCard: any,
  prompt: any,
  model: any,
  webKnowledge: string
): Promise<RunResult> {
  // This is a placeholder - replace with actual agent execution
  // For now, return mock result
  return {
    compile_pass: true,
    lint_errors: 0,
    type_errors: 0,
    tests_passed: 10,
    tests_total: 10,
    coverage_pct: 85,
    schema_errors: 0,
    boundary_errors: 0,
    cost_tokens: 1000,
    duration_ms: 5000,
    prompt: {
      template: prompt.template,
      designCard,
      webKnowledge,
    },
    output: {
      files: [],
      patch: null,
    },
  };
}

/**
 * CLI for testing learning pipeline
 */
if (require.main === module) {
  (async () => {
    const repoRoot = process.cwd();
    
    // Mock design card
    const designCard = {
      name: 'test-task',
      goals: ['Add user authentication'],
      library: 'react',
      web: 'on',
    };

    console.log('🧪 Testing learning pipeline...\n');
    
    const result = await runAgentWithLearning(repoRoot, designCard, 'medium');
    
    console.log('\n✅ Test complete!');
    console.log('Result:', result);
  })();
}

