/**
 * Critical Thinking Tool
 * Evaluate arguments, evidence, and logical reasoning
 * Enhanced with context search to find relevant code/docs
 */

import { withContext } from '../lib/context-enhancer.js';

export interface CriticalThinkingInput {
  argument: string;
  context?: string;
  depth?: 'quick' | 'deep';
  useContext?: boolean;
  contextQuery?: string;
}

export interface CriticalThinkingOutput {
  claims: string[];
  evidence: Array<{ claim: string; evidence: string; strength: 'strong' | 'moderate' | 'weak' | 'none' }>;
  logicalFallacies: Array<{ type: string; description: string; location: string }>;
  assumptions: string[];
  counterEvidence: string[];
  overallAssessment: {
    logicalSoundness: number; // 0-100
    evidenceQuality: number; // 0-100
    conclusion: string;
  };
  confidence: number;
  reasoning: string;
}

export function criticalThinking(input: CriticalThinkingInput): CriticalThinkingOutput {
  const { argument, context = '', depth = 'quick' } = input;
  const combined = `${argument} ${context}`.toLowerCase();
  
  const claims: string[] = [];
  const evidence: Array<{ claim: string; evidence: string; strength: 'strong' | 'moderate' | 'weak' | 'none' }> = [];
  const logicalFallacies: Array<{ type: string; description: string; location: string }> = [];
  const assumptions: string[] = [];
  const counterEvidence: string[] = [];
  
  // Extract claims (sentences with strong assertions)
  if (combined.includes('will') || combined.includes('must') || combined.includes('always')) {
    claims.push('Contains absolute claims that may not account for exceptions');
  }
  if (combined.includes('should') || combined.includes('need to')) {
    claims.push('Contains normative claims about what ought to be done');
  }
  if (combined.includes('because') || combined.includes('therefore') || combined.includes('thus')) {
    claims.push('Contains causal or logical reasoning chains');
  }
  
  // Detect logical fallacies
  if ((combined.includes('everyone') || combined.includes('nobody') || combined.includes('always') || combined.includes('never')) && 
      !combined.includes('almost') && !combined.includes('usually')) {
    logicalFallacies.push({
      type: 'Hasty Generalization',
      description: 'Uses absolute terms without accounting for exceptions',
      location: 'Throughout argument'
    });
  }
  
  if (combined.includes('if we don\'t') && combined.includes('then')) {
    logicalFallacies.push({
      type: 'False Dilemma',
      description: 'Presents only two options when more may exist',
      location: 'Conditional statement'
    });
  }
  
  if ((combined.includes('popular') || combined.includes('everyone does') || combined.includes('industry standard')) &&
      combined.includes('therefore')) {
    logicalFallacies.push({
      type: 'Appeal to Popularity',
      description: 'Argues something is correct because it\'s popular',
      location: 'Justification section'
    });
  }
  
  if (combined.includes('expert') || combined.includes('authority') || combined.includes('said')) {
    logicalFallacies.push({
      type: 'Appeal to Authority',
      description: 'Relies on authority rather than evidence (may be valid if expert is relevant)',
      location: 'Citation of authority'
    });
  }
  
  if (combined.includes('slippery slope') || (combined.includes('lead to') && combined.includes('eventually'))) {
    logicalFallacies.push({
      type: 'Slippery Slope',
      description: 'Assumes one action will inevitably lead to extreme consequences',
      location: 'Consequence prediction'
    });
  }
  
  // Identify assumptions
  if (combined.includes('microservice') || combined.includes('distributed')) {
    assumptions.push('Assumes team has expertise in distributed systems');
    assumptions.push('Assumes infrastructure can handle multiple services');
  }
  
  if (combined.includes('scale') || combined.includes('growth')) {
    assumptions.push('Assumes future growth will occur');
    assumptions.push('Assumes current architecture won\'t scale');
  }
  
  if (combined.includes('user') || combined.includes('customer')) {
    assumptions.push('Assumes user behavior and needs are understood');
  }
  
  if (combined.includes('performance') || combined.includes('faster')) {
    assumptions.push('Assumes performance is currently a problem');
    assumptions.push('Assumes proposed solution will improve performance');
  }
  
  if (combined.includes('security') || combined.includes('secure')) {
    assumptions.push('Assumes current security is inadequate');
  }
  
  // Evaluate evidence quality
  if (combined.includes('benchmark') || combined.includes('test') || combined.includes('data')) {
    evidence.push({
      claim: 'Performance improvement',
      evidence: 'Mentions benchmarks/tests/data',
      strength: 'strong'
    });
  } else if (combined.includes('faster') || combined.includes('better')) {
    evidence.push({
      claim: 'Performance improvement',
      evidence: 'Subjective claim without data',
      strength: 'weak'
    });
  }
  
  if (combined.includes('research') || combined.includes('study') || combined.includes('paper')) {
    evidence.push({
      claim: 'Backed by research',
      evidence: 'References research/studies',
      strength: 'strong'
    });
  }
  
  if (combined.includes('experience') || combined.includes('in my opinion')) {
    evidence.push({
      claim: 'Based on experience',
      evidence: 'Anecdotal evidence',
      strength: 'moderate'
    });
  }
  
  // Generate counter-evidence
  if (combined.includes('microservice')) {
    counterEvidence.push('Microservices add operational complexity and may slow development');
    counterEvidence.push('Monoliths can scale effectively with proper architecture');
  }
  
  if (combined.includes('rewrite')) {
    counterEvidence.push('Rewrites often take longer and cost more than expected');
    counterEvidence.push('Incremental refactoring may be safer and faster');
  }
  
  if (combined.includes('new technology') || combined.includes('latest')) {
    counterEvidence.push('New technology may lack maturity and community support');
    counterEvidence.push('Team learning curve could slow development');
  }
  
  if (combined.includes('optimize') || combined.includes('performance')) {
    counterEvidence.push('Premature optimization may waste time on non-bottlenecks');
    counterEvidence.push('Profiling should identify actual bottlenecks first');
  }
  
  // Calculate assessment scores
  let logicalSoundness = 70; // Start neutral
  logicalSoundness -= logicalFallacies.length * 15; // Penalize fallacies
  logicalSoundness = Math.max(0, Math.min(100, logicalSoundness));
  
  let evidenceQuality = 50; // Start neutral
  const strongEvidence = evidence.filter(e => e.strength === 'strong').length;
  const weakEvidence = evidence.filter(e => e.strength === 'weak' || e.strength === 'none').length;
  evidenceQuality += strongEvidence * 20;
  evidenceQuality -= weakEvidence * 10;
  evidenceQuality = Math.max(0, Math.min(100, evidenceQuality));
  
  let conclusion = '';
  if (logicalSoundness >= 70 && evidenceQuality >= 70) {
    conclusion = 'Strong argument with solid logic and evidence';
  } else if (logicalSoundness >= 50 && evidenceQuality >= 50) {
    conclusion = 'Moderate argument - has merit but needs stronger support';
  } else if (logicalSoundness < 50 || evidenceQuality < 50) {
    conclusion = 'Weak argument - significant logical or evidential issues';
  } else {
    conclusion = 'Mixed argument - some strengths and weaknesses';
  }
  
  const confidence = Math.min(logicalSoundness, evidenceQuality);
  
  return {
    claims,
    evidence,
    logicalFallacies,
    assumptions,
    counterEvidence,
    overallAssessment: {
      logicalSoundness,
      evidenceQuality,
      conclusion
    },
    confidence,
    reasoning: `Analyzed argument for logical structure, evidence quality, and assumptions. Found ${logicalFallacies.length} potential fallacies, ${assumptions.length} assumptions, and ${evidence.length} evidence claims.`
  };
}

/**
 * Enhanced version with context search
 */
export const criticalThinkingEnhanced = withContext(
  criticalThinking,
  (input) => `${input.argument} ${input.context || ''}`.slice(0, 200)
);

