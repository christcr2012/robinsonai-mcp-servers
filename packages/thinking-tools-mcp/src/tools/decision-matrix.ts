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

type CriterionSignals = {
  positive: string[];
  negative: string[];
  synonyms: string[];
  emphasize?: string[];
};

const DEFAULT_CRITERIA = [
  'Cost',
  'Performance',
  'Maintainability',
  'Scalability',
  'Time to Implement',
  'Team Expertise',
  'Risk',
];

const CRITERION_SIGNALS: Record<string, CriterionSignals> = {
  Cost: {
    positive: ['free', 'open source', 'affordable', 'low cost', 'budget friendly', 'saves'],
    negative: ['expensive', 'costly', 'premium', 'high cost', 'pricey'],
    synonyms: ['cost', 'price', 'budget', 'spend'],
    emphasize: ['mvp', 'startup', 'bootstrap'],
  },
  Performance: {
    positive: ['fast', 'optimized', 'low latency', 'high throughput', 'performant', 'cache', 'cdn'],
    negative: ['slow', 'laggy', 'high latency', 'bottleneck', 'throttled'],
    synonyms: ['performance', 'speed', 'latency', 'throughput'],
    emphasize: ['production', 'realtime', 'high traffic'],
  },
  Maintainability: {
    positive: ['simple', 'minimal', 'well documented', 'standard', 'popular', 'clean', 'modular'],
    negative: ['complex', 'custom', 'spaghetti', 'legacy', 'hard to maintain', 'fragile'],
    synonyms: ['maintainability', 'maintenance', 'cleanliness', 'modularity'],
  },
  Scalability: {
    positive: ['scalable', 'distributed', 'cloud', 'serverless', 'autoscale', 'horizontal', 'replication'],
    negative: ['monolith', 'single node', 'single server', 'not scalable', 'manual scaling', 'bottleneck'],
    synonyms: ['scale', 'scalability', 'capacity', 'throughput'],
    emphasize: ['enterprise', 'global', 'multi-region'],
  },
  'Time to Implement': {
    positive: ['quick', 'fast to implement', 'ready-made', 'managed', 'saas', 'turnkey', 'plug and play'],
    negative: ['custom build', 'long ramp', 'months', 'slow rollout', 'complex setup', 'weeks of work'],
    synonyms: ['time to implement', 'implementation time', 'build time', 'delivery'],
    emphasize: ['deadline', 'launch date', 'urgent', 'crunch'],
  },
  'Team Expertise': {
    positive: ['familiar', 'known', 'expert', 'skillset', 'experienced', 'existing team'],
    negative: ['learning curve', 'unfamiliar', 'no experience', 'new tech', 'training required'],
    synonyms: ['expertise', 'skills', 'learning curve', 'team experience'],
  },
  Risk: {
    positive: ['low risk', 'proven', 'stable', 'battle-tested', 'mature', 'reliable'],
    negative: ['risky', 'unstable', 'experimental', 'beta', 'unknown', 'untested', 'downtime'],
    synonyms: ['risk', 'uncertainty', 'safety', 'reliability'],
  },
};

const POSITIVE_SENTIMENT = ['best', 'ideal', 'preferred', 'recommended', 'strong'];
const NEGATIVE_SENTIMENT = ['worst', 'avoid', 'poor', 'weak', 'concern'];

export function decisionMatrix(input: DecisionMatrixInput): DecisionMatrixOutput {
  const { options, criteria = [], context = '' } = input;
  if (!options || !options.length) {
    throw new Error('decision_matrix requires at least one option to evaluate');
  }

  const detectedCriteria = (criteria.length ? criteria : DEFAULT_CRITERIA).map(normalizeLabel);
  const contextSegments = buildOptionContext(options, context);
  const weights = deriveWeights(detectedCriteria, context);

  const matrix = options.map((option) => {
    const optionText = `${option}\n${contextSegments.get(option) ?? context}`.toLowerCase();
    const scores = detectedCriteria.map((criterion) => {
      const weight = weights[criterion] ?? 1 / detectedCriteria.length;
      const score = scoreOptionAgainstCriterion(option, optionText, criterion, contextSegments.get(option) ?? context);
      return {
        criterion,
        score,
        weight,
        weightedScore: score * weight,
      };
    });

    return {
      option,
      scores,
      totalScore: scores.reduce((sum, entry) => sum + entry.weightedScore, 0),
      rank: 0,
    };
  });

  matrix.sort((a, b) => b.totalScore - a.totalScore);
  matrix.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  const tradeoffs = matrix.map((entry) => {
    const strengths = entry.scores
      .filter((score) => score.score >= 75)
      .sort((a, b) => b.weightedScore - a.weightedScore)
      .map((score) => `${score.criterion}: ${score.score.toFixed(0)}/100 (weight ${(score.weight * 100).toFixed(0)}%)`);

    const weaknesses = entry.scores
      .filter((score) => score.score <= 45)
      .sort((a, b) => a.score - b.score)
      .map((score) => `${score.criterion}: ${score.score.toFixed(0)}/100 (needs attention)`);

    return { option: entry.option, strengths, weaknesses };
  });

  const winner = matrix[0];
  const runnerUp = matrix[1];
  const winnerDrivers = [...winner.scores]
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .slice(0, Math.min(3, winner.scores.length))
    .map((score) => `${score.criterion} (${(score.weight * 100).toFixed(0)}% weight)`);

  let recommendation = `Recommended: ${winner.option} — ${winner.totalScore.toFixed(1)}/100 driven by ${winnerDrivers.join(', ')}`;

  if (runnerUp) {
    const gap = winner.totalScore - runnerUp.totalScore;
    if (gap < 5) {
      recommendation += `. Close call with ${runnerUp.option} (${runnerUp.totalScore.toFixed(1)}/100); validate with qualitative factors.`;
    } else {
      recommendation += `. Outperforms ${runnerUp.option} by ${gap.toFixed(1)} points.`;
    }
  }

  const confidence = computeConfidence(matrix, weights);
  const reasoning = buildReasoning(matrix, detectedCriteria.length, weights);

  return {
    matrix,
    recommendation,
    tradeoffs,
    confidence,
    reasoning,
  };
}

/**
 * Enhanced version with context search
 */
export const decisionMatrixEnhanced = withContext(
  decisionMatrix,
  (input) => `${input.options.join(' ')} ${input.context || ''}`.slice(0, 200)
);

function normalizeLabel(label: string): string {
  if (!label) return '';
  return label
    .toString()
    .trim()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/(^|\s)([a-z])/g, (_, space, char) => `${space}${char.toUpperCase()}`);
}

function buildOptionContext(options: string[], context: string): Map<string, string> {
  const segments = new Map<string, string>();
  if (!context?.trim()) {
    options.forEach((option) => segments.set(option, option));
    return segments;
  }

  const paragraphs = context.split(/\n\s*\n/);
  const lines = context.split(/\r?\n/);

  options.forEach((option) => {
    const normalized = option.toLowerCase();
    const matchingParagraphs = paragraphs.filter((paragraph) => paragraph.toLowerCase().includes(normalized));

    if (matchingParagraphs.length) {
      segments.set(option, matchingParagraphs.join('\n\n'));
      return;
    }

    const alias = deriveAliases(option);
    const matchingLines = lines.filter((line) => {
      const lower = line.toLowerCase();
      return alias.some((candidate) => lower.startsWith(candidate) || lower.includes(candidate));
    });

    if (matchingLines.length) {
      segments.set(option, matchingLines.join('\n'));
      return;
    }

    segments.set(option, context);
  });

  return segments;
}

function deriveAliases(option: string): string[] {
  const lower = option.toLowerCase().trim();
  const aliases = new Set<string>([lower]);

  if (/option\s+[a-z]/.test(lower)) {
    aliases.add(lower.replace(/[^a-z]/g, ' ').trim());
    aliases.add(lower.replace(/^option\s+/, '').trim());
  }

  const parts = lower.split(/[^a-z0-9]+/).filter(Boolean);
  if (parts.length) {
    aliases.add(parts.join(' '));
  }

  return Array.from(aliases).filter(Boolean);
}

function deriveWeights(criteria: string[], context: string): Record<string, number> {
  const combined = `${criteria.join(' ')} ${context}`.toLowerCase();
  const baseWeights = new Map<string, number>();

  const startup = combined.includes('startup') || combined.includes('mvp') || combined.includes('bootstrap');
  const enterprise = combined.includes('enterprise') || combined.includes('production') || combined.includes('compliance');

  criteria.forEach((criterion) => {
    const signals = CRITERION_SIGNALS[criterion] ?? createSignalsForCustomCriterion(criterion);
    let weight = 1;

    if (startup && signals.emphasize?.some((word) => combined.includes(word))) {
      weight += 0.6;
    }

    if (enterprise && signals.emphasize?.some((word) => combined.includes(word))) {
      weight += 0.6;
    }

    if (combined.includes(criterion.toLowerCase())) {
      weight += 0.4;
    }

    const signalHits = signals.synonyms.filter((syn) => combined.includes(syn));
    weight += signalHits.length * 0.2;

    baseWeights.set(criterion, weight);
  });

  const total = Array.from(baseWeights.values()).reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) {
    const equal = 1 / Math.max(1, criteria.length);
    return Object.fromEntries(criteria.map((criterion) => [criterion, equal]));
  }

  return Object.fromEntries(
    Array.from(baseWeights.entries()).map(([criterion, weight]) => [criterion, weight / total])
  );
}

function scoreOptionAgainstCriterion(
  option: string,
  optionText: string,
  criterion: string,
  contextSegment: string
): number {
  const signals = CRITERION_SIGNALS[criterion] ?? createSignalsForCustomCriterion(criterion);
  let score = 55;

  const optionLower = option.toLowerCase();
  score = applyHeuristics(optionLower, criterion, score);

  const combinedText = `${optionText}\n${contextSegment}`.toLowerCase();
  const numeric = extractNumericSignal(combinedText, signals.synonyms);
  if (numeric !== null) {
    score = blend(score, numeric, 0.65);
  }

  for (const positive of signals.positive) {
    if (combinedText.includes(positive)) {
      score += 6;
    }
  }

  for (const negative of signals.negative) {
    if (combinedText.includes(negative)) {
      score -= 6;
    }
  }

  for (const synonym of signals.synonyms) {
    const highPattern = new RegExp(`(high|strong|great)\s+${escapeRegExp(synonym)}`);
    const lowPattern = new RegExp(`(low|weak|poor)\s+${escapeRegExp(synonym)}`);
    if (highPattern.test(combinedText)) score += 7;
    if (lowPattern.test(combinedText)) score -= 7;
  }

  for (const positive of POSITIVE_SENTIMENT) {
    if (combinedText.includes(positive)) {
      score += 3;
    }
  }

  for (const negative of NEGATIVE_SENTIMENT) {
    if (combinedText.includes(negative)) {
      score -= 3;
    }
  }

  if (combinedText.includes('better than') && combinedText.includes(optionLower)) {
    score += 4;
  }

  if (combinedText.includes('worse than') && combinedText.includes(optionLower)) {
    score -= 4;
  }

  return clampScore(score);
}

function applyHeuristics(optionLower: string, criterion: string, startingScore: number): number {
  let score = startingScore;

  if (criterion === 'Cost') {
    if (optionLower.includes('free') || optionLower.includes('open source')) score += 25;
    else if (optionLower.includes('cheap') || optionLower.includes('low cost')) score += 15;
    else if (optionLower.includes('expensive') || optionLower.includes('enterprise')) score -= 20;
    else if (optionLower.includes('cloud') || optionLower.includes('saas')) score += 5;
  }

  if (criterion === 'Performance') {
    if (optionLower.includes('fast') || optionLower.includes('optimized')) score += 20;
    else if (optionLower.includes('slow') || optionLower.includes('legacy')) score -= 15;
    else if (optionLower.includes('cache') || optionLower.includes('cdn')) score += 22;
  }

  if (criterion === 'Maintainability') {
    if (optionLower.includes('simple') || optionLower.includes('minimal')) score += 18;
    else if (optionLower.includes('complex') || optionLower.includes('custom')) score -= 18;
    else if (optionLower.includes('standard') || optionLower.includes('popular')) score += 12;
  }

  if (criterion === 'Scalability') {
    if (optionLower.includes('cloud') || optionLower.includes('distributed')) score += 18;
    else if (optionLower.includes('monolith') || optionLower.includes('single')) score -= 10;
    else if (optionLower.includes('microservice') || optionLower.includes('serverless')) score += 22;
  }

  if (criterion === 'Time to Implement') {
    if (optionLower.includes('quick') || optionLower.includes('ready')) score += 18;
    else if (optionLower.includes('custom') || optionLower.includes('build')) score -= 15;
    else if (optionLower.includes('saas') || optionLower.includes('managed')) score += 22;
  }

  if (criterion === 'Team Expertise') {
    if (optionLower.includes('familiar') || optionLower.includes('known')) score += 18;
    else if (optionLower.includes('new') || optionLower.includes('learning')) score -= 18;
    else if (optionLower.includes('popular') || optionLower.includes('standard')) score += 10;
  }

  if (criterion === 'Risk') {
    if (optionLower.includes('proven') || optionLower.includes('stable')) score += 18;
    else if (optionLower.includes('experimental') || optionLower.includes('beta')) score -= 20;
    else if (optionLower.includes('new') || optionLower.includes('cutting edge')) score -= 10;
  }

  return score;
}

function extractNumericSignal(text: string, synonyms: string[]): number | null {
  for (const synonym of synonyms) {
    const pattern = new RegExp(`${escapeRegExp(synonym)}[^0-9]{0,16}(\d{1,3}(?:\.\d{1,2})?)\s*(?:/\s*(\d{1,3})|%)?`, 'i');
    const match = text.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      const denominator = match[2] ? parseFloat(match[2]) : match[0].includes('%') ? 100 : undefined;
      if (denominator && denominator > 0) {
        return clampScore((value / denominator) * 100);
      }
      if (!denominator) {
        if (value <= 1) return clampScore(value * 100);
        if (value <= 5) return clampScore((value / 5) * 100);
        if (value <= 10) return clampScore((value / 10) * 100);
        return clampScore(value);
      }
    }
  }
  return null;
}

function blend(base: number, value: number, weight: number): number {
  return base * (1 - weight) + value * weight;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

function computeConfidence(matrix: Array<{ totalScore: number }>, weights: Record<string, number>): number {
  if (!matrix.length) return 50;
  const scores = matrix.map((entry) => entry.totalScore);
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const spread = max - min;
  const weightConcentration = Math.max(...Object.values(weights));

  let confidence = 60 + spread * 0.4 + (weightConcentration * 100 - 50) * 0.25;
  if (matrix.length === 1) {
    confidence = 65 + max * 0.2;
  }

  return Math.max(45, Math.min(96, confidence));
}

function buildReasoning(
  matrix: Array<{ option: string; totalScore: number; scores: Array<{ criterion: string; score: number; weight: number }> }>,
  criteriaCount: number,
  weights: Record<string, number>
): string {
  const winner = matrix[0];
  const runnerUp = matrix[1];
  const weightLeaders = Object.entries(weights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, Math.min(3, Object.keys(weights).length))
    .map(([criterion, weight]) => `${criterion} (${(weight * 100).toFixed(0)}%)`)
    .join(', ');

  const gap = runnerUp ? (winner.totalScore - runnerUp.totalScore).toFixed(1) : 'n/a';
  return `Evaluated ${matrix.length} option${matrix.length === 1 ? '' : 's'} across ${criteriaCount} criteria. ` +
    `Highest weighted factors: ${weightLeaders}. Score gap vs runner-up: ${gap}.`;
}

function createSignalsForCustomCriterion(label: string): CriterionSignals {
  const normalized = normalizeLabel(label);
  const tokens = normalized.toLowerCase().split(/\s+/).filter(Boolean);
  return {
    positive: ['high', 'strong', 'robust', 'improves', 'benefit'],
    negative: ['low', 'weak', 'issue', 'problem', 'gap'],
    synonyms: tokens.length ? tokens : [normalized.toLowerCase()],
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

