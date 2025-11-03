/**
 * Socratic Questioning Tool
 * Deep inquiry through probing questions
 * Enhanced with context search to find relevant code/docs
 */

import { withContext } from '../lib/context-enhancer.js';

export interface SocraticInput {
  topic: string;
  context?: string;
  depth?: 'quick' | 'deep';
  useContext?: boolean;
  contextQuery?: string;
}

export interface SocraticOutput {
  clarifyingQuestions: string[];
  assumptionQuestions: string[];
  reasoningQuestions: string[];
  perspectiveQuestions: string[];
  implicationQuestions: string[];
  metaQuestions: string[];
  confidence: number;
  reasoning: string;
}

export function socratic(input: SocraticInput): SocraticOutput {
  const { topic, context = '', depth = 'quick' } = input;
  const combined = `${topic} ${context}`.toLowerCase();
  
  const clarifyingQuestions: string[] = [];
  const assumptionQuestions: string[] = [];
  const reasoningQuestions: string[] = [];
  const perspectiveQuestions: string[] = [];
  const implicationQuestions: string[] = [];
  const metaQuestions: string[] = [];
  
  // Clarifying questions (understand what is being said)
  clarifyingQuestions.push('What exactly do you mean by that?');
  clarifyingQuestions.push('Can you give me an example?');
  clarifyingQuestions.push('How does this relate to the broader problem?');
  clarifyingQuestions.push('What is the core issue you\'re trying to solve?');
  
  if (combined.includes('should') || combined.includes('must')) {
    clarifyingQuestions.push('What makes this a "should" rather than a "could"?');
  }
  
  if (combined.includes('better') || combined.includes('worse')) {
    clarifyingQuestions.push('Better/worse by what measure?');
    clarifyingQuestions.push('Better for whom?');
  }
  
  // Assumption questions (probe underlying beliefs)
  assumptionQuestions.push('What are you assuming to be true?');
  assumptionQuestions.push('What would happen if that assumption were false?');
  assumptionQuestions.push('Why do you think this assumption holds?');
  assumptionQuestions.push('What evidence supports this assumption?');
  
  if (combined.includes('scale') || combined.includes('growth')) {
    assumptionQuestions.push('Are you assuming growth will continue at the current rate?');
    assumptionQuestions.push('What if growth is slower/faster than expected?');
  }
  
  if (combined.includes('user') || combined.includes('customer')) {
    assumptionQuestions.push('Are you assuming users will behave rationally?');
    assumptionQuestions.push('Have you validated these assumptions with real users?');
  }
  
  if (combined.includes('performance') || combined.includes('fast')) {
    assumptionQuestions.push('Are you assuming performance is the bottleneck?');
    assumptionQuestions.push('Have you measured where the actual slowness is?');
  }
  
  // Reasoning questions (examine logic and evidence)
  reasoningQuestions.push('What evidence do you have for this?');
  reasoningQuestions.push('How did you arrive at this conclusion?');
  reasoningQuestions.push('What alternative explanations exist?');
  reasoningQuestions.push('What would it take to prove this wrong?');
  reasoningQuestions.push('Is this correlation or causation?');
  
  if (combined.includes('because') || combined.includes('therefore')) {
    reasoningQuestions.push('Does the conclusion necessarily follow from the premise?');
    reasoningQuestions.push('Are there any logical gaps in this reasoning?');
  }
  
  if (combined.includes('data') || combined.includes('metric')) {
    reasoningQuestions.push('Is this data representative of the whole population?');
    reasoningQuestions.push('Could this data be misleading or biased?');
  }
  
  // Perspective questions (consider different viewpoints)
  perspectiveQuestions.push('How would someone who disagrees view this?');
  perspectiveQuestions.push('What would a user/customer say about this?');
  perspectiveQuestions.push('How would this look from a different angle?');
  perspectiveQuestions.push('Who benefits from this? Who is harmed?');
  
  if (combined.includes('team') || combined.includes('developer')) {
    perspectiveQuestions.push('How would a junior developer approach this?');
    perspectiveQuestions.push('How would a senior architect view this?');
  }
  
  if (combined.includes('business') || combined.includes('product')) {
    perspectiveQuestions.push('How does this align with business goals?');
    perspectiveQuestions.push('What would the CEO/CFO think about this?');
  }
  
  if (combined.includes('technical') || combined.includes('architecture')) {
    perspectiveQuestions.push('How would this look in 5 years?');
    perspectiveQuestions.push('What would a security expert say about this?');
  }
  
  // Implication questions (explore consequences)
  implicationQuestions.push('What are the consequences if this succeeds?');
  implicationQuestions.push('What are the consequences if this fails?');
  implicationQuestions.push('What happens next?');
  implicationQuestions.push('What are the second-order effects?');
  implicationQuestions.push('What are the long-term implications?');
  
  if (combined.includes('change') || combined.includes('migrate')) {
    implicationQuestions.push('What will break when we make this change?');
    implicationQuestions.push('How will this affect existing users/systems?');
  }
  
  if (combined.includes('cost') || combined.includes('budget')) {
    implicationQuestions.push('What are the hidden costs?');
    implicationQuestions.push('What is the opportunity cost of this decision?');
  }
  
  if (combined.includes('risk') || combined.includes('failure')) {
    implicationQuestions.push('What is the worst-case scenario?');
    implicationQuestions.push('Can we recover if this goes wrong?');
  }
  
  // Meta questions (question the question)
  metaQuestions.push('Why are we asking this question?');
  metaQuestions.push('What question should we be asking instead?');
  metaQuestions.push('Are we solving the right problem?');
  metaQuestions.push('What are we not considering?');
  metaQuestions.push('How do we know when we have the right answer?');
  
  if (combined.includes('solution') || combined.includes('fix')) {
    metaQuestions.push('Are we treating symptoms or root causes?');
    metaQuestions.push('Is this problem worth solving?');
  }
  
  if (combined.includes('decide') || combined.includes('choose')) {
    metaQuestions.push('What criteria are we using to decide?');
    metaQuestions.push('Who should be making this decision?');
  }
  
  // Add depth-specific questions
  if (depth === 'deep') {
    clarifyingQuestions.push('Can you break this down into smaller parts?');
    clarifyingQuestions.push('What are the edge cases?');
    
    assumptionQuestions.push('What cultural or organizational assumptions are embedded here?');
    assumptionQuestions.push('What are we taking for granted?');
    
    reasoningQuestions.push('What are the weakest points in this argument?');
    reasoningQuestions.push('What would a skeptic say?');
    
    perspectiveQuestions.push('How would this look in a different industry/domain?');
    perspectiveQuestions.push('What can we learn from historical precedents?');
    
    implicationQuestions.push('What are the ethical implications?');
    implicationQuestions.push('How does this affect power dynamics?');
    
    metaQuestions.push('What biases might be influencing our thinking?');
    metaQuestions.push('Are we asking questions to confirm what we already believe?');
  }
  
  const confidence = 70;

  return {
    clarifyingQuestions,
    assumptionQuestions,
    reasoningQuestions,
    perspectiveQuestions,
    implicationQuestions,
    metaQuestions,
    confidence,
    reasoning: `Generated ${clarifyingQuestions.length} clarifying, ${assumptionQuestions.length} assumption, ${reasoningQuestions.length} reasoning, ${perspectiveQuestions.length} perspective, ${implicationQuestions.length} implication, and ${metaQuestions.length} meta questions for deep inquiry.`
  };
}

/**
 * Enhanced version with context search
 */
export const socraticQuestioningEnhanced = withContext(
  socratic,
  (input) => `${input.topic} ${input.context || ''}`.slice(0, 200)
);

