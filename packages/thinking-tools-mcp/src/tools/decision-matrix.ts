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

const DEFAULT_CRITERIA = [
  'Cost',
  'Performance',
  'Maintainability',
  'Scalability',
  'Time to Implement',
  'Team Expertise',
  'Risk',
];

const CRITERIA_KEYWORDS: Record<string, { positive: string[]; negative: string[] }> = {
  cost: {
    positive: ['low cost', 'lower cost', 'cheap', 'affordable', 'cost effective', 'cost-efficient', 'saves budget', 'savings', 'no license', 'open source', 'free tier'],
    negative: ['expensive', 'high cost', 'premium', 'license fee', 'overage', 'overhead', 'subscription cost', 'costly', 'pricing concern'],
  },
  performance: {
    positive: ['high performance', 'low latency', 'fast', 'optimized', 'high throughput', 'cache', 'cached', 'real time', 'realtime', 'performance boost'],
    negative: ['slow', 'latency issue', 'lag', 'bottleneck', 'throttled', 'performance limit', 'sluggish'],
  },
  maintainability: {
    positive: ['simple', 'minimal maintenance', 'standardized', 'well documented', 'mature', 'stable release', 'supported', 'community support'],
    negative: ['complex', 'custom logic', 'manual upkeep', 'fragile', 'maintenance heavy', 'hard to maintain', 'bespoke'],
  },
  scalability: {
    positive: ['scalable', 'auto scale', 'autoscale', 'serverless', 'distributed', 'horizontal', 'multi region', 'multi-region', 'elastic'],
    negative: ['monolith', 'single server', 'scale limit', 'does not scale', 'limited scale', 'bottleneck'],
  },
  'time to implement': {
    positive: ['quick setup', 'fast to implement', 'ready to use', 'turnkey', 'managed service', 'out of the box', 'out-of-the-box', 'plug and play', 'drop-in'],
    negative: ['custom build', 'long setup', 'manual process', 'migration effort', 'weeks to build', 'months to build', 'slow rollout'],
  },
  'team expertise': {
    positive: ['familiar', 'existing stack', 'known stack', 'training provided', 'well documented', 'community knowledge', 'uses current skills'],
    negative: ['steep learning curve', 'unfamiliar', 'specialist', 'requires specialists', 'new stack', 'limited expertise', 'learning required'],
  },
  risk: {
    positive: ['proven', 'battle tested', 'stable', 'reliable', 'compliant', 'audit', 'mature', 'supported vendor'],
    negative: ['experimental', 'beta', 'unproven', 'deprecated', 'security risk', 'downtime', 'instability', 'high risk'],
  },
};

const GENERAL_POSITIVE = [
  'robust',
  'reliable',
  'secure',
  'best in class',
  'recommended',
  'preferred',
  'saves time',
  'improves',
  'high confidence',
  'mature',
  'stable',
  'flexible',
  'scalable',
  'productivity',
  'automation',
];

const GENERAL_NEGATIVE = [
  'fragile',
  'risky',
  'manual overhead',
  'downtime',
  'unstable',
  'outdated',
  'legacy',
  'slow',
  'blocked',
  'unknown',
  'uncertain',
  'inconsistent',
];

type MatrixRow = {
  option: string;
  scores: Array<{ criterion: string; score: number; weight: number; weightedScore: number }>;
  totalScore: number;
  rank: number;
};

function clampScore(score: number): number {
  if (Number.isNaN(score)) return 50;
  return Math.max(5, Math.min(95, score));
}

function countMatches(text: string, terms: string[]): number {
  if (!text) return 0;
  let hits = 0;
  for (const term of terms) {
    if (!term) continue;
    if (text.includes(term)) hits++;
  }
  return hits;
}

function buildOptionWindow(option: string, context: string): string {
  if (!context) return '';
  const ctxLower = context.toLowerCase();
  const tokens = option.toLowerCase().split(/\W+/).filter(Boolean);
  if (!tokens.length) {
    return ctxLower.slice(0, 240);
  }

  const searchPhrases = [
    tokens.join(' '),
    tokens.slice(0, Math.min(tokens.length, 3)).join(' '),
    tokens[0],
  ].filter(Boolean);

  let idx = -1;
  for (const phrase of searchPhrases) {
    idx = ctxLower.indexOf(phrase);
    if (idx !== -1) break;
  }

  if (idx === -1) {
    return ctxLower.slice(0, 240);
  }

  const start = Math.max(0, idx - 160);
  const end = Math.min(ctxLower.length, idx + searchPhrases[0]!.length + 160);
  return ctxLower.slice(start, end);
}

function applyKeywordAdjustments(base: number, criterion: string, text: string): number {
  const config = CRITERIA_KEYWORDS[criterion.toLowerCase()] ?? { positive: [], negative: [] };
  let score = base;

  const posHits = countMatches(text, config.positive);
  const negHits = countMatches(text, config.negative);

  if (posHits) {
    score += 12 + (posHits - 1) * 6;
  }
  if (negHits) {
    score -= 12 + (negHits - 1) * 6;
  }

  const generalPos = countMatches(text, GENERAL_POSITIVE);
  const generalNeg = countMatches(text, GENERAL_NEGATIVE);

  if (generalPos) {
    score += Math.min(15, generalPos * 4);
  }
  if (generalNeg) {
    score -= Math.min(15, generalNeg * 4);
  }

  return clampScore(score);
}

function computeSentimentSignal(text: string): number {
  if (!text) return 0;
  const pos = countMatches(text, GENERAL_POSITIVE);
  const neg = countMatches(text, GENERAL_NEGATIVE);
  return (pos - neg) * 2.5;
}

function applyTieBreakers(rows: MatrixRow[], windows: string[], options: string[]): void {
  if (rows.length <= 1) return;

  const uniqueTotals = new Set(rows.map((row) => row.totalScore.toFixed(2)));
  if (uniqueTotals.size > 1) {
    return;
  }

  const lengths = options.map((option) => {
    const sanitized = option.replace(/[^a-z0-9]/gi, '');
    return sanitized.length || option.length || 1;
  });
  const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;

  rows.forEach((row, idx) => {
    const window = windows[idx] ?? '';
    let adjust = computeSentimentSignal(window);

    if (Math.abs(adjust) < 0.5) {
      const deviation = lengths[idx] - avgLength;
      adjust = deviation / 5;
    }

    if (!Number.isFinite(adjust) || Math.abs(adjust) < 0.5) {
      adjust = ((rows.length - idx - 1) - (rows.length - 1) / 2);
    }

    adjust = Math.max(-6, Math.min(6, adjust));
    if (adjust === 0) {
      adjust = idx === 0 ? 1.5 : -1.5;
    }

    const target = row.scores.reduce((best, current) => (current.weight > best.weight ? current : best), row.scores[0]);
    target.score = clampScore(target.score + adjust);
    target.weightedScore = target.score * target.weight;
    row.totalScore = row.scores.reduce((sum, s) => sum + s.weightedScore, 0);
  });
}

export function decisionMatrix(input: DecisionMatrixInput): DecisionMatrixOutput {
  const { options, criteria = [], context = '' } = input;
  const combined = `${options.join(' ')} ${criteria.join(' ')} ${context}`.toLowerCase();

  const detectedCriteria = criteria.length > 0 ? criteria : DEFAULT_CRITERIA;

  const weights: { [key: string]: number } = {};

  if (combined.includes('startup') || combined.includes('mvp')) {
    weights['Cost'] = 0.25;
    weights['Time to Implement'] = 0.25;
    weights['Performance'] = 0.1;
    weights['Maintainability'] = 0.15;
    weights['Scalability'] = 0.1;
    weights['Team Expertise'] = 0.1;
    weights['Risk'] = 0.05;
  } else if (combined.includes('enterprise') || combined.includes('production')) {
    weights['Cost'] = 0.1;
    weights['Time to Implement'] = 0.1;
    weights['Performance'] = 0.2;
    weights['Maintainability'] = 0.2;
    weights['Scalability'] = 0.2;
    weights['Team Expertise'] = 0.1;
    weights['Risk'] = 0.1;
  }

  const defaultWeight = 1.0 / detectedCriteria.length;
  const optionWindows = options.map((option) => {
    const window = buildOptionWindow(option, context);
    return `${option} ${window}`.toLowerCase();
  });

  const rows: MatrixRow[] = options.map((option, optionIndex) => {
    const text = optionWindows[optionIndex] ?? option.toLowerCase();

    const scores = detectedCriteria.map((criterion) => {
      const weight = weights[criterion] ?? defaultWeight;
      const criterionLower = criterion.toLowerCase();
      let score = 50;

      if (criterionLower === 'cost') {
        if (/(free|no license|included|open source|bundled)/.test(text)) score = Math.max(score, 88);
        if (/(low cost|cost effective|savings|affordable|reduced spend)/.test(text)) score = Math.max(score, 80);
        if (/(expensive|premium|high cost|license fee|overage|ongoing cost)/.test(text)) score = Math.min(score, 42);
      }

      if (criterionLower === 'performance') {
        if (/(fast|low latency|optimized|high throughput|cached|cache)/.test(text)) score = Math.max(score, 85);
        if (/(slow|latency issue|bottleneck|heavy load|performance risk|throttle)/.test(text)) score = Math.min(score, 45);
      }

      if (criterionLower === 'maintainability') {
        if (/(simple|standard|well documented|mature|stable release|community support|boilerplate)/.test(text)) score = Math.max(score, 82);
        if (/(complex|custom build|manual steps|fragmented|hard to maintain|bespoke)/.test(text)) score = Math.min(score, 44);
      }

      if (criterionLower === 'scalability') {
        if (/(auto scale|autoscale|serverless|distributed|horizontal|multi region|multi-region|elastic)/.test(text)) score = Math.max(score, 86);
        if (/(monolith|single server|scale limit|does not scale|scale bottleneck)/.test(text)) score = Math.min(score, 46);
      }

      if (criterionLower === 'time to implement') {
        if (/(quick setup|fast to implement|turnkey|ready to use|managed service|out of the box|out-of-the-box|plug and play|drop-in)/.test(text)) score = Math.max(score, 87);
        if (/(long setup|custom build|manual process|migration effort|weeks to build|months to build|slow rollout)/.test(text)) score = Math.min(score, 43);
      }

      if (criterionLower === 'team expertise') {
        if (/(familiar|existing stack|known stack|current skills|training provided|documented)/.test(text)) score = Math.max(score, 80);
        if (/(steep learning curve|unfamiliar|specialist|requires specialists|new stack|limited expertise|learning required)/.test(text)) score = Math.min(score, 45);
      }

      if (criterionLower === 'risk') {
        if (/(proven|battle tested|stable|reliable|compliant|audit|mature|supported vendor)/.test(text)) score = Math.max(score, 82);
        if (/(experimental|beta|unproven|deprecated|security risk|downtime|instability|high risk)/.test(text)) score = Math.min(score, 42);
      }

      score = applyKeywordAdjustments(score, criterion, text);
      const weightedScore = score * weight;

      return {
        criterion,
        score,
        weight,
        weightedScore,
      };
    });

    const totalScore = scores.reduce((sum, s) => sum + s.weightedScore, 0);

    return {
      option,
      scores,
      totalScore,
      rank: 0,
    };
  });

  applyTieBreakers(rows, optionWindows, options);

  rows.sort((a, b) => b.totalScore - a.totalScore);
  rows.forEach((row, index) => {
    row.rank = index + 1;
  });

  const tradeoffs = rows.map((row) => {
    const strengths = row.scores
      .filter((s) => s.score >= 75)
      .map((s) => `${s.criterion}: ${s.score.toFixed(0)}/100`);
    const weaknesses = row.scores
      .filter((s) => s.score <= 45)
      .map((s) => `${s.criterion}: ${s.score.toFixed(0)}/100`);

    return {
      option: row.option,
      strengths,
      weaknesses,
    };
  });

  const winner = rows[0];
  const runnerUp = rows[1];

  let recommendation = `Recommended: ${winner.option} (score: ${winner.totalScore.toFixed(1)})`;
  if (runnerUp) {
    const gap = winner.totalScore - runnerUp.totalScore;
    if (gap < 5) {
      recommendation += ` - Very close to ${runnerUp.option} (gap ${gap.toFixed(1)}). Compare qualitative trade-offs before locking in.`;
    } else {
      recommendation += ` - Beats ${runnerUp.option} by ${gap.toFixed(1)} points on weighted criteria.`;
    }
  }

  const spread = runnerUp ? winner.totalScore - runnerUp.totalScore : Math.max(0, winner.totalScore - 50);
  const confidence = Math.max(55, Math.min(95, 65 + spread));

  const topStrengths = winner.scores
    .slice()
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .slice(0, 3)
    .map((s) => `${s.criterion} (${s.score.toFixed(0)})`);

  const reasoningParts = [
    `Evaluated ${options.length} option${options.length === 1 ? '' : 's'} across ${detectedCriteria.length} criteria with weighted scoring.`,
    topStrengths.length
      ? `Key strengths for ${winner.option}: ${topStrengths.join(', ')}.`
      : 'Add more context or criteria to surface clearer differentiators.',
  ];

  if (context.trim()) {
    reasoningParts.push('Factored in contextual signals from the provided brief to adjust weights and scores.');
  }

  const reasoning = reasoningParts.join(' ');

  return {
    matrix: rows,
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
  (input) => `${input.options.join(' ')} ${input.context || ''}`.slice(0, 200),
);

