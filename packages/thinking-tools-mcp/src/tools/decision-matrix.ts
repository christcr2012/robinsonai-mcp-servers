/**
 * Decision Matrix Tool
 * Weighted decision-making framework for comparing options
 * Enhanced with context search to find relevant code/docs
 */

import { withContext } from '../lib/context-enhancer.js';

export interface DecisionMatrixInput {
  options: string[];
  criteria?: string[];
  context?: string;
  useContext?: boolean;
  contextQuery?: string;
}

export interface DecisionMatrixOutput {
  matrix: Array<{
    option: string;
    scores: Array<{ criterion: string; score: number; weight: number; weightedScore: number }>;
    totalScore: number;
    rank: number;
  }>;
  recommendation: string;
  tradeoffs: Array<{ option: string; strengths: string[]; weaknesses: string[] }>;
  confidence: number;
  reasoning: string;
}

export function decisionMatrix(input: DecisionMatrixInput): DecisionMatrixOutput {
  const { options, criteria = [], context = '' } = input;
  const combined = `${options.join(' ')} ${criteria.join(' ')} ${context}`.toLowerCase();
  
  // Auto-detect criteria if not provided
  const detectedCriteria = criteria.length > 0 ? criteria : [
    'Cost',
    'Performance',
    'Maintainability',
    'Scalability',
    'Time to Implement',
    'Team Expertise',
    'Risk'
  ];
  
  // Auto-detect weights based on context
  const weights: { [key: string]: number } = {};
  
  if (combined.includes('startup') || combined.includes('mvp')) {
    weights['Cost'] = 0.25;
    weights['Time to Implement'] = 0.25;
    weights['Performance'] = 0.10;
    weights['Maintainability'] = 0.15;
    weights['Scalability'] = 0.10;
    weights['Team Expertise'] = 0.10;
    weights['Risk'] = 0.05;
  } else if (combined.includes('enterprise') || combined.includes('production')) {
    weights['Cost'] = 0.10;
    weights['Time to Implement'] = 0.10;
    weights['Performance'] = 0.20;
    weights['Maintainability'] = 0.20;
    weights['Scalability'] = 0.20;
    weights['Team Expertise'] = 0.10;
    weights['Risk'] = 0.10;
  } else {
    // Balanced weights
    const equalWeight = 1.0 / detectedCriteria.length;
    detectedCriteria.forEach(c => weights[c] = equalWeight);
  }
  
  const matrix: Array<{
    option: string;
    scores: Array<{ criterion: string; score: number; weight: number; weightedScore: number }>;
    totalScore: number;
    rank: number;
  }> = [];
  
  const tradeoffs: Array<{ option: string; strengths: string[]; weaknesses: string[] }> = [];
  
  // Score each option
  options.forEach(option => {
    const optionLower = option.toLowerCase();
    const scores: Array<{ criterion: string; score: number; weight: number; weightedScore: number }> = [];
    
    detectedCriteria.forEach(criterion => {
      let score = 50; // Start neutral
      const weight = weights[criterion] || (1.0 / detectedCriteria.length);
      
      // Score based on option characteristics
      if (criterion === 'Cost') {
        if (optionLower.includes('free') || optionLower.includes('open source')) score = 90;
        else if (optionLower.includes('cheap') || optionLower.includes('low cost')) score = 80;
        else if (optionLower.includes('expensive') || optionLower.includes('enterprise')) score = 30;
        else if (optionLower.includes('cloud') || optionLower.includes('saas')) score = 60;
      }
      
      if (criterion === 'Performance') {
        if (optionLower.includes('fast') || optionLower.includes('optimized')) score = 85;
        else if (optionLower.includes('slow') || optionLower.includes('legacy')) score = 40;
        else if (optionLower.includes('cache') || optionLower.includes('cdn')) score = 90;
      }
      
      if (criterion === 'Maintainability') {
        if (optionLower.includes('simple') || optionLower.includes('minimal')) score = 85;
        else if (optionLower.includes('complex') || optionLower.includes('custom')) score = 40;
        else if (optionLower.includes('standard') || optionLower.includes('popular')) score = 75;
      }
      
      if (criterion === 'Scalability') {
        if (optionLower.includes('cloud') || optionLower.includes('distributed')) score = 85;
        else if (optionLower.includes('monolith') || optionLower.includes('single')) score = 50;
        else if (optionLower.includes('microservice') || optionLower.includes('serverless')) score = 90;
      }
      
      if (criterion === 'Time to Implement') {
        if (optionLower.includes('quick') || optionLower.includes('ready')) score = 85;
        else if (optionLower.includes('custom') || optionLower.includes('build')) score = 40;
        else if (optionLower.includes('saas') || optionLower.includes('managed')) score = 90;
      }
      
      if (criterion === 'Team Expertise') {
        if (optionLower.includes('familiar') || optionLower.includes('known')) score = 85;
        else if (optionLower.includes('new') || optionLower.includes('learning')) score = 40;
        else if (optionLower.includes('popular') || optionLower.includes('standard')) score = 70;
      }
      
      if (criterion === 'Risk') {
        if (optionLower.includes('proven') || optionLower.includes('stable')) score = 85;
        else if (optionLower.includes('experimental') || optionLower.includes('beta')) score = 30;
        else if (optionLower.includes('new') || optionLower.includes('cutting edge')) score = 40;
      }
      
      scores.push({
        criterion,
        score,
        weight,
        weightedScore: score * weight
      });
    });
    
    const totalScore = scores.reduce((sum, s) => sum + s.weightedScore, 0);
    
    matrix.push({
      option,
      scores,
      totalScore,
      rank: 0 // Will be set after sorting
    });
    
    // Identify strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    scores.forEach(s => {
      if (s.score >= 80) {
        strengths.push(`${s.criterion}: ${s.score}/100`);
      } else if (s.score <= 40) {
        weaknesses.push(`${s.criterion}: ${s.score}/100`);
      }
    });
    
    tradeoffs.push({
      option,
      strengths,
      weaknesses
    });
  });
  
  // Sort by total score and assign ranks
  matrix.sort((a, b) => b.totalScore - a.totalScore);
  matrix.forEach((item, index) => {
    item.rank = index + 1;
  });
  
  // Generate recommendation
  const winner = matrix[0];
  const runnerUp = matrix[1];
  
  let recommendation = `Recommended: ${winner.option} (score: ${winner.totalScore.toFixed(1)})`;
  
  if (runnerUp && Math.abs(winner.totalScore - runnerUp.totalScore) < 5) {
    recommendation += ` - CLOSE CALL with ${runnerUp.option} (score: ${runnerUp.totalScore.toFixed(1)}). Consider both options carefully.`;
  } else if (runnerUp) {
    recommendation += ` - Clear winner over ${runnerUp.option} (score: ${runnerUp.totalScore.toFixed(1)})`;
  }
  
  const confidence = winner.totalScore >= 70 ? 80 : winner.totalScore >= 60 ? 65 : 50;

  return {
    matrix,
    recommendation,
    tradeoffs,
    confidence,
    reasoning: `Evaluated ${options.length} options across ${detectedCriteria.length} criteria with weighted scoring. Top option scored ${winner.totalScore.toFixed(1)}/100.`
  };
}

/**
 * Enhanced version with context search
 */
export const decisionMatrixEnhanced = withContext(
  decisionMatrix,
  (input) => `${input.options.join(' ')} ${input.context || ''}`.slice(0, 200)
);

