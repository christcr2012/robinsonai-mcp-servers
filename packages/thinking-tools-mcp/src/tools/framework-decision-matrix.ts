/**
 * Decision Matrix Framework
 * Stateful framework that guides the primary agent through weighted decision-making for comparing options
 * Based on Sequential Thinking pattern
 */

import { CognitiveFramework, type FrameworkInit, type FrameworkStepInput } from '../lib/framework-base.js';
import type { ServerContext } from '../lib/context.js';

class DecisionMatrixFramework extends CognitiveFramework {
  protected frameworkName = 'framework_decision_matrix';
  protected frameworkDescription = 'Weighted decision-making for comparing options';
  
  protected formatInitResponse(
    problem: string,
    context: string,
    totalSteps: number,
    evidence: any[]
  ): string {
    return `# Decision Matrix Framework - Session Initialized

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
1. **List Options** - What are the choices?
2. **Define Criteria** - What factors matter?
3. **Assign Weights** - How important is each criterion?
4. **Score Options** - How does each option rate on each criterion?
5. **Calculate & Decide** - Which option has the highest weighted score?

For each step, provide:
- Step number
- Your analysis for this step
- Whether another step is needed

The framework will track your progress and maintain context.
`;
  }
}

const framework = new DecisionMatrixFramework();

// Use camelCase for exports to match import convention
const camelName = 'decision_matrix'.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

export const decisionMatrixDescriptor = {
  name: 'framework_decision_matrix',
  description: 'Weighted decision-making for comparing options. Stateful framework that guides you through systematic analysis.',
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

export async function decisionMatrixTool(args: any, ctx: ServerContext): Promise<any> {
  return framework.handle(args, ctx);
}
