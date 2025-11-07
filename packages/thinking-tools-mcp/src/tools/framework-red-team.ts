/**
 * Red Team Framework
 * Stateful framework that guides the primary agent through attack the plan/design to find vulnerabilities
 * Based on Sequential Thinking pattern
 */

import { CognitiveFramework, type FrameworkInit, type FrameworkStepInput } from '../lib/framework-base.js';
import type { ServerContext } from '../lib/context.js';

class RedTeamFramework extends CognitiveFramework {
  protected frameworkName = 'framework_red_team';
  protected frameworkDescription = 'Attack the plan/design to find vulnerabilities';
  
  protected formatInitResponse(
    problem: string,
    context: string,
    totalSteps: number,
    evidence: any[]
  ): string {
    return `# Red Team Framework - Session Initialized

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
1. **Identify Attack Surface** - What can be attacked?
2. **Find Weaknesses** - Where are the vulnerabilities?
3. **Plan Attacks** - How would you exploit each weakness?
4. **Assess Impact** - What damage could each attack cause?
5. **Prioritize Risks** - Which attacks are most dangerous?

For each step, provide:
- Step number
- Your analysis for this step
- Whether another step is needed

The framework will track your progress and maintain context.
`;
  }
}

const framework = new RedTeamFramework();

// Use camelCase for exports to match import convention
const camelName = 'red_team'.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

export const redTeamDescriptor = {
  name: 'framework_red_team',
  description: 'Attack the plan/design to find vulnerabilities. Stateful framework that guides you through systematic analysis.',
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

export async function redTeamTool(args: any, ctx: ServerContext): Promise<any> {
  return framework.handle(args, ctx);
}
