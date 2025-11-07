#!/usr/bin/env node
/**
 * Generate all cognitive framework implementations
 * Based on framework-devils-advocate.ts pattern
 */

import fs from 'fs';
import path from 'path';

const FRAMEWORKS = [
  {
    name: 'swot',
    displayName: 'SWOT Analysis',
    description: 'Analyze Strengths, Weaknesses, Opportunities, and Threats',
    steps: 4,
    stepGuide: [
      '1. **Strengths** - What advantages do you have?',
      '2. **Weaknesses** - What areas need improvement?',
      '3. **Opportunities** - What external factors can you leverage?',
      '4. **Threats** - What external risks should you prepare for?'
    ]
  },
  {
    name: 'first_principles',
    displayName: 'First Principles',
    description: 'Break down complex problems to fundamental truths',
    steps: 5,
    stepGuide: [
      '1. **Identify the Problem** - What are you trying to solve?',
      '2. **Break Down Assumptions** - What do you believe to be true?',
      '3. **Identify Fundamentals** - What are the basic truths?',
      '4. **Rebuild from Scratch** - How would you solve this from first principles?',
      '5. **Compare Approaches** - How does this differ from conventional wisdom?'
    ]
  },
  {
    name: 'root_cause',
    displayName: 'Root Cause Analysis',
    description: 'Use 5 Whys technique to find underlying causes',
    steps: 5,
    stepGuide: [
      '1. **Why #1** - Why did this problem occur?',
      '2. **Why #2** - Why did that cause happen?',
      '3. **Why #3** - Why did that deeper cause happen?',
      '4. **Why #4** - Why did that even deeper cause happen?',
      '5. **Why #5** - What is the root cause?'
    ]
  },
  {
    name: 'premortem',
    displayName: 'Premortem Analysis',
    description: 'Imagine project failure and work backward',
    steps: 5,
    stepGuide: [
      '1. **Imagine Failure** - The project has failed. What happened?',
      '2. **Identify Failure Modes** - What were the specific ways it failed?',
      '3. **Trace Causes** - What led to each failure mode?',
      '4. **Assess Likelihood** - How likely is each failure mode?',
      '5. **Plan Mitigations** - How can you prevent each failure?'
    ]
  },
  {
    name: 'critical_thinking',
    displayName: 'Critical Thinking',
    description: 'Evaluate arguments, evidence, and logical reasoning',
    steps: 5,
    stepGuide: [
      '1. **Identify Claims** - What is being claimed?',
      '2. **Evaluate Evidence** - What evidence supports the claims?',
      '3. **Check Logic** - Is the reasoning sound?',
      '4. **Identify Biases** - What biases might be present?',
      '5. **Draw Conclusions** - What can you conclude?'
    ]
  },
  {
    name: 'lateral_thinking',
    displayName: 'Lateral Thinking',
    description: 'Generate creative, non-obvious solutions',
    steps: 5,
    stepGuide: [
      '1. **Reframe the Problem** - How else could you look at this?',
      '2. **Challenge Assumptions** - What if the opposite were true?',
      '3. **Random Input** - What unrelated concepts could apply?',
      '4. **Provocation** - What impossible ideas spark new thinking?',
      '5. **Harvest Ideas** - What practical solutions emerged?'
    ]
  },
  {
    name: 'red_team',
    displayName: 'Red Team',
    description: 'Attack the plan/design to find vulnerabilities',
    steps: 5,
    stepGuide: [
      '1. **Identify Attack Surface** - What can be attacked?',
      '2. **Find Weaknesses** - Where are the vulnerabilities?',
      '3. **Plan Attacks** - How would you exploit each weakness?',
      '4. **Assess Impact** - What damage could each attack cause?',
      '5. **Prioritize Risks** - Which attacks are most dangerous?'
    ]
  },
  {
    name: 'blue_team',
    displayName: 'Blue Team',
    description: 'Defend against attacks and strengthen the plan',
    steps: 5,
    stepGuide: [
      '1. **Review Threats** - What attacks are possible?',
      '2. **Design Defenses** - How can you prevent each attack?',
      '3. **Implement Controls** - What specific controls are needed?',
      '4. **Test Defenses** - How will you verify they work?',
      '5. **Monitor & Respond** - How will you detect and respond to attacks?'
    ]
  },
  {
    name: 'decision_matrix',
    displayName: 'Decision Matrix',
    description: 'Weighted decision-making for comparing options',
    steps: 5,
    stepGuide: [
      '1. **List Options** - What are the choices?',
      '2. **Define Criteria** - What factors matter?',
      '3. **Assign Weights** - How important is each criterion?',
      '4. **Score Options** - How does each option rate on each criterion?',
      '5. **Calculate & Decide** - Which option has the highest weighted score?'
    ]
  },
  {
    name: 'socratic',
    displayName: 'Socratic Questioning',
    description: 'Deep inquiry through probing questions',
    steps: 5,
    stepGuide: [
      '1. **Clarify Concepts** - What do you mean by that?',
      '2. **Probe Assumptions** - What are you assuming?',
      '3. **Probe Reasons** - Why do you think that?',
      '4. **Consider Implications** - What follows from that?',
      '5. **Question the Question** - Why is this question important?'
    ]
  },
  {
    name: 'systems_thinking',
    displayName: 'Systems Thinking',
    description: 'Understand interconnections and feedback loops',
    steps: 5,
    stepGuide: [
      '1. **Identify Components** - What are the parts of the system?',
      '2. **Map Connections** - How do the parts interact?',
      '3. **Find Feedback Loops** - What reinforces or balances?',
      '4. **Identify Leverage Points** - Where can small changes have big impact?',
      '5. **Predict Behavior** - How will the system evolve?'
    ]
  },
  {
    name: 'scenario_planning',
    displayName: 'Scenario Planning',
    description: 'Explore multiple possible futures',
    steps: 4,
    stepGuide: [
      '1. **Identify Uncertainties** - What key factors are uncertain?',
      '2. **Create Scenarios** - What are plausible future states?',
      '3. **Analyze Implications** - What happens in each scenario?',
      '4. **Plan Responses** - How will you adapt to each scenario?'
    ]
  },
  {
    name: 'brainstorming',
    displayName: 'Brainstorming',
    description: 'Generate many ideas quickly without judgment',
    steps: 3,
    stepGuide: [
      '1. **Generate Ideas** - List as many ideas as possible (no judgment)',
      '2. **Build on Ideas** - Combine and improve ideas',
      '3. **Select Best** - Which ideas are most promising?'
    ]
  },
  {
    name: 'mind_mapping',
    displayName: 'Mind Mapping',
    description: 'Visual organization of ideas and concepts',
    steps: 4,
    stepGuide: [
      '1. **Central Concept** - What is the main idea?',
      '2. **Main Branches** - What are the key themes?',
      '3. **Sub-Branches** - What details support each theme?',
      '4. **Connections** - How do ideas relate across branches?'
    ]
  },
];

const template = (framework) => `/**
 * ${framework.displayName} Framework
 * Stateful framework that guides the primary agent through ${framework.description.toLowerCase()}
 * Based on Sequential Thinking pattern
 */

import { CognitiveFramework, type FrameworkInit, type FrameworkStepInput } from '../lib/framework-base.js';
import type { ServerContext } from '../lib/context.js';

class ${framework.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Framework extends CognitiveFramework {
  protected frameworkName = 'framework_${framework.name}';
  protected frameworkDescription = '${framework.description}';
  
  protected formatInitResponse(
    problem: string,
    context: string,
    totalSteps: number,
    evidence: any[]
  ): string {
    return \`# ${framework.displayName} Framework - Session Initialized

**Problem:** \${problem}
**Context:** \${context || 'None provided'}
**Total Steps:** \${totalSteps}
**Evidence Gathered:** \${evidence.length} items

## Evidence from Codebase

\${evidence.slice(0, 5).map((e, i) => \`\${i + 1}. **\${e.path}** (relevance: \${e.score.toFixed(2)})
   \\\`\\\`\\\`
   \${e.snippet.slice(0, 200)}...
   \\\`\\\`\\\`\`).join('\\n\\n')}

\${evidence.length > 5 ? \`\\n*...and \${evidence.length - 5} more items*\` : ''}

## Framework Guide

Use this framework to systematically analyze through \${totalSteps} steps:

**Suggested Approach:**
${framework.stepGuide.map(s => `${s}`).join('\n')}

For each step, provide:
- Step number
- Your analysis for this step
- Whether another step is needed

The framework will track your progress and maintain context.
\`;
  }
}

const framework = new ${framework.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Framework();

export const ${framework.name}Descriptor = {
  name: 'framework_${framework.name}',
  description: '${framework.description}. Stateful framework that guides you through systematic analysis.',
  inputSchema: {
    type: 'object' as const,
    additionalProperties: false,
    properties: {
      problem: { type: 'string' as const, description: 'The problem or question to analyze' },
      context: { type: 'string' as const, description: 'Additional context' },
      totalSteps: { type: 'number' as const, description: 'Expected number of steps (default: ${framework.steps})' },
      stepNumber: { type: 'number' as const, description: 'Current step number (for recording steps)' },
      content: { type: 'string' as const, description: 'Your analysis for this step' },
      nextStepNeeded: { type: 'boolean' as const, description: 'Whether another step is needed' },
      metadata: { type: 'object' as const, description: 'Optional metadata', additionalProperties: true }
    }
  }
};

export async function ${framework.name}Tool(args: any, ctx: ServerContext): Promise<any> {
  return framework.handle(args, ctx);
}
`;

console.log(`\n🔧 Generating ${FRAMEWORKS.length} cognitive framework implementations\n`);

const outputDir = path.join(process.cwd(), 'packages/thinking-tools-mcp/src/tools');

for (const framework of FRAMEWORKS) {
  const filename = `framework-${framework.name.replace(/_/g, '-')}.ts`;
  const filepath = path.join(outputDir, filename);
  const content = template(framework);
  
  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`✅ Created ${filename}`);
}

console.log(`\n✅ Generated ${FRAMEWORKS.length} framework files`);
console.log(`\n⚠️  Next steps:`);
console.log(`   1. Import all frameworks in index.ts`);
console.log(`   2. Register all frameworks in registry`);
console.log(`   3. Build and test`);
console.log(`   4. Update CHANGELOG\n`);

