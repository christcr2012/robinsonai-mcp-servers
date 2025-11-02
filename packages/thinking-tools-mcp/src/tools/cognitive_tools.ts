/**
 * Auto-filled Thinking Tools for Robinson Thinking Tools MCP
 * - Collects evidence paths (from collector, context engine, or user)
 * - Heuristically extracts bullets from evidence and populates artifacts
 * - Writes JSON + Markdown to .robctx/thinking/*
 */
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { getWorkspaceRoot, resolveWorkspacePath } from "@robinsonai/shared-llm";

type J = Record<string, any>;
type ToolDef = {
  name: string;
  description: string;
  inputSchema: J;
  handler: (args: J) => Promise<J>;
};

const OUT = join(getWorkspaceRoot(), ".robctx/thinking");
const iso = () => new Date().toISOString().replace(/[:.]/g,"-");
const clean = (s: string) => (s||"").replace(/\r\n/g,"\n");

async function ensureDir(p: string) { await fs.mkdir(p, { recursive: true }); }
async function write(base: string, json: J, md: string) {
  await ensureDir(OUT);
  const jsonPath = join(OUT, base + ".json");
  const mdPath   = join(OUT, base + ".md");
  await fs.writeFile(jsonPath, JSON.stringify(json, null, 2), "utf8");
  await fs.writeFile(mdPath, clean(md), "utf8");
  return { jsonPath, mdPath };
}

/* -------- evidence parsing helpers (simple heuristics) -------- */
function splitSentences(t: string): string[] {
  return clean(t).split(/\n+/).map(s=>s.trim()).filter(Boolean);
}
function pick(lines: string[], needles: RegExp[], max = 8) {
  const hits = lines.filter(l => needles.some(rx => rx.test(l)));
  // de-dup-ish and trim
  const uniq: string[] = [];
  for (const h of hits) {
    const k = h.toLowerCase();
    if (!uniq.some(u => u.toLowerCase() === k)) uniq.push(h);
    if (uniq.length >= max) break;
  }
  return uniq;
}
async function readEvidence(paths: string[]) {
  const out: { path: string; text: string }[] = [];

  for (const p of (paths||[])) {
    try {
      // Resolve path relative to workspace root if not absolute
      const absolutePath = resolveWorkspacePath(p);
      const t = await fs.readFile(absolutePath, "utf8");
      out.push({ path: p, text: t });
    } catch (err: any) {
      // Log error for debugging but continue processing other files
      console.error(`[readEvidence] Failed to read ${p}: ${err.message}`);
    }
  }
  return out;
}

/* ---------------- SWOT ---------------- */
const RX_STRENGTH = [/success|works well|advantage|fast|reliable|passes|good/i];
const RX_WEAKNESS = [/bug|issue|problem|slow|fragile|missing|placeholder|stub|risk/i];
const RX_OPPORT   = [/could|opportunity|extend|improve|optimi|add|future/i];
const RX_THREAT   = [/break|outage|security|leak|regress|downtime|attack|cost overrun/i];

const think_swot: ToolDef = {
  name: "think_swot",
  description: "Auto-populated SWOT from evidence; writes MD+JSON",
  inputSchema: {
    type: "object",
    properties: {
      subject: { type: "string" },
      evidence_paths: { type: "array", items: { type: "string" } },
      autofill: { type: "boolean", default: true }
    },
    required: ["subject"]
  },
  handler: async ({ subject, evidence_paths = [], autofill = true }) => {
    const base = `swot--${subject.slice(0,60)}--${iso()}`;
    const ev = await readEvidence(evidence_paths);
    const strengths:string[] = [], weaknesses:string[] = [], opportunities:string[] = [], threats:string[] = [];
    if (autofill) {
      for (const doc of ev) {
        const lines = splitSentences(doc.text);
        strengths.push(...pick(lines, RX_STRENGTH, 4));
        weaknesses.push(...pick(lines, RX_WEAKNESS, 6));
        opportunities.push(...pick(lines, RX_OPPORT, 6));
        threats.push(...pick(lines, RX_THREAT, 6));
      }
    }
    const json = {
      subject, evidence_paths,
      strengths: strengths.map(t=>({ text: t })), weaknesses: weaknesses.map(t=>({ text: t })),
      opportunities: opportunities.map(t=>({ text: t })), threats: threats.map(t=>({ text: t })),
      created_at: new Date().toISOString()
    };
    const md =
`# SWOT — ${subject}

## Strengths
${strengths.map(s=>`- ${s}`).join("\n") || "- (none yet)"}

## Weaknesses
${weaknesses.map(s=>`- ${s}`).join("\n") || "- (none yet)"}

## Opportunities
${opportunities.map(s=>`- ${s}`).join("\n") || "- (none yet)"}

## Threats
${threats.map(s=>`- ${s}`).join("\n") || "- (none yet)"}

### Evidence
${(evidence_paths||[]).map((p: string)=>`- ${p}`).join("\n") || "- (none)"}
`;
    return { ok: true, ...(await write(base, json, md)) };
  }
};

/* ---------------- Devil's Advocate ---------------- */
const RX_COUNTER = [/however|but |concern|counter|conflict|contradict|unknown|assume/i];
const RX_TEST    = [/test|reproduce|verify|po[ck] /i];

const think_devils_advocate: ToolDef = {
  name: "think_devils_advocate",
  description: "Extract counter-arguments + falsification tests from evidence.",
  inputSchema: {
    type: "object",
    properties: {
      claim: { type: "string" },
      evidence_paths: { type: "array", items: { type: "string" } },
      autofill: { type: "boolean", default: true }
    },
    required: ["claim"]
  },
  handler: async ({ claim, evidence_paths = [], autofill = true }) => {
    const base = `devils-advocate--${claim.slice(0,60)}--${iso()}`;
    const ev = await readEvidence(evidence_paths);
    const counters:string[] = [], tests:string[] = [];
    if (autofill) {
      for (const doc of ev) {
        const lines = splitSentences(doc.text);
        counters.push(...pick(lines, RX_COUNTER, 10));
        tests.push(...pick(lines, RX_TEST, 6));
      }
    }
    const json = { claim, evidence_paths, counters, tests, created_at: new Date().toISOString() };
    const md =
`# Devil's Advocate — ${claim}

## Counters
${counters.map(c=>`- ${c}`).join("\n") || "- (none yet)"}

## Falsification Tests
${tests.map(t=>`- ${t}`).join("\n") || "- (none yet)"}

### Evidence
${(evidence_paths||[]).map((p: string)=>`- ${p}`).join("\n") || "- (none)"}
`;
    return { ok: true, ...(await write(base, json, md)) };
  }
};

/* ---------------- Premortem ---------------- */
const RX_FAIL = [/fail|break|blocked|timeout|crash|null|none|misconfig|missing/i];
const think_premortem: ToolDef = {
  name: "think_premortem",
  description: "Premortem from evidence (failure modes, mitigations skeleton).",
  inputSchema: {
    type: "object",
    properties: {
      project: { type: "string" },
      horizon_days: { type: "number", default: 30 },
      evidence_paths: { type: "array", items: { type: "string" } },
      autofill: { type: "boolean", default: true }
    },
    required: ["project"]
  },
  handler: async ({ project, horizon_days = 30, evidence_paths = [], autofill = true }) => {
    const base = `premortem--${project.slice(0,60)}--${iso()}`;
    const ev = await readEvidence(evidence_paths);
    const failures:string[] = [];
    if (autofill) {
      for (const doc of ev) failures.push(...pick(splitSentences(doc.text), RX_FAIL, 10));
    }
    const json = { project, horizon_days, failures: failures.map(f=>({ mode: f, impact:"med", mitigation:"" })), evidence_paths };
    const md =
`# Premortem — ${project} (horizon ${horizon_days}d)

## Failure Modes (auto-extracted)
${failures.map(f=>`- ${f}`).join("\n") || "- (none yet)"}

## Mitigations
- …

### Evidence
${(evidence_paths||[]).map((p: string)=>`- ${p}`).join("\n") || "- (none)"}
`;
    return { ok: true, ...(await write(base, json, md)) };
  }
};

/* ---------------- Decision Matrix ---------------- */
const think_decision_matrix: ToolDef = {
  name: "think_decision_matrix",
  description: "Decision matrix skeleton (you can fill scores in CSV/JSON).",
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string" },
      options: { type: "array", items: { type: "string" } },
      criteria: { type: "array", items: { type: "string" } },
      weights: { type: "array", items: { type: "number" } }
    },
    required: ["title","options","criteria","weights"]
  },
  handler: async ({ title, options, criteria, weights }) => {
    if (weights.length !== criteria.length) throw new Error("weights length must equal criteria length");
    const base = `decision--${title.slice(0,60)}--${iso()}`;
    const scores = Object.fromEntries((options as string[]).map(o => [o, Object.fromEntries(criteria.map((c:string)=>[c,0]))]));
    const json = { title, criteria, weights, scores, totals:{}, recommendation:"" };
    const csv = ["option", ...criteria].join(",") + "\n" + (options as string[]).map(o => [o, ...criteria.map(()=>0)].join(",")).join("\n");
    const md =
`# Decision Matrix — ${title}

\`\`\`csv
${csv}
\`\`\`
`;
    return { ok: true, ...(await write(base, json, md)) };
  }
};

/* ---------------- Checklist ---------------- */
const DEFAULT_CHECKS = [
  "Purpose & scope stated",
  "Interfaces & contracts explicit",
  "Tests planned and runnable",
  "No TODO/PLACEHOLDER/Stub remains",
  "Rollback plan documented",
  "Risks & mitigations listed"
];

const think_critique_checklist: ToolDef = {
  name: "think_critique_checklist",
  description: "Checklist over a draft file; auto-add warnings if TODO/PLACEHOLDER appear.",
  inputSchema: {
    type: "object",
    properties: {
      draft_path: { type: "string" },
      checklist: { type: "array", items: { type: "string" } }
    },
    required: ["draft_path"]
  },
  handler: async ({ draft_path, checklist = DEFAULT_CHECKS }) => {
    let warn = "";
    try {
      const t = await fs.readFile(draft_path, "utf8");
      if (/(TODO|PLACEHOLDER|stub)/i.test(t)) warn = "Detected TODO/PLACEHOLDER/stub markers.";
    } catch { /* ignore */ }
    const base = `critique--${draft_path.replace(/[\\/:]+/g,"-").slice(0,80)}--${iso()}`;
    const json = { draft_path, checklist, warning: warn };
    const md =
`# Checklist — ${draft_path}

${checklist.map((c: string)=>`- [ ] ${c}`).join("\n")}

> ${warn || "No automatic warnings."}
`;
    return { ok: true, ...(await write(base, json, md)) };
  }
};

/* ---------------- One-shot packet ---------------- */
const think_auto_packet: ToolDef = {
  name: "think_auto_packet",
  description: "Create a populated review packet (SWOT + Premortem + Devil's + Checklist) from evidence.",
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string" },
      evidence_paths: { type: "array", items: { type: "string" } }
    },
    required: ["title"]
  },
  handler: async ({ title, evidence_paths = [] }) => {
    const sw  = await think_swot.handler({ subject: title, evidence_paths, autofill: true });
    const pm  = await think_premortem.handler({ project: title, evidence_paths, autofill: true });
    const da  = await think_devils_advocate.handler({ claim: title, evidence_paths, autofill: true });
    const chk = await think_critique_checklist.handler({ draft_path: evidence_paths[0] || "" });
    return { ok: true, packet: { sw, pm, da, chk } };
  }
};

export function getCognitiveTools(): ToolDef[] {
  return [think_swot, think_devils_advocate, think_premortem, think_decision_matrix, think_critique_checklist, think_auto_packet];
}

