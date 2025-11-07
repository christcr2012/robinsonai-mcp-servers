// packages/thinking-tools-mcp/src/tools/sequential_thinking.ts
import type { ServerContext } from "../lib/context.js";
import { webSearchAll } from "../lib/websearch.js";

export const sequentialThinkingDescriptor = {
  name: "sequential_thinking",
  description: "Structured multi-step analysis that blends repo + external context and emits a rich report.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      goal: { type:"string", description:"What to analyze or decide"},
      k: { type:"number", default: 8 },
      useWeb: { type:"boolean", default: false }
    },
    required:["goal"]
  }
};

export async function sequentialThinkingTool(args:{goal:string; k?:number; useWeb?:boolean}, ctx: ServerContext){
  const K = Math.max(4, Math.min(16, Number(args.k ?? 8)));
  const q = args.goal;

  // 1) gather (multi-query expansion)
  const variants = Array.from(new Set([
    q,
    q.replace(/\b(impl|implementation|method)\b/gi, "function"),
    q.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
  ]));
  const hits:any[] = [];
  for (const v of variants) hits.push(...await ctx.blendedSearch(v, Math.ceil(K/variants.length)));

  // 2) optional web evidence
  if (args.useWeb) {
    const res = await webFetch(ctx, q, Math.ceil(K/2));
    hits.push(...res);
  }

  // 3) categorize
  const code = hits.filter(h => /\.(ts|tsx|js|jsx|py|go|java|rs)$/i.test(String(h.uri||"")));
  const docs = hits.filter(h => !/\.(ts|tsx|js|jsx|py|go|java|rs)$/i.test(String(h.uri||"")));

  // 4) outline
  const outline = [
    "Executive Summary",
    "Context & Assumptions",
    "Options Considered",
    "Risks & Gaps",
    "Recommendations",
    "Evidence"
  ];

  const md = [
    `# Sequential Analysis`,
    `**Goal:** ${q}`,
    `**Found:** ${hits.length} items (${code.length} code, ${docs.length} docs)\n`,
    `## ${outline[0]}\n- _Fill in with the agent's model using the evidence below._`,
    `## ${outline[1]}\n- Repo signals + imported evidence.`,
    `## ${outline[2]}\n- Summarize alternative approaches if present in evidence.`,
    `## ${outline[3]}\n- Note uncertainties, TODOs, missing tests.`,
    `## ${outline[4]}\n- Concrete next actions.\n`,
    `## ${outline[5]}\n${hits.slice(0,K).map((h,i)=>`- [${h.title || h.uri}](${h.uri||""})`).join("\n")}`
  ].join("\n");

  return { content: [{ type:"text", text: md }] };

  async function webFetch(ctx: ServerContext, query: string, k: number){
    // call our web search to keep everything in evidence
    try {
      const r = await webSearchAll(query);
      return (Array.isArray(r) ? r.slice(0,k) : []);
    } catch {
      return [];
    }
  }
}

