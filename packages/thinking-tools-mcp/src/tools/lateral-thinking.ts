/**
 * Lateral Thinking Tool
 * Generate creative, non-obvious solutions by thinking "outside the box"
 * Enhanced with context search to find relevant code/docs
 */

import { withContext } from '../lib/context-enhancer.js';

export interface LateralThinkingInput {
  problem: string;
  context?: string;
  constraints?: string[];
  useContext?: boolean;
  contextQuery?: string;
}

export interface LateralThinkingOutput {
  unconventionalApproaches: Array<{ approach: string; rationale: string; novelty: number }>;
  analogies: Array<{ domain: string; analogy: string; application: string }>;
  reversals: string[];
  randomConnections: string[];
  provocativeIdeas: string[];
  confidence: number;
  reasoning: string;
}

export function lateralThinking(input: LateralThinkingInput): LateralThinkingOutput {
  const { problem, context = '', constraints = [] } = input;
  const combined = `${problem} ${context}`.toLowerCase();
  
  const unconventionalApproaches: Array<{ approach: string; rationale: string; novelty: number }> = [];
  const analogies: Array<{ domain: string; analogy: string; application: string }> = [];
  const reversals: string[] = [];
  const randomConnections: string[] = [];
  const provocativeIdeas: string[] = [];
  
  // Generate unconventional approaches based on problem domain
  if (combined.includes('performance') || combined.includes('slow')) {
    unconventionalApproaches.push({
      approach: 'Make it intentionally slower to improve UX',
      rationale: 'Add progress indicators and animations so users perceive it as responsive even if actual speed is same',
      novelty: 85
    });
    unconventionalApproaches.push({
      approach: 'Cache the problem, not the solution',
      rationale: 'Instead of caching results, cache the expensive computation inputs and batch process them',
      novelty: 70
    });
  }
  
  if (combined.includes('bug') || combined.includes('error')) {
    unconventionalApproaches.push({
      approach: 'Make the bug a feature',
      rationale: 'Sometimes unexpected behavior reveals a better UX - embrace it instead of fixing it',
      novelty: 90
    });
    unconventionalApproaches.push({
      approach: 'Let users fix it themselves',
      rationale: 'Expose the error state to power users with a "debug mode" that lets them patch it',
      novelty: 75
    });
  }
  
  if (combined.includes('scale') || combined.includes('growth')) {
    unconventionalApproaches.push({
      approach: 'Don\'t scale - limit growth instead',
      rationale: 'Artificial scarcity can increase value and reduce costs (invite-only, waitlist, etc.)',
      novelty: 95
    });
    unconventionalApproaches.push({
      approach: 'Scale down, not up',
      rationale: 'Reduce features to core value prop, serve niche better than trying to serve everyone',
      novelty: 80
    });
  }
  
  if (combined.includes('database') || combined.includes('data')) {
    unconventionalApproaches.push({
      approach: 'Delete the database',
      rationale: 'Use event sourcing or append-only logs instead of traditional CRUD database',
      novelty: 85
    });
    unconventionalApproaches.push({
      approach: 'Store data in the URL',
      rationale: 'For small datasets, encode state in URL/localStorage and skip backend entirely',
      novelty: 70
    });
  }
  
  if (combined.includes('auth') || combined.includes('login')) {
    unconventionalApproaches.push({
      approach: 'No passwords, no auth',
      rationale: 'Use magic links, device fingerprinting, or make app fully public',
      novelty: 80
    });
    unconventionalApproaches.push({
      approach: 'Auth via proof-of-work',
      rationale: 'Users solve a computational puzzle instead of password (prevents bots, no storage)',
      novelty: 95
    });
  }
  
  // Generate analogies from different domains
  analogies.push({
    domain: 'Biology',
    analogy: 'Immune system - learns from attacks and builds defenses',
    application: 'Build self-healing systems that learn from failures and auto-patch'
  });
  
  analogies.push({
    domain: 'Architecture',
    analogy: 'Load-bearing walls vs decorative - some parts are critical, others aren\'t',
    application: 'Identify which services are load-bearing and which can fail gracefully'
  });
  
  analogies.push({
    domain: 'Cooking',
    analogy: 'Mise en place - prepare all ingredients before cooking',
    application: 'Pre-compute and cache all dependencies before executing main logic'
  });
  
  analogies.push({
    domain: 'Traffic Flow',
    analogy: 'Roundabouts vs traffic lights - continuous flow vs stop-and-go',
    application: 'Use async/streaming instead of request-response for better throughput'
  });
  
  analogies.push({
    domain: 'Gardening',
    analogy: 'Pruning encourages growth - removing parts makes the whole stronger',
    application: 'Delete code/features to improve maintainability and focus'
  });
  
  // Generate reversals (opposite of conventional wisdom)
  reversals.push('Instead of fixing the problem, fix the expectation');
  reversals.push('Instead of adding features, remove them');
  reversals.push('Instead of making it faster, make it more transparent');
  reversals.push('Instead of preventing errors, embrace and expose them');
  reversals.push('Instead of automating, add manual human steps');
  reversals.push('Instead of optimizing for speed, optimize for debuggability');
  reversals.push('Instead of scaling horizontally, scale vertically to the limit');
  reversals.push('Instead of microservices, go back to monolith');
  
  // Generate random connections (force connections between unrelated concepts)
  randomConnections.push('What if your API was a video game? (gamification, levels, achievements)');
  randomConnections.push('What if your database was a social network? (data relationships as friendships)');
  randomConnections.push('What if your code was music? (rhythm, harmony, composition patterns)');
  randomConnections.push('What if your deployment was cooking? (recipes, ingredients, timing)');
  randomConnections.push('What if your tests were a detective story? (clues, suspects, solving mysteries)');
  randomConnections.push('What if your UI was a conversation? (natural language, context, memory)');
  
  // Generate provocative ideas (intentionally extreme to spark creativity)
  provocativeIdeas.push('Delete all tests and rely on production monitoring');
  provocativeIdeas.push('Rewrite everything in a language nobody on the team knows');
  provocativeIdeas.push('Make the entire codebase a single file');
  provocativeIdeas.push('Charge users per API call to reduce usage');
  provocativeIdeas.push('Open source the entire product and monetize support');
  provocativeIdeas.push('Build the opposite of what users are asking for');
  provocativeIdeas.push('Make the app only work on Tuesdays');
  provocativeIdeas.push('Replace all documentation with interpretive dance videos');
  
  const confidence = 60; // Lateral thinking is inherently uncertain
  
  return {
    unconventionalApproaches,
    analogies,
    reversals,
    randomConnections,
    provocativeIdeas,
    confidence,
    reasoning: `Generated ${unconventionalApproaches.length} unconventional approaches, ${analogies.length} cross-domain analogies, ${reversals.length} reversals, and ${provocativeIdeas.length} provocative ideas to stimulate creative thinking.`
  };
}

/**
 * Enhanced version with context search
 */
export const lateralThinkingEnhanced = withContext(
  lateralThinking,
  (input) => `${input.problem} ${input.context || ''}`.slice(0, 200)
);

