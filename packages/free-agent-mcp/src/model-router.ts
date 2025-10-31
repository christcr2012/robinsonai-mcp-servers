/**
 * Model Router
 * 
 * Routes tasks to the appropriate model based on complexity:
 * - Simple tasks → Fast 3B router model (10x faster!)
 * - Medium tasks → Balanced 34B model
 * - Complex tasks → Best quality 33B model
 */

export interface Task {
  type: 'generation' | 'analysis' | 'refactor' | 'test' | 'review';
  complexity: 'simple' | 'medium' | 'complex';
  description: string;
  estimatedTokens?: number;
  context?: {
    fileCount?: number;
    linesOfCode?: number;
    dependencies?: string[];
  };
}

export interface ModelSelection {
  model: string;
  reason: string;
  estimatedTime: number; // seconds
  estimatedCredits: number;
}

export class ModelRouter {
  /**
   * Route a task to the best model
   */
  route(task: Task): ModelSelection {
    // Analyze task complexity
    const complexity = this.analyzeComplexity(task);
    
    // Select model based on complexity
    switch (complexity) {
      case 'simple':
        return {
          model: 'qwen2.5:3b',
          reason: 'Fast router model for simple scaffolding/intent',
          estimatedTime: 5,  // 5 seconds
          estimatedCredits: 0, // FREE!
        };
      
      case 'complex':
        return {
          model: 'deepseek-coder:33b',
          reason: 'Best quality model for complex algorithms/architecture',
          estimatedTime: 45, // 45 seconds
          estimatedCredits: 0, // FREE!
        };
      
      case 'medium':
      default:
        return {
          model: 'codellama:34b',
          reason: 'Balanced model for refactoring/tests',
          estimatedTime: 25, // 25 seconds
          estimatedCredits: 0, // FREE!
        };
    }
  }

  /**
   * Analyze task complexity
   */
  private analyzeComplexity(task: Task): 'simple' | 'medium' | 'complex' {
    // If explicitly set, use it
    if (task.complexity) {
      return task.complexity;
    }

    // Analyze based on task type and context
    const { type, context, estimatedTokens } = task;

    // Simple tasks
    if (
      type === 'generation' &&
      (!context?.fileCount || context.fileCount <= 1) &&
      (!estimatedTokens || estimatedTokens < 500)
    ) {
      return 'simple';
    }

    // Complex tasks
    if (
      type === 'refactor' ||
      type === 'analysis' ||
      (context?.fileCount && context.fileCount > 5) ||
      (estimatedTokens && estimatedTokens > 2000)
    ) {
      return 'complex';
    }

    // Default to medium
    return 'medium';
  }

  /**
   * Estimate task complexity from description
   */
  estimateComplexity(description: string): 'simple' | 'medium' | 'complex' {
    const lower = description.toLowerCase();

    // Simple indicators
    const simpleKeywords = [
      'create component',
      'add button',
      'simple function',
      'hello world',
      'basic',
      'scaffold',
      'boilerplate',
    ];

    // Complex indicators
    const complexKeywords = [
      'algorithm',
      'optimize',
      'refactor',
      'architecture',
      'design pattern',
      'performance',
      'security',
      'distributed',
      'concurrent',
    ];

    // Check for simple
    if (simpleKeywords.some(keyword => lower.includes(keyword))) {
      return 'simple';
    }

    // Check for complex
    if (complexKeywords.some(keyword => lower.includes(keyword))) {
      return 'complex';
    }

    // Default to medium
    return 'medium';
  }

  /**
   * Get model recommendations for a task
   */
  getRecommendations(task: Task): ModelSelection[] {
    const primary = this.route(task);
    
    const recommendations: ModelSelection[] = [primary];

    // Add alternatives
    if (primary.model === 'qwen2.5:3b') {
      recommendations.push({
        model: 'llama3.2:3b',
        reason: 'Alternative fast router model',
        estimatedTime: 5,
        estimatedCredits: 0,
      });
      recommendations.push({
        model: 'qwen2.5-coder:32b',
        reason: 'Upgrade for better quality',
        estimatedTime: 15,
        estimatedCredits: 0,
      });
    } else if (primary.model === 'deepseek-coder:33b') {
      recommendations.push({
        model: 'codellama:34b',
        reason: 'Faster alternative with good quality',
        estimatedTime: 25,
        estimatedCredits: 0,
      });
    } else {
      recommendations.push({
        model: 'deepseek-coder:33b',
        reason: 'Upgrade for best quality',
        estimatedTime: 45,
        estimatedCredits: 0,
      });
      recommendations.push({
        model: 'qwen2.5:3b',
        reason: 'Downgrade for faster results',
        estimatedTime: 5,
        estimatedCredits: 0,
      });
    }

    return recommendations;
  }

  /**
   * Format routing decision for display
   */
  formatDecision(selection: ModelSelection): string {
    return `
🎯 Model Selection:
  • Model: ${selection.model}
  • Reason: ${selection.reason}
  • Est. Time: ${selection.estimatedTime}s
  • Credits: ${selection.estimatedCredits} (FREE!)
    `.trim();
  }
}

