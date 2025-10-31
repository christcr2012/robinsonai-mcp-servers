/**
 * Convention Score for Tournament Selection
 * 
 * Compute convention score from:
 * - % of identifiers that match glossary (edit distance / alias map)
 * - Correct file naming pattern
 * - Passes boundaries rules
 * 
 * Weight alongside compile & tests when picking winner.
 */

import * as path from 'path';
import type { ProjectBrief } from './project-brief.js';
import type { GenResult } from '../pipeline/types.js';

export interface ConventionScore {
  total: number; // 0-1
  breakdown: {
    identifierMatch: number; // 0-1
    fileNaming: number; // 0-1
    boundaries: number; // 0-1
  };
  details: {
    matchedIdentifiers: number;
    totalIdentifiers: number;
    correctlyNamedFiles: number;
    totalFiles: number;
    boundaryViolations: number;
  };
}

/**
 * Calculate convention score for generated code
 */
export function calculateConventionScore(
  genResult: GenResult,
  brief: ProjectBrief,
  boundaryErrors: string[] = [],
  customRuleErrors: string[] = []
): ConventionScore {
  // Extract identifiers from generated code
  const identifiers = extractIdentifiers(genResult.files);
  
  // Calculate identifier match score
  const identifierMatchScore = calculateIdentifierMatchScore(identifiers, brief);
  
  // Calculate file naming score
  const fileNamingScore = calculateFileNamingScore(genResult.files, brief);
  
  // Calculate boundaries score
  const boundariesScore = calculateBoundariesScore(boundaryErrors, customRuleErrors);
  
  // Weighted total (40% identifiers, 30% file naming, 30% boundaries)
  const total = (
    identifierMatchScore.score * 0.4 +
    fileNamingScore.score * 0.3 +
    boundariesScore.score * 0.3
  );
  
  return {
    total,
    breakdown: {
      identifierMatch: identifierMatchScore.score,
      fileNaming: fileNamingScore.score,
      boundaries: boundariesScore.score,
    },
    details: {
      matchedIdentifiers: identifierMatchScore.matched,
      totalIdentifiers: identifierMatchScore.total,
      correctlyNamedFiles: fileNamingScore.correct,
      totalFiles: fileNamingScore.total,
      boundaryViolations: boundaryErrors.length + customRuleErrors.length,
    },
  };
}

/**
 * Extract identifiers from files
 */
function extractIdentifiers(files: Array<{ path: string; content: string }>): string[] {
  const identifiers: string[] = [];
  
  for (const file of files) {
    // Extract function names
    const functionMatches = file.content.matchAll(/(?:function|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
    for (const match of functionMatches) {
      identifiers.push(match[1]);
    }
    
    // Extract class names
    const classMatches = file.content.matchAll(/class\s+([A-Z][a-zA-Z0-9]*)/g);
    for (const match of classMatches) {
      identifiers.push(match[1]);
    }
    
    // Extract interface/type names
    const typeMatches = file.content.matchAll(/(?:interface|type)\s+([A-Z][a-zA-Z0-9]*)/g);
    for (const match of classMatches) {
      identifiers.push(match[1]);
    }
    
    // Extract const names
    const constMatches = file.content.matchAll(/const\s+([A-Z_][A-Z0-9_]*)\s*=/g);
    for (const match of constMatches) {
      identifiers.push(match[1]);
    }
  }
  
  return identifiers;
}

/**
 * Calculate identifier match score
 */
function calculateIdentifierMatchScore(
  identifiers: string[],
  brief: ProjectBrief
): { score: number; matched: number; total: number } {
  if (identifiers.length === 0) {
    return { score: 1, matched: 0, total: 0 };
  }
  
  const glossary = [
    ...brief.glossary.entities,
    ...brief.glossary.enums,
    ...brief.glossary.constants,
  ];
  
  let matched = 0;
  
  for (const identifier of identifiers) {
    // Check exact match
    if (glossary.includes(identifier)) {
      matched++;
      continue;
    }
    
    // Check fuzzy match (edit distance)
    const bestMatch = findBestMatch(identifier, glossary);
    if (bestMatch.distance <= 2) {
      matched++;
    }
  }
  
  const score = matched / identifiers.length;
  
  return { score, matched, total: identifiers.length };
}

/**
 * Find best match using edit distance
 */
function findBestMatch(
  identifier: string,
  glossary: string[]
): { match: string; distance: number } {
  let bestMatch = '';
  let bestDistance = Infinity;
  
  for (const term of glossary) {
    const distance = levenshteinDistance(identifier.toLowerCase(), term.toLowerCase());
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = term;
    }
  }
  
  return { match: bestMatch, distance: bestDistance };
}

/**
 * Levenshtein distance (edit distance)
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Calculate file naming score
 */
function calculateFileNamingScore(
  files: Array<{ path: string; content: string }>,
  brief: ProjectBrief
): { score: number; correct: number; total: number } {
  if (files.length === 0) {
    return { score: 1, correct: 0, total: 0 };
  }
  
  const pattern = brief.naming.files;
  let correct = 0;
  
  for (const file of files) {
    const fileName = path.basename(file.path);
    const baseName = fileName.replace(/\.(ts|tsx|js|jsx|test|spec)$/g, '');
    
    if (matchesNamingPattern(baseName, pattern)) {
      correct++;
    }
  }
  
  const score = correct / files.length;
  
  return { score, correct, total: files.length };
}

/**
 * Check if name matches pattern
 */
function matchesNamingPattern(name: string, pattern: string): boolean {
  switch (pattern) {
    case 'kebab-case':
      return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name);
    case 'camelCase':
      return /^[a-z][a-zA-Z0-9]*$/.test(name);
    case 'PascalCase':
      return /^[A-Z][a-zA-Z0-9]*$/.test(name);
    case 'snake_case':
      return /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/.test(name);
    default:
      return true; // Unknown pattern, accept all
  }
}

/**
 * Calculate boundaries score
 */
function calculateBoundariesScore(
  boundaryErrors: string[],
  customRuleErrors: string[]
): { score: number } {
  const totalViolations = boundaryErrors.length + customRuleErrors.length;
  
  if (totalViolations === 0) {
    return { score: 1 };
  }
  
  // Penalize each violation
  // 1-5 violations: 0.8
  // 6-10 violations: 0.6
  // 11-20 violations: 0.4
  // 21+ violations: 0.2
  
  if (totalViolations <= 5) {
    return { score: 0.8 };
  } else if (totalViolations <= 10) {
    return { score: 0.6 };
  } else if (totalViolations <= 20) {
    return { score: 0.4 };
  } else {
    return { score: 0.2 };
  }
}

/**
 * Compare two candidates and pick the winner
 */
export function pickWinner(
  candidates: Array<{
    genResult: GenResult;
    compilationScore: number;
    testScore: number;
    conventionScore: ConventionScore;
  }>
): number {
  if (candidates.length === 0) return -1;
  if (candidates.length === 1) return 0;
  
  // Calculate total score for each candidate
  // Weights: 30% compilation, 40% tests, 30% conventions
  const scores = candidates.map(c => 
    c.compilationScore * 0.3 +
    c.testScore * 0.4 +
    c.conventionScore.total * 0.3
  );
  
  // Find highest score
  let bestIndex = 0;
  let bestScore = scores[0];
  
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > bestScore) {
      bestScore = scores[i];
      bestIndex = i;
    }
  }
  
  return bestIndex;
}

