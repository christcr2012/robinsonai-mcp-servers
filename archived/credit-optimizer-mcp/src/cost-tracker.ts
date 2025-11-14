/**
 * Cost Tracker
 * Tracks costs in real-time during workflow execution
 * Integrates with DatabaseManager for learning algorithm
 */

import { DatabaseManager } from './database.js';

export interface CostRecord {
  taskId: string;
  taskType: string;
  estimatedCost: number;
  actualCost: number;
  workerUsed: 'ollama' | 'openai';
  linesOfCode?: number;
  numFiles?: number;
  complexity?: 'simple' | 'medium' | 'complex';
  startTime: number;
  endTime?: number;
}

export class CostTracker {
  private db: DatabaseManager;
  private activeTasks: Map<string, CostRecord>;

  constructor(db: DatabaseManager) {
    this.db = db;
    this.activeTasks = new Map();
  }

  /**
   * Start tracking a new task
   */
  startTask(record: Omit<CostRecord, 'startTime' | 'endTime' | 'actualCost'>): void {
    const taskRecord: CostRecord = {
      ...record,
      actualCost: 0,
      startTime: Date.now(),
    };

    this.activeTasks.set(record.taskId, taskRecord);
  }

  /**
   * Update actual cost during task execution
   */
  updateCost(taskId: string, additionalCost: number): void {
    const task = this.activeTasks.get(taskId);
    if (task) {
      task.actualCost += additionalCost;
    }
  }

  /**
   * Complete task and record to database
   */
  completeTask(taskId: string): CostRecord | null {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      return null;
    }

    task.endTime = Date.now();

    // Record to database for learning algorithm
    this.db.recordCostHistory({
      taskId: task.taskId,
      taskType: task.taskType,
      estimatedCost: task.estimatedCost,
      actualCost: task.actualCost,
      workerUsed: task.workerUsed,
      linesOfCode: task.linesOfCode,
      numFiles: task.numFiles,
      complexity: task.complexity,
    });

    // Record learning metric
    const accuracy = 1 - Math.abs(task.actualCost - task.estimatedCost) / task.estimatedCost;
    this.db.recordLearningMetric('cost_accuracy', accuracy, {
      taskType: task.taskType,
      workerUsed: task.workerUsed,
    });

    this.activeTasks.delete(taskId);
    return task;
  }

  /**
   * Get improved estimate using learning algorithm
   */
  getImprovedEstimate(taskType: string, baseEstimate: number): number {
    return this.db.improveEstimate(taskType, baseEstimate);
  }

  /**
   * Get cost accuracy metrics
   */
  getCostAccuracy(): any {
    return this.db.getCostAccuracy();
  }

  /**
   * Get cost savings report
   */
  getCostSavings(period: string = 'all'): any {
    return this.db.getCostSavings(period);
  }

  /**
   * Get active tasks
   */
  getActiveTasks(): CostRecord[] {
    return Array.from(this.activeTasks.values());
  }

  /**
   * Estimate cost for a task using historical data
   */
  estimateCost(params: {
    taskType: string;
    linesOfCode?: number;
    numFiles?: number;
    complexity?: 'simple' | 'medium' | 'complex';
  }): { baseEstimate: number; improvedEstimate: number; confidence: number } {
    const { taskType, linesOfCode = 0, numFiles = 0, complexity = 'medium' } = params;

    // Base estimation logic (simplified)
    let baseEstimate = 0;

    // Complexity multipliers
    const complexityMultiplier = {
      simple: 0.5,
      medium: 1.0,
      complex: 2.0,
    };

    // Estimate based on lines of code
    if (linesOfCode > 0) {
      baseEstimate += linesOfCode * 0.0001; // $0.0001 per line
    }

    // Estimate based on number of files
    if (numFiles > 0) {
      baseEstimate += numFiles * 0.01; // $0.01 per file
    }

    // Apply complexity multiplier
    baseEstimate *= complexityMultiplier[complexity];

    // Get improved estimate using learning algorithm
    const improvedEstimate = this.getImprovedEstimate(taskType, baseEstimate);

    // Calculate confidence based on historical data
    const history = this.db.getCostHistory(taskType, 100);
    const confidence = Math.min(history.length / 10, 1.0); // Max confidence at 10+ samples

    return {
      baseEstimate,
      improvedEstimate,
      confidence,
    };
  }

  /**
   * Recommend worker based on cost and quality
   */
  recommendWorker(params: {
    taskType: string;
    maxCost?: number;
    minQuality?: 'basic' | 'standard' | 'premium';
  }): { worker: 'ollama' | 'openai'; reason: string; estimatedCost: number } {
    const { taskType, maxCost = Infinity, minQuality = 'standard' } = params;

    // Ollama is always free
    const ollamaEstimate = 0;

    // Get OpenAI estimate
    const openaiEstimate = this.estimateCost({ taskType });

    // Quality tiers
    const qualityMap = {
      ollama: 'standard',
      openai: 'premium',
    };

    // If max cost is 0, must use Ollama
    if (maxCost === 0) {
      return {
        worker: 'ollama',
        reason: 'Budget constraint: $0 max cost',
        estimatedCost: ollamaEstimate,
      };
    }

    // If OpenAI estimate is within budget and quality requirement met
    if (openaiEstimate.improvedEstimate <= maxCost) {
      if (minQuality === 'premium') {
        return {
          worker: 'openai',
          reason: 'Premium quality required',
          estimatedCost: openaiEstimate.improvedEstimate,
        };
      }
    }

    // Default to Ollama (free)
    return {
      worker: 'ollama',
      reason: 'Cost optimization: Ollama is free',
      estimatedCost: ollamaEstimate,
    };
  }

  /**
   * Get cost analytics dashboard
   */
  getDashboard(): any {
    const accuracy = this.getCostAccuracy();
    const savings = this.getCostSavings('all');
    const activeTasks = this.getActiveTasks();

    return {
      accuracy,
      savings,
      activeTasks: activeTasks.length,
      totalTasksTracked: this.db.getCostHistory().length,
      learningMetrics: this.db.getLearningMetrics('cost_accuracy', 'week'),
    };
  }
}

