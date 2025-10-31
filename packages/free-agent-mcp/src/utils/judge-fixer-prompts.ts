/*
  Judge & Fixer Prompts + Validators (TypeScript)
  ------------------------------------------------
  Drop-in artifacts:
    - Strong Judge/Fixer prompt templates (string constants) that are repo-agnostic
    - JSON-compatible TypeScript schemas for Judge verdict & Fixer patch
    - Lightweight runtime validators (no external deps) with clear error messages
    - Example glue for producing judge input from ExecReport + Brief

  Use with:
    - repo_portable_tools.ts (buildProjectBrief)
    - repo_portable_runner.ts (ExecReport with schema/boundary errors)
    - convention_score_patch.ts (Patch type already matches)
*/

// -----------------------------
// TYPES & SCHEMAS
// -----------------------------
export type JudgeScores = {
  compilation: number;        // 0..1
  tests_functional: number;   // 0..1
  tests_edge: number;         // 0..1
  types: number;              // 0..1
  style: number;              // 0..1 (lint/format)
  security: number;           // 0..1 (deps/imports sandbox)
  boundaries?: number;        // 0..1 (import layering)
  schema?: number;            // 0..1 (OpenAPI/GraphQL/Prisma etc.)
};

export type JudgeVerdict = {
  verdict: 'accept'|'revise'|'reject';
  scores: JudgeScores;
  explanations: { root_cause: string; minimal_fix: string };
  fix_plan: Array<{ file: string; operation: 'edit'|'add'|'remove'; brief: string }>;
};

export type JudgeInput = {
  spec: string;                        // concise problem statement
  brief: any;                          // result of buildProjectBrief(...)
  signals: {                           // from ExecReport
    lintErrors: string[];
    typeErrors: string[];
    test: { passed: number; failed: number; details: string[]; coveragePct?: number };
    schemaErrors?: string[];
    boundaryErrors?: string[];
    logsTail?: string[];
  };
  patchSummary?: Array<{ path: string; added: number; removed: number }>;
  modelNotes?: string;
};

// -----------------------------
// VALIDATORS
// -----------------------------
export function validateJudgeVerdict(obj: any): { ok: boolean; errors?: string[] } {
  const e: string[] = [];
  if (!obj || typeof obj !== 'object') return { ok: false, errors: ['verdict must be an object'] };
  if (!['accept','revise','reject'].includes(obj.verdict)) e.push('verdict must be accept|revise|reject');
  if (!obj.scores || typeof obj.scores !== 'object') e.push('scores required');
  else {
    const req = ['compilation','tests_functional','tests_edge','types','style','security'];
    for (const k of req) if (typeof obj.scores[k] !== 'number') e.push(`scores.${k} must be number 0..1`);
  }
  if (!obj.explanations || typeof obj.explanations?.root_cause !== 'string' || typeof obj.explanations?.minimal_fix !== 'string') e.push('explanations.root_cause & minimal_fix required');
  if (!Array.isArray(obj.fix_plan)) e.push('fix_plan must be an array');
  else for (const [i, fp] of obj.fix_plan.entries()) {
    if (!fp || typeof fp.file !== 'string' || !['edit','add','remove'].includes(fp.operation) || typeof fp.brief !== 'string') e.push(`fix_plan[${i}] requires {file, operation, brief}`);
  }
  return e.length ? { ok: false, errors: e } : { ok: true };
}

export type PatchOp =
  | { kind: 'add'; path: string; content: string }
  | { kind: 'remove'; path: string }
  | { kind: 'edit'; path: string; find: string; replace: string; occurrences?: number }
  | { kind: 'splice'; path: string; start: number; deleteCount: number; insert?: string };
export type Patch = { ops: PatchOp[] };

export function validateFixerPatch(patch: any, limits = { maxOps: 50, maxBytes: 50_000 }): { ok: boolean; errors?: string[] } {
  const errs: string[] = [];
  if (!patch || typeof patch !== 'object' || !Array.isArray(patch.ops)) errs.push('`ops` array required');
  else {
    if (patch.ops.length > limits.maxOps) errs.push(`too many ops: ${patch.ops.length} > ${limits.maxOps}`);
    let size = 0;
    for (const [i, op] of patch.ops.entries()) {
      if (!op.kind || !op.path) errs.push(`op[${i}] missing kind/path`);
      if (!['add','remove','edit','splice'].includes(op.kind)) errs.push(`op[${i}] invalid kind ${op.kind}`);
      if (op.kind === 'add' && typeof op.content !== 'string') errs.push(`op[${i}] add requires content`);
      if (op.kind === 'edit' && (typeof op.find !== 'string' || typeof op.replace !== 'string')) errs.push(`op[${i}] edit requires find/replace strings`);
      if (op.kind === 'splice' && (typeof op.start !== 'number' || typeof op.deleteCount !== 'number')) errs.push(`op[${i}] splice requires start/deleteCount numbers`);
      const bytes = op.content?.length || op.replace?.length || 0; size += bytes;
    }
    if (size > limits.maxBytes) errs.push(`patch content too large: ${size} > ${limits.maxBytes}`);
  }
  return errs.length ? { ok: false, errors: errs } : { ok: true };
}

// -----------------------------
// PROMPT TEMPLATES (string constants)
// -----------------------------
export const JUDGE_PROMPT = `You are a senior code reviewer.
Return ONLY strict JSON matching this schema:
{ "verdict":"accept|revise|reject",
  "scores":{
    "compilation":0..1,
    "tests_functional":0..1,
    "tests_edge":0..1,
    "types":0..1,
    "style":0..1,
    "security":0..1,
    "boundaries":0..1,
    "schema":0..1
  },
  "explanations":{ "root_cause":string, "minimal_fix":string },
  "fix_plan":[ {"file":string, "operation":"edit|add|remove", "brief":string} ]
}

Rules:
- If any compile/type/test/lint/security/boundary/schema error exists, set that score to 0 and verdict to "revise" unless the work is fundamentally off-spec (then "reject").
- Prefer minimal fixes. Do NOT reformat whole files.
- Check naming against the provided Glossary and casing recommendations; call out mismatches in root_cause.
- Check imports respect inferred boundaries.
- Check public types match generated schema types (when present).
`;

export const FIXER_PROMPT = `You are a precise code fixer. Apply ONLY minimal edits to pass all gates.
Input:
- TASK SPEC
- PROJECT BRIEF (naming, glossary, layers)
- DIAGNOSTICS (lint/type/test + schema/boundary) and Judge fix_plan

Output ONLY JSON in this schema:
{ "ops": [
  {"kind":"edit","path":string,"find":string,"replace":string,"occurrences":number?},
  {"kind":"splice","path":string,"start":number,"deleteCount":number,"insert":string?},
  {"kind":"add","path":string,"content":string},
  {"kind":"remove","path":string}
] }

Constraints:
- Keep existing public names unless diagnostics require a change.
- Mirror casing and names from the Glossary.
- Respect import boundaries; prefer local helpers.
- Do NOT introduce new deps or network calls.
- Keep patch small; avoid broad refactors.
`;

// -----------------------------
// GLUE: assemble JudgeInput from ExecReport + Brief
// -----------------------------
export function makeJudgeInput(args: {
  spec: string;
  brief: any;
  exec: {
    lintErrors: string[];
    typeErrors: string[];
    test: { passed: number; failed: number; details: string[]; coveragePct?: number };
    schemaErrors?: string[];
    boundaryErrors?: string[];
    logsTail?: string[];
  };
  patchSummary?: Array<{ path: string; added: number; removed: number }>;
  modelNotes?: string;
}): JudgeInput {
  return {
    spec: args.spec,
    brief: args.brief,
    signals: {
      lintErrors: args.exec.lintErrors || [],
      typeErrors: args.exec.typeErrors || [],
      test: args.exec.test,
      schemaErrors: args.exec.schemaErrors || [],
      boundaryErrors: args.exec.boundaryErrors || [],
      logsTail: args.exec.logsTail || [],
    },
    patchSummary: args.patchSummary || [],
    modelNotes: args.modelNotes || ''
  };
}

// -----------------------------
// Example guard for LLM outputs
// -----------------------------
export function guardJudgeAndPatchOutputs(judgeRaw: any, patchRaw: any) {
  const v1 = validateJudgeVerdict(judgeRaw);
  if (!v1.ok) return { ok: false, errors: ['Judge verdict invalid', ...(v1.errors||[])] };
  const v2 = validateFixerPatch(patchRaw);
  if (!v2.ok) return { ok: false, errors: ['Fixer patch invalid', ...(v2.errors||[])] };
  return { ok: true };
}

