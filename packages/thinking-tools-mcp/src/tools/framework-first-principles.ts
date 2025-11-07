/**
 * First Principles Framework
 * Stateful framework that guides the primary agent through break down complex problems to fundamental truths
 * Based on Sequential Thinking pattern
 */

import { CognitiveFramework, type FrameworkInit, type FrameworkStepInput } from '../lib/framework-base.js';
import type { ServerContext } from '../lib/context.js';

class FirstPrinciplesFramework extends CognitiveFramework {
  protected frameworkName = 'framework_first_principles';
  protected frameworkDescription = 'Break down complex problems to fundamental truths';
  
  protected formatInitResponse(
    problem: string,
    context: string,
    totalSteps: number,
    evidence: any[]
  ): string {
    return `# First Principles Framework - Session Initialized

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
1. **Identify the Problem** - What are you trying to solve?
2. **Break Down Assumptions** - What do you believe to be true?
3. **Identify Fundamentals** - What are the basic truths?
4. **Rebuild from Scratch** - How would you solve this from first principles?
5. **Compare Approaches** - How does this differ from conventional wisdom?

For each step, provide:
- Step number
- Your analysis for this step
- Whether another step is needed

The framework will track your progress and maintain context.
`;
  }
}

const framework = new FirstPrinciplesFramework();

export const first_principlesDescriptor = {
  name: 'framework_first_principles',
  description: 'Break down complex problems to fundamental truths. Stateful framework that guides you through systematic analysis.',
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

export async function first_principlesTool(args: any, ctx: ServerContext): Promise<any> {
  return framework.handle(args, ctx);
}
