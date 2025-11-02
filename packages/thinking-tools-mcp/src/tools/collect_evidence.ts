import { rankRepoFiles } from "../lib/evidence.js";
import { resolve } from "node:path";

type J = Record<string, any>;
type Tool = { name:string; description:string; inputSchema:J; handler:(args:J)=>Promise<J> };

export const collect_evidence: Tool = {
  name: "think_collect_evidence",
  description: "Rank repo files by query relevance (simple term-score). Returns top K with relative paths.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Keywords/short sentence" },
      limit: { type: "number", default: 25 },
      repo_root: { type: "string", description: "Root folder; defaults to current working dir" }
    },
    required: ["query"]
  },
  handler: async ({ query, limit = 25, repo_root = "." }) => {
    const root = resolve(repo_root);
    const ranked = await rankRepoFiles({ repoRoot: root, query, limit });
    return { ok: true, root, results: ranked };
  }
};

export function getCollectorTools() { return [collect_evidence]; }

