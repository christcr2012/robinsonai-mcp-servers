/**
 * Probabilistic Thinking Framework
 * Stateful framework that guides the primary agent through reason with uncertainty and probabilities
 * Based on Sequential Thinking pattern
 */

import { CognitiveFramework, type FrameworkInit, type FrameworkStepInput } from '../lib/framework-base.js';
import type { ServerContext } from '../lib/context.js';

class ProbabilisticThinkingFramework extends CognitiveFramework {
  protected frameworkName = 'framework_probabilistic_thinking';
  protected frameworkDescription = 'Reason with uncertainty and probabilities';
  
  protected formatInitResponse(
    problem: string,
    context: string,
    totalSteps: number,
    evidence: any[]
  ): string {
    return `# Probabilistic Thinking Framework - Session Initialized

**Problem:** ${problem}
**Context:** ${context || 'None provided'}
**Total Steps:** ${totalSteps}
**Evidence Gathered:** ${evidence.length} items

## Evidence from Codebase

${evidence.slice(0, 5).map((e, i) => `${i + 1}. **${e.path}** (relevance: ${e.score.toFixed(2)})
   \`\`\`
   ${e.snippet.slice(0, 200)}...
   \`\`\``).join('\n\n')}

${evidence.length > 5 ? `\n*...and ${evidence.length - 5} more items*` : ''}

## Framework Guide

Use this framework to systematically analyze through ${totalSteps} steps:

**Suggested Approach:**
1. **Identify Uncertainty** - What is uncertain?
2. **Estimate Probabilities** - What are the likelihoods?
3. **Consider Base Rates** - What does historical data say?
4. **Update Beliefs** - How does new evidence change probabilities?
5. **Make Decisions** - Choose based on expected value

For each step, provide:
- Step number
- Your analysis for this step
- Whether another step is needed

The framework will track your progress and maintain context.
`;
  }
}

const framework = new ProbabilisticThinkingFramework();

// Use camelCase for exports to match import convention
const camelName = 'probabilistic_thinking'.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

export const probabilisticThinkingDescriptor = {
  name: 'framework_probabilistic_thinking',
  description: 'Reason with uncertainty and probabilities. Stateful framework that guides you through systematic analysis.',
  inputSchema: {
    type: 'object' as const,
    additionalProperties: false,
    properties: {
      problem: { type: 'string' as const, description: 'The problem or question to analyze' },
      context: { type: 'string' as const, description: 'Additional context' },
      totalSteps: { type: 'number' as const, description: 'Expected number of steps (default: 5)' },
      stepNumber: { type: 'number' as const, description: 'Current step number (for recording steps)' },
      content: { type: 'string' as const, description: 'Your analysis for this step' },
      nextStepNeeded: { type: 'boolean' as const, description: 'Whether another step is needed' },
      metadata: { type: 'object' as const, description: 'Optional metadata', additionalProperties: true }
    }
  }
};

export async function probabilisticThinkingTool(args: any, ctx: ServerContext): Promise<any> {
  return framework.handle(args, ctx);
}
