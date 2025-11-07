/**
 * Second-Order Thinking Framework
 * Stateful framework that guides the primary agent through consider consequences of consequences
 * Based on Sequential Thinking pattern
 */

import { CognitiveFramework, type FrameworkInit, type FrameworkStepInput } from '../lib/framework-base.js';
import type { ServerContext } from '../lib/context.js';

class SecondOrderThinkingFramework extends CognitiveFramework {
  protected frameworkName = 'framework_second_order_thinking';
  protected frameworkDescription = 'Consider consequences of consequences';
  
  protected formatInitResponse(
    problem: string,
    context: string,
    totalSteps: number,
    evidence: any[]
  ): string {
    return `# Second-Order Thinking Framework - Session Initialized

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
1. **First-Order Effect** - What is the immediate consequence?
2. **Second-Order Effect** - What happens as a result of that?
3. **Third-Order Effect** - What happens next?
4. **Long-Term Impact** - What are the ultimate consequences?
5. **Unintended Consequences** - What unexpected effects might occur?

For each step, provide:
- Step number
- Your analysis for this step
- Whether another step is needed

The framework will track your progress and maintain context.
`;
  }
}

const framework = new SecondOrderThinkingFramework();

// Use camelCase for exports to match import convention
const camelName = 'second_order_thinking'.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

export const secondOrderThinkingDescriptor = {
  name: 'framework_second_order_thinking',
  description: 'Consider consequences of consequences. Stateful framework that guides you through systematic analysis.',
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

export async function secondOrderThinkingTool(args: any, ctx: ServerContext): Promise<any> {
  return framework.handle(args, ctx);
}
