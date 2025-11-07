import { promises as fs } from "node:fs";
import { join, basename, dirname, resolve } from "node:path";
import { resolveWorkspacePath } from "../lib/workspace.js";

type J = Record<string, any>;
type Tool = { name: string; description: string; inputSchema: J; handler: (args: J) => Promise<J> };

const THINK_DIR = ".robctx/thinking";
const PROMPTS_DIR = ".robctx/thinking/prompts";
const iso = () => new Date().toISOString().replace(/[:.]/g, "-");
const norm = (p: string) => p.replace(/\\/g, "/");

async function ensureDir(p: string) { await fs.mkdir(p, { recursive: true }); }

function chunkText(t: string, max = 8000) {
  // chunk by paragraph to keep context coherent
  const paras = t.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const chunks: string[] = [];
  let cur = "";
  for (const p of paras) {
    if ((cur + "\n\n" + p).length > max) {
      if (cur) chunks.push(cur.trim());
      if (p.length > max) {
        // hard-split oversized paragraphs
        for (let i = 0; i < p.length; i += max) chunks.push(p.slice(i, i + max));
        cur = "";
      } else {
        cur = p;
      }
    } else {
      cur = cur ? cur + "\n\n" + p : p;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

async function readMany(paths: string[]) {
  const out: { path: string; content: string }[] = [];
  for (const p of paths) {
    try {
      // Resolve path relative to workspace root
      const absolutePath = resolveWorkspacePath(p);
      const c = await fs.readFile(absolutePath, "utf8");
      out.push({ path: norm(p), content: c });
    } catch (err: any) {
      console.error(`[readMany] Failed to read ${p}: ${err.message}`);
    }
  }
  return out;
}

/** ---------- Tool A: prepare LLM prompt payload ---------- */
export const think_llm_rewrite_prep: Tool = {
  name: "think_llm_rewrite_prep",
  description:
    "Build a structured prompt payload from artifacts + optional evidence. Saves JSON under .robctx/thinking/prompts and returns it.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string", description: "Short task title (goes into prompt)" },
      artifact_md_paths: { type: "array", items: { type: "string" }, description: "Paths to .md artifacts to rewrite" },
      evidence_paths: { type: "array", items: { type: "string" }, description: "Optional extra repo files to include as context (excerpted)" },
      output_style: { type: "string", default: "concise-professional" },
      acceptance_criteria: { type: "array", items: { type: "string" }, description: "Optional explicit done-ness bullets" },
      max_chunk: { type: "number", default: 8000 }
    },
    required: ["title", "artifact_md_paths"]
  },
  handler: async ({ title, artifact_md_paths = [], evidence_paths = [], output_style = "concise-professional", acceptance_criteria = [], max_chunk = 8000 }) => {
    await ensureDir(PROMPTS_DIR);

    // Load artifacts (full) and evidence (excerpt chunks)
    const artifacts = await readMany(artifact_md_paths);
    const evidence = await readMany(evidence_paths);

    const evidenceChunks = evidence.map(e => ({
      path: e.path,
      chunks: chunkText(e.content, max_chunk / 4)  // keep evidence lighter than artifacts
    }));

    const system = [
      "You are a senior staff engineer and technical editor.",
      "Rewrite the provided artifacts to be clear, deduplicated, and immediately actionable.",
      "Do not invent facts. Only use what's in artifacts + evidence.",
      "Preserve headings, lists, and structure. Improve clarity and completeness.",
      "Add acceptance criteria where helpful."
    ].join(" ");

    const user = {
      task: `Rewrite/upgrade artifacts for: ${title}`,
      style: output_style,
      acceptance_criteria,
      instructions: [
        "1) Merge duplicate bullets; remove placeholders.",
        "2) Convert vague lines into concrete, testable statements.",
        "3) Where a risk or TODO is mentioned, attach a specific mitigation or next step.",
        "4) Keep Markdown only. No backstory. No preliminary commentary.",
        "5) If something is missing, add a short 'Gaps' section with questions."
      ],
      artifacts: artifacts.map(a => ({
        path: a.path,
        chunks: chunkText(a.content, max_chunk)
      })),
      evidence: evidenceChunks
    };

    const payload = {
      type: "llm_rewrite_payload",
      created_at: new Date().toISOString(),
      model_hint: "claude-3.5-sonnet (or preferred coding model)",
      prompt: { system, user },
      io_contract: {
        input: "system + user JSON above",
        output: "pure Markdown per artifact, top-level heading retained"
      }
    };

    const base = `llm-rewrite--${title.slice(0, 60)}--${iso()}`;
    const path = join(PROMPTS_DIR, base + ".json");
    await fs.writeFile(path, JSON.stringify(payload, null, 2), "utf8");

    return { ok: true, prompt_path: norm(path), payload };
  }
};

/** ---------- Tool B: apply LLM output back to repo ---------- */
export const think_llm_apply: Tool = {
  name: "think_llm_apply",
  description:
    "Save model-rewritten Markdown next to original artifact. Creates *-llm.md and a small JSON note linking versions.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      original_md_path: { type: "string" },
      rewritten_md: { type: "string" }
    },
    required: ["original_md_path", "rewritten_md"]
  },
  handler: async ({ original_md_path, rewritten_md }) => {
    const orig = resolve(original_md_path);
    const dir = dirname(orig);
    const base = basename(orig).replace(/\.md$/i, "");
    const outMd = join(dir, `${base}.llm.md`);
    const note = join(dir, `${base}.llm.json`);

    await fs.writeFile(outMd, rewritten_md.replace(/\r\n/g, "\n"), "utf8");
    await fs.writeFile(note, JSON.stringify({
      llm_version_of: norm(original_md_path),
      created_at: new Date().toISOString(),
      path_md: norm(outMd)
    }, null, 2), "utf8");

    return { ok: true, saved_md: norm(outMd), saved_note: norm(note) };
  }
};

export function getLlmRewriteTools() { return [think_llm_rewrite_prep, think_llm_apply]; }

