/*
  Convention Score & Patch Format (TypeScript)
  -------------------------------------------
  Drop-in utilities to:
    1) Compute a "convention score" for model outputs using a repo-agnostic Project Brief
    2) Define and apply a minimal Patch format for Fixer outputs
    3) Provide a simple tournament selection over best-of-N candidates

  Works with the other files in canvas:
    - repo_portable_tools.ts (buildProjectBrief, lightweightSymbolIndexer)
    - repo_portable_runner*.ts (execution pipeline producing ExecReport)

  Typical usage in an agent loop:
    const brief = await buildProjectBrief(root);
    const candidates = await generateN(n); // model produces N JSON candidates with files[]
    const reports = await Promise.all(candidates.map(writeAndRun)); // uses runPortablePipeline
    const scores = candidates.map((c, i) => conventionScore({ candidate: c, brief, exec: reports[i] }));
    const winner = tournamentSelect(candidates, scores);
*/

import * as fs from 'fs';
import * as path from 'path';
import { buildProjectBrief } from './repo-portable-tools.js';

// -----------------------------
// Types expected from your agent
// -----------------------------
export type GeneratedCandidate = {
  files: { path: string; content: string }[];
  tests?: { path: string; content: string }[];
  notes?: string;
  conventions_used?: Array<{ new: string; mirrors: string[] }>;
};

export type ExecReport = {
  compiled: boolean;
  lintErrors: string[];
  typeErrors: string[];
  test: { passed: number; failed: number; details: string[]; coveragePct?: number };
  schemaErrors?: string[];
  boundaryErrors?: string[];
  logsTail?: string[];
};

export type ProjectBrief = Awaited<ReturnType<typeof buildProjectBrief>>;

// -----------------------------
// 1) CONVENTION SCORE
// -----------------------------

type ScoreBreakdown = {
  identifierMatch: number;   // 0..1  glossary & casing
  boundaries: number;        // 0..1  1 if no boundary errors
  schemaConformance: number; // 0..1  1 if no schema errors
  filePattern: number;       // 0..1  neighbors naming pattern
  execSignals: number;       // 0..1  derived from ExecReport (tests/lint/type)
  total: number;             // weighted sum
};

export type ConventionScoreInput = {
  candidate: GeneratedCandidate;
  brief: ProjectBrief;
  exec: ExecReport;
  repoRoot?: string; // optional, for neighbor heuristics
};

function tokenizeIdentifiers(text: string): string[] {
  return (text.match(/[A-Za-z_][A-Za-z0-9_\-]*/g) || []).filter(t => t.length > 2);
}

function casingScore(token: string, brief: ProjectBrief) {
  const isUpperSnake = /^[A-Z]+(?:_[A-Z0-9]+)+$/.test(token);
  const isSnake = /^[a-z]+(?:_[a-z0-9]+)+$/.test(token);
  const isCamel = /^[a-z]+(?:[A-Z][a-z0-9]*)+$/.test(token);
  const isPascal = /^[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]*)*$/.test(token);
  // Heuristic: constants vs types vs vars not known; award if matches any recommended
  const recs = new Set([brief.naming.var, brief.naming.type, brief.naming.const]);
  const ok = (
    (isUpperSnake && recs.has('UPPER_SNAKE_CASE')) ||
    (isSnake && recs.has('snake_case')) ||
    (isCamel && recs.has('camelCase')) ||
    (isPascal && recs.has('PascalCase'))
  );
  return ok ? 1 : 0;
}

function jaccard(a: Set<string>, b: Set<string>) {
  const inter = new Set([...a].filter(x => b.has(x))).size;
  const uni = new Set([...a, ...b]).size || 1;
  return inter / uni;
}

function neighborFilePatternScore(candidate: GeneratedCandidate, repoRoot?: string): number {
  if (!repoRoot) return 1; // neutral when unknown
  // Compare new file basenames to existing ones in same directory for suffix/prefix patterns
  let scores: number[] = [];
  for (const f of candidate.files) {
    try {
      const abs = path.resolve(repoRoot, f.path);
      const dir = path.dirname(abs);
      const base = path.basename(abs);
      const entries = fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isFile()).map(e => e.name);
      // Simple pattern: suffixes like *Service, *Controller, *Repository, *.spec, test_* etc
      const patterns = [/Service\./i,/Controller\./i,/Repository\./i,/\.spec\./i,/\.test\./i,/^test_/i,/\.dto\./i];
      const neighborHit = entries.some(n => patterns.some(p => p.test(n)) && patterns.some(p => p.test(base)));
      scores.push(neighborHit ? 1 : 0.7); // partial credit if nothing to compare
    } catch { scores.push(0.8); }
  }
  return scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : 1;
}

export function conventionScore(input: ConventionScoreInput): ScoreBreakdown {
  const { candidate, brief, exec, repoRoot } = input;
  const codeText = candidate.files.map(f => f.content).join('\n');
  const idents = new Set(tokenizeIdentifiers(codeText));
  const glossary = new Set((brief.glossary || []).map(String));

  // Identifier match: blend glossary overlap + casing compliance
  const overlap = jaccard(idents, glossary); // 0..1
  const casingScores = [...idents].map(t => casingScore(t, brief));
  const casing = idents.size ? casingScores.reduce((a: number, b: number) => a + b, 0) / idents.size : 1;
  const identifierMatch = 0.6 * overlap + 0.4 * casing;

  // Boundaries & schema from exec signals
  const boundaries = exec.boundaryErrors && exec.boundaryErrors.length ? 0 : 1;
  const schemaConformance = exec.schemaErrors && exec.schemaErrors.length ? 0 : 1;

  // File pattern heuristic
  const filePattern = neighborFilePatternScore(candidate, repoRoot);

  // Exec signals: pass if no lint/type/test fails, partial if tests pass but lint/type noisy
  const lintClean = (exec.lintErrors || []).length === 0;
  const typeClean = (exec.typeErrors || []).length === 0;
  const testsClean = exec.test && exec.test.failed === 0;
  const execSignals = (lintClean && typeClean && testsClean) ? 1 : (testsClean ? 0.6 : 0.2);

  // Weighted sum (tuneable)
  const total = (
    0.35 * identifierMatch +
    0.20 * boundaries +
    0.15 * schemaConformance +
    0.10 * filePattern +
    0.20 * execSignals
  );

  return { identifierMatch, boundaries, schemaConformance, filePattern, execSignals, total };
}

// -----------------------------
// 2) PATCH FORMAT + APPLY
// -----------------------------
export type PatchOp =
  | { kind: 'add'; path: string; content: string }
  | { kind: 'remove'; path: string }
  | { kind: 'edit'; path: string; find: string; replace: string; occurrences?: number }
  | { kind: 'splice'; path: string; start: number; deleteCount: number; insert?: string };

export type Patch = { ops: PatchOp[] };

export function applyPatch(root: string, patch: Patch) {
  for (const op of patch.ops) {
    const abs = path.resolve(root, op.path);
    if (op.kind === 'add') {
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, op.content, 'utf8');
    } else if (op.kind === 'remove') {
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    } else if (op.kind === 'edit') {
      const text = fs.readFileSync(abs, 'utf8');
      const occ = op.occurrences ?? 1;
      let remaining = occ, idx = 0, cur = text;
      while (remaining > 0) {
        idx = cur.indexOf(op.find, idx);
        if (idx < 0) break;
        cur = cur.slice(0, idx) + op.replace + cur.slice(idx + op.find.length);
        idx += op.replace.length; remaining--;
      }
      fs.writeFileSync(abs, cur, 'utf8');
    } else if (op.kind === 'splice') {
      const text = fs.readFileSync(abs, 'utf8');
      const before = text.slice(0, op.start);
      const after = text.slice(op.start + op.deleteCount);
      fs.writeFileSync(abs, before + (op.insert ?? '') + after, 'utf8');
    }
  }
}

export function diffSizeGuard(patch: Patch, maxBytes = 50_000, maxOps = 50): { ok: boolean; reason?: string } {
  const ops = patch.ops.length; if (ops > maxOps) return { ok: false, reason: `too many ops: ${ops}` };
  const size = patch.ops.reduce((n, op) => n + (op.kind === 'add' || op.kind === 'edit' ? (op as any).content?.length || (op as any).replace?.length || 0 : 0), 0);
  if (size > maxBytes) return { ok: false, reason: `patch content too large: ${size}` };
  return { ok: true };
}

// -----------------------------
// 3) TOURNAMENT SELECTION
// -----------------------------
export function tournamentSelect(candidates: GeneratedCandidate[], scores: ScoreBreakdown[], k = 2) {
  // Pairwise elimination by score.total, with small tie-breakers: higher execSignals then identifierMatch
  let idxs = candidates.map((_, i) => i);
  while (idxs.length > 1) {
    const next: number[] = [];
    for (let i = 0; i < idxs.length; i += k) {
      const chunk = idxs.slice(i, i + k);
      let best = chunk[0];
      for (const j of chunk.slice(1)) {
        const a = scores[best], b = scores[j];
        const aKey = a.total + 0.001*a.execSignals + 0.0001*a.identifierMatch;
        const bKey = b.total + 0.001*b.execSignals + 0.0001*b.identifierMatch;
        best = (bKey > aKey) ? j : best;
      }
      next.push(best);
    }
    idxs = next;
  }
  return { winner: candidates[idxs[0]], winnerIndex: idxs[0], score: scores[idxs[0]] };
}

// -----------------------------
// Helper: validate Fixer output shape for your judge
// -----------------------------
export function validateFixerPatch(patch: any): { ok: boolean; errors?: string[] } {
  const errs: string[] = [];
  if (!patch || typeof patch !== 'object' || !Array.isArray(patch.ops)) errs.push('`ops` array required');
  else for (const [i, op] of patch.ops.entries()) {
    if (!op.kind || !op.path) errs.push(`op[${i}] missing kind/path`);
    if (!['add','remove','edit','splice'].includes(op.kind)) errs.push(`op[${i}] invalid kind ${op.kind}`);
    if (op.kind === 'edit' && (typeof op.find !== 'string' || typeof op.replace !== 'string')) errs.push(`op[${i}] edit requires find/replace strings`);
    if (op.kind === 'splice' && (typeof op.start !== 'number' || typeof op.deleteCount !== 'number')) errs.push(`op[${i}] splice requires start/deleteCount numbers`);
  }
  return errs.length ? { ok: false, errors: errs } : { ok: true };
}

// -----------------------------
// Example: glue it together
// -----------------------------
export async function evaluateCandidates(root: string, candidates: GeneratedCandidate[], run: (root:string, c:GeneratedCandidate)=>Promise<ExecReport>) {
  const brief = await buildProjectBrief(root);
  const results = [] as Array<{ idx:number; score: ScoreBreakdown; report: ExecReport }>;
  for (let i = 0; i < candidates.length; i++) {
    const report = await run(root, candidates[i]);
    const score = conventionScore({ candidate: candidates[i], brief, exec: report, repoRoot: root });
    results.push({ idx: i, score, report });
  }
  const { winnerIndex, score } = tournamentSelect(candidates, results.map(r => r.score));
  return { winnerIndex, score, results };
}

