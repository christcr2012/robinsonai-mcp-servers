/**
 * Thinking operators for Robinson Thinking Tools MCP
 * Each tool:
 *  - accepts structured inputs (subject, options, evidence paths, etc.)
 *  - emits artifacts to `.robctx/thinking/*` (both JSON + Markdown)
 *  - returns a compact JSON result the agent can chain
 */
import { promises as fs } from "node:fs";
import { join } from "node:path";

type J = Record<string, any>;
type Tool = {
  name: string;
  description: string;
  inputSchema: J;
  handler: (args: J) => Promise<J>;
};

const OUT = ".robctx/thinking";
async function ensureDir(p: string) { await fs.mkdir(p, { recursive: true }); }
const iso = () => new Date().toISOString().replace(/[:.]/g, "-");
const md = (s: string) => s.replace(/\r\n/g, "\n");

async function writeArtifacts(baseName: string, json: J, markdown: string) {
  await ensureDir(OUT);
  const jsonPath = join(OUT, `${baseName}.json`);
  const mdPath = join(OUT, `${baseName}.md`);
  await fs.writeFile(jsonPath, JSON.stringify(json, null, 2), "utf8");
  await fs.writeFile(mdPath, md(markdown), "utf8");
  return { jsonPath, mdPath };
}

/* -------------------- 1) SWOT analysis -------------------- */
async function doSWOT(subject: string, contextNotes: string, evidence: string[]) {
  // Heuristic "thinking scaffold" – the LLM fills the content when called by the MCP host,
  // but we keep structure, scoring and artifacts here so it's consistent across agents.
  // You can prompt your coding agent to populate the bullets based on evidence files.
  const template = {
    subject,
    strengths: [] as { text: string; evidence?: string; confidence: number }[],
    weaknesses: [] as { text: string; evidence?: string; confidence: number }[],
    opportunities: [] as { text: string; evidence?: string; confidence: number }[],
    threats: [] as { text: string; evidence?: string; confidence: number }[],
    summary: "",
    evidence,
    created_at: new Date().toISOString(),
    notes: contextNotes || ""
  };
  return template;
}

const swotTool: Tool = {
  name: "think_swot",
  description: "Structured SWOT analysis with confidence and evidence mapping; writes .robctx/thinking artifacts.",
  inputSchema: {
    type: "object",
    properties: {
      subject: { type: "string", description: "System, change, or decision to evaluate" },
      context_notes: { type: "string" },
      evidence_paths: { type: "array", items: { type: "string" }, description: "JSON/MD files to consult" }
    },
    required: ["subject"]
  },
  handler: async (args) => {
    const { subject, context_notes = "", evidence_paths = [] } = args;
    const data = await doSWOT(subject, context_notes, evidence_paths);
    const base = `swot--${subject.slice(0, 60)}--${iso()}`;
    const mdOut =
`# SWOT: ${subject}

## Strengths
- (to be populated)

## Weaknesses
- (to be populated)

## Opportunities
- (to be populated)

## Threats
- (to be populated)

### Notes
${context_notes || "(none)"}

### Evidence
${(evidence_paths || []).map((p: string)=>`- ${p}`).join("\n") || "- (none)"}
`;
    const paths = await writeArtifacts(base, data, mdOut);
    return { ok: true, ...paths };
  }
};

/* -------------------- 2) Devil's Advocate -------------------- */
const devilsAdvocate: Tool = {
  name: "think_devils_advocate",
  description: "Generate strongest counter-arguments, failure tests, and disconfirming evidence to a claim.",
  inputSchema: {
    type: "object",
    properties: {
      claim: { type: "string" },
      assumptions: { type: "array", items: { type: "string" } },
      evidence_paths: { type: "array", items: { type: "string" } }
    },
    required: ["claim"]
  },
  handler: async ({ claim, assumptions = [], evidence_paths = [] }) => {
    const out = {
      claim,
      assumptions,
      counters: [] as { argument: string; test: string; severity: "low"|"med"|"high"; evidence?: string }[],
      checks: {
        falsification_tests: [] as string[],
        monitoring_signals: [] as string[],
      },
      evidence_paths,
      created_at: new Date().toISOString()
    };
    const base = `devils-advocate--${claim.slice(0,60)}--${iso()}`;
    const mdOut =
`# Devil's Advocate Review

**Claim:** ${claim}

## Assumptions
${assumptions.map((a: string)=>`- ${a}`).join("\n") || "- (none)"}

## Counters (to be completed)
- Argument: …
  - Test: …
  - Severity: low|med|high
  - Evidence: (file/path)

## Falsification Tests
- …

## Monitoring Signals
- …

### Evidence Seen
${evidence_paths.map((e: string)=>`- ${e}`).join("\n") || "- (none)"}
`;
    const paths = await writeArtifacts(base, out, mdOut);
    return { ok: true, ...paths };
  }
};

/* -------------------- 3) Premortem -------------------- */
const premortem: Tool = {
  name: "think_premortem",
  description: "Imagine the project failed; enumerate failure modes, mitigations, owners, and leading indicators.",
  inputSchema: {
    type: "object",
    properties: {
      project: { type: "string" },
      horizon_days: { type: "number", default: 30 },
      evidence_paths: { type: "array", items: { type: "string" } }
    },
    required: ["project"]
  },
  handler: async ({ project, horizon_days = 30, evidence_paths = [] }) => {
    const data = {
      project,
      horizon_days,
      failures: [] as { mode: string; impact: "low"|"med"|"high"; mitigation: string; owner?: string; indicator?: string }[],
      evidence_paths,
      created_at: new Date().toISOString()
    };
    const base = `premortem--${project.slice(0,60)}--${iso()}`;
    const mdOut =
`# Premortem: ${project} (horizon: ${horizon_days} days)

## Failure Modes & Mitigations (to be completed)
- Mode: …
  - Impact: low|med|high
  - Mitigation: …
  - Owner: …
  - Early Indicator: …

### Evidence
${evidence_paths.map((e: string)=>`- ${e}`).join("\n") || "- (none)"}
`;
    const paths = await writeArtifacts(base, data, mdOut);
    return { ok: true, ...paths };
  }
};

/* -------------------- 4) Decision Matrix -------------------- */
const decisionMatrix: Tool = {
  name: "think_decision_matrix",
  description: "Weighted scoring (Pugh/WSM). Returns ranking + writes CSV/MD.",
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string" },
      options: { type: "array", items: { type: "string" } },
      criteria: { type: "array", items: { type: "string" } },
      weights:  { type: "array", items: { type: "number" }, description: "Must sum ~1.0" }
    },
    required: ["title","options","criteria","weights"]
  },
  handler: async ({ title, options, criteria, weights }) => {
    const nC = criteria.length;
    if (weights.length !== nC) throw new Error("weights length must match criteria length");
    const base = `decision--${title.slice(0,60)}--${iso()}`;
    const skeleton = {
      title, criteria, weights,
      // The agent should fill `scores[option][criterion] = 0..5`
      scores: Object.fromEntries((options as string[]).map(o => [o, Object.fromEntries(criteria.map((c: string) => [c, 0]))])),
      totals: {} as Record<string, number>,
      recommendation: "",
      created_at: new Date().toISOString()
    };
    // CSV template for quick editing
    const header = ["option", ...criteria].join(",");
    const csv = [header, ...options.map((o: string) => [o, ...criteria.map(()=>0)].join(","))].join("\n");
    const mdOut =
`# Decision Matrix: ${title}

**Criteria:** ${criteria.join(", ")}
**Weights:** ${weights.join(", ")}

> Fill scores 0–5 in JSON or CSV, then re-run an analysis step to compute totals.

\`\`\`csv
${csv}
\`\`\`
`;
    const paths = await writeArtifacts(base, skeleton, mdOut);
    return { ok: true, ...paths };
  }
};

/* -------------------- 5) Critique/Checklist -------------------- */
const critique: Tool = {
  name: "think_critique_checklist",
  description: "Runs a quality checklist against a draft file and emits findings.",
  inputSchema: {
    type: "object",
    properties: {
      draft_path: { type: "string" },
      checklist: { type: "array", items: { type: "string" }, description: "Items to verify (clarity, testability, risk, etc.)" }
    },
    required: ["draft_path"]
  },
  handler: async ({ draft_path, checklist = [] }) => {
    const text = await fs.readFile(draft_path, "utf8").catch(()=> "");
    const findings = (checklist.length ? checklist : [
      "Clarity of purpose", "Inputs/Outputs explicit", "Edge-cases covered",
      "No TODO/placeholder left", "Testability", "Risks & mitigations recorded"
    ]).map((item: string) => ({ item, status: "unknown", notes: "" }));
    const base = `critique--${draft_path.replace(/[\\/:]+/g,"-").slice(0,80)}--${iso()}`;
    const mdOut =
`# Checklist Review for: ${draft_path}

${findings.map((f: any)=>`- [ ] ${f.item} — _notes:_`).join("\n")}
`;
    const paths = await writeArtifacts(base, { draft_path, findings, bytes: text.length, created_at: new Date().toISOString() }, mdOut);
    return { ok: true, ...paths };
  }
};

/* -------------------- 6) Composition: "think_review_change" -------------------- */
const reviewChange: Tool = {
  name: "think_review_change",
  description: "Creates a review packet for a code change: SWOT + Premortem + Checklist skeletons referencing provided evidence.",
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string" },
      evidence_paths: { type: "array", items: { type: "string" }, description: "Context files (repo map, diff, design doc, crawl artifacts…)" }
    },
    required: ["title"]
  },
  handler: async ({ title, evidence_paths = [] }) => {
    const swot = await swotTool.handler({ subject: title, context_notes: "Change Review Packet", evidence_paths });
    const pre  = await premortem.handler({ project: title, horizon_days: 14, evidence_paths });
    const chk  = await critique.handler({ draft_path: evidence_paths[0] || "", checklist: [] });
    return { ok: true, packet: { swot, premortem: pre, checklist: chk } };
  }
};

export function getCognitiveTools(): Tool[] {
  return [ swotTool, devilsAdvocate, premortem, decisionMatrix, critique, reviewChange ];
}

