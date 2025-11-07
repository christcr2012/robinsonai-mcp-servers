// packages/thinking-tools-mcp/src/tools/context7_adapter.ts
import fs from "node:fs/promises";
import path from "node:path";
import type { ServerContext } from "../lib/context.js";
import { ctxImportEvidenceTool } from "./ctx_import_evidence.js";

const CACHE_DIR = ".context_cache";
const CACHE_FILE = "context7.json";

export const context7AdapterDescriptor = {
  name: "evidence_context7_adapter",
  description: "Pull results from Context7 (HTTP or file), cache locally, and import as evidence.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      from: { type: "string", enum: ["http","file"], default: "file" },
      url: { type: "string" },
      file: { type: "string" },
      group: { type: "string" }
    }
  }
};

export async function context7AdapterTool(
  args: { from?: "http"|"file"; url?: string; file?: string; group?: string },
  ctx: ServerContext
){
  const group = args.group ?? "external/context7";
  const cacheRoot = path.join(ctx.workspaceRoot, CACHE_DIR);
  await fs.mkdir(cacheRoot, { recursive: true });
  const cachePath = path.join(cacheRoot, CACHE_FILE);

  async function normalize(payload:any){
    const items = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
    return items.map((x:any)=>({
      source:"context7",
      title: x.title ?? x.name ?? "",
      snippet: x.snippet ?? x.summary ?? x.text ?? "",
      uri: x.uri ?? x.url ?? x.link ?? "",
      score: x.score ?? x.rank ?? undefined,
      tags: x.tags ?? [],
      raw: x
    }));
  }

  let data:any;
  let used = "fresh";

  try {
    if (args.from === "http") {
      const url = args.url ?? process.env.CONTEXT7_URL;
      if (!url) throw new Error("Missing CONTEXT7_URL");
      const r = await fetch(url, { headers: { "user-agent": "RCE/1.0" } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      data = await r.json();
      await fs.writeFile(cachePath, JSON.stringify(data), "utf8");
    } else {
      const file = args.file ?? process.env.CONTEXT7_FILE ?? path.join(ctx.workspaceRoot, ".context7.json");
      data = JSON.parse(await fs.readFile(file, "utf8"));
      await fs.writeFile(cachePath, JSON.stringify(data), "utf8");
    }
  } catch {
    try {
      const cached = await fs.readFile(cachePath, "utf8");
      data = JSON.parse(cached);
      used = "cache";
    } catch {
      return { content:[{ type:"text", text:"Context7 adapter: no data (network failed and no cache)."}] };
    }
  }

  const items = await normalize(data);
  const out = await ctxImportEvidenceTool({ items, group, upsert: true }, ctx);
  return { content:[{ type:"text", text:`Context7 ${used}; imported ${items.length} items into "${group}".` }] };
}



