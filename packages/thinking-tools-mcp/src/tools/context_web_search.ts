// packages/thinking-tools-mcp/src/tools/context_web_search.ts
import { webSearchAll } from "../lib/websearch.js";
import type { ServerContext } from "../lib/context.js";
import { ctxImportEvidenceTool } from "./ctx_import_evidence.js";

export const webSearchDescriptor = {
  name: "context_web_search",
  description: "Search the web (free fallback) and return top results.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: { query: { type: "string" }, k: { type: "number", default: 8 } },
    required:["query"]
  }
};

export async function webSearchTool(args:{query:string; k?:number}) {
  const hits = await webSearchAll(args.query);
  return { content: [{ type: "text", text: JSON.stringify(hits.slice(0, args.k ?? 8), null, 2) }] };
}

export const webSearchAndImportDescriptor = {
  name: "context_web_search_and_import",
  description: "Search the web then import results into evidence for downstream tools.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: { query: { type:"string" }, k: { type:"number", default: 8 }, group: { type:"string" } },
    required:["query"]
  }
};

export async function webSearchAndImportTool(args:{query:string; k?:number; group?:string}, ctx: ServerContext){
  const k = Math.max(1, Math.min(12, Number(args.k ?? 8)));
  const hits = await webSearchAll(args.query);
  const items = hits.slice(0, k).map(h => ({
    source: "web",
    title: h.title,
    snippet: h.snippet,
    uri: h.url,
    score: h.score
  }));
  return await ctxImportEvidenceTool({ items, group: args.group ?? "external/web", upsert: true }, ctx);
}

