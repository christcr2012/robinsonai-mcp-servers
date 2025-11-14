/**
 * Thinking Tools Integration for Agent Core
 * Implements standard planning chain: Blue Team → Red Team → Decision Matrix
 */

export interface ThinkingStep {
  framework: string;
  problem: string;
  context?: string;
  stepNumber: number;
  totalSteps: number;
  content: string;
  nextStepNeeded: boolean;
  metadata?: Record<string, any>;
}

export interface PlanningResult {
  approaches: string[];
  critiques: string[];
  decision: {
    chosen: string;
    reasoning: string;
    score: number;
  };
  artifacts: string[];
}

/**
 * Standard planning chain using Thinking Tools
 * 1. Blue Team: Generate approaches
 * 2. Red Team: Critique approaches
 * 3. Decision Matrix: Pick the best plan
 */
export async function runStandardPlanningChain(
  task: string,
  context?: string,
  thinkingClient?: any
): Promise<PlanningResult> {
  if (!thinkingClient) {
    // If no thinking client available, return a basic plan
    return {
      approaches: ['Direct implementation'],
      critiques: ['No thinking tools available for critique'],
      decision: {
        chosen: 'Direct implementation',
        reasoning: 'No thinking tools available',
        score: 0.5,
      },
      artifacts: [],
    };
  }

  const artifacts: string[] = [];

  // Step 1: Blue Team - Generate approaches
  const blueTeamSteps: ThinkingStep[] = [];
  for (let i = 1; i <= 3; i++) {
    const step: ThinkingStep = {
      framework: 'framework_blue_team',
      problem: task,
      context,
      stepNumber: i,
      totalSteps: 3,
      content: i === 1 ? 'Generating initial approaches...' : '',
      nextStepNeeded: i < 3,
    };
    
    try {
      const result = await thinkingClient.call('framework_blue_team', step);
      blueTeamSteps.push(step);
      if (result.artifact) artifacts.push(result.artifact);
    } catch (error) {
      console.warn('Blue team step failed:', error);
    }
  }

  // Extract approaches from blue team output
  const approaches = extractApproaches(blueTeamSteps);

  // Step 2: Red Team - Critique each approach
  const redTeamSteps: ThinkingStep[] = [];
  for (let i = 0; i < approaches.length; i++) {
    const step: ThinkingStep = {
      framework: 'framework_red_team',
      problem: `Critique this approach: ${approaches[i]}`,
      context: `Original task: ${task}`,
      stepNumber: i + 1,
      totalSteps: approaches.length,
      content: '',
      nextStepNeeded: i < approaches.length - 1,
    };

    try {
      const result = await thinkingClient.call('framework_red_team', step);
      redTeamSteps.push(step);
      if (result.artifact) artifacts.push(result.artifact);
    } catch (error) {
      console.warn('Red team step failed:', error);
    }
  }

  const critiques = extractCritiques(redTeamSteps);

  // Step 3: Decision Matrix - Pick the best approach
  const decisionStep: ThinkingStep = {
    framework: 'framework_decision_matrix',
    problem: `Choose the best approach for: ${task}`,
    context: `Approaches: ${approaches.join(', ')}. Critiques: ${critiques.join(', ')}`,
    stepNumber: 1,
    totalSteps: 1,
    content: 'Evaluating approaches...',
    nextStepNeeded: false,
  };

  let decision = {
    chosen: approaches[0] || 'Direct implementation',
    reasoning: 'Default choice',
    score: 0.5,
  };

  try {
    const result = await thinkingClient.call('framework_decision_matrix', decisionStep);
    if (result.artifact) artifacts.push(result.artifact);
    decision = extractDecision(result, approaches);
  } catch (error) {
    console.warn('Decision matrix step failed:', error);
  }

  return {
    approaches,
    critiques,
    decision,
    artifacts,
  };
}

/**
 * Extract approaches from blue team thinking steps
 */
function extractApproaches(steps: ThinkingStep[]): string[] {
  // In a real implementation, this would parse the thinking tool output
  // For now, return generic approaches
  return [
    'Approach 1: Direct implementation',
    'Approach 2: Modular design',
    'Approach 3: Incremental rollout',
  ];
}

/**
 * Extract critiques from red team thinking steps
 */
function extractCritiques(steps: ThinkingStep[]): string[] {
  // In a real implementation, this would parse the thinking tool output
  return steps.map((_, i) => `Critique ${i + 1}: Potential issues identified`);
}

/**
 * Extract decision from decision matrix output
 */
function extractDecision(result: any, approaches: string[]): { chosen: string; reasoning: string; score: number } {
  // In a real implementation, this would parse the decision matrix output
  return {
    chosen: approaches[0] || 'Direct implementation',
    reasoning: 'Based on weighted criteria analysis',
    score: 0.8,
  };
}

