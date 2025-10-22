#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, InitializeRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import Database from "better-sqlite3";
import { ollamaGenerate, warmModels } from "./ollama-client.js";

type MCPReturn = Promise<{ content: Array<{ type: "text"; text: string }> }>;
const DB_PATH = process.env.ARCHITECT_DB || path.join(process.cwd(), "architect.db");

// --- DB bootstrap (WAL + schema)
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS repo_maps (
  id INTEGER PRIMARY KEY,
  root TEXT NOT NULL,
  head_sha TEXT NOT NULL,
  digest TEXT NOT NULL,
  map_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(root, head_sha)
);
CREATE TABLE IF NOT EXISTS plans (
  plan_id TEXT PRIMARY KEY,
  head_sha TEXT NOT NULL,
  goal TEXT NOT NULL,
  depth TEXT NOT NULL,
  tools_json TEXT NOT NULL,
  plan_json TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_plans_head ON plans(head_sha);
`);

// --- helpers
const now = () => Date.now();
const ok = (text: string): MCPReturn => Promise.resolve({ content: [{ type: "text", text }] });
const toText = (obj: any): MCPReturn => ok(JSON.stringify(obj, null, 2));

async function gitHead(): Promise<string> {
  try {
    const headContent = fs.readFileSync(".git/HEAD", "utf8");
    if (headContent.includes("ref:")) {
      const refPath = headContent.split(" ")[1].trim();
      return fs.readFileSync(path.join(".git", refPath), "utf8").trim();
    }
    return headContent.trim();
  } catch {
    return "unknown";
  }
}

function digest(str: string) {
  return crypto.createHash("sha256").update(str).digest("hex").slice(0, 16);
}

// repo map cache (no LLM)
function ensureRepoMap(root: string, head: string) {
  const row = db.prepare(`SELECT map_json, digest FROM repo_maps WHERE root=? AND head_sha=?`).get(root, head) as any;
  if (row) return row;

  const files = fs.readdirSync(root, { withFileTypes: true })
    .slice(0, 500)
    .map(f => f.name)
    .join("|");
  const d = digest(files);
  const map = { root, head, files: files.split("|").slice(0, 200) };

  db.prepare(`INSERT OR IGNORE INTO repo_maps(root, head_sha, digest, map_json, created_at) VALUES (?,?,?,?,?)`)
    .run(root, head, d, JSON.stringify(map), now());

  return { map_json: JSON.stringify(map), digest: d };
}

function shortlistTools(goal: string, repoDigest: string): string[] {
  return ["scaffold_feature", "apply_patches", "open_pr_with_changes", "vercel_deploy", "generate_contract_tests"].slice(0, 10);
}

function pickPlannerModel(depth: string, repoSize: number): string {
  if (depth === "forensic" || repoSize > 5000) return process.env.ARCHITECT_BIG_MODEL || "qwen2.5-coder:32b";
  if (depth === "thorough") return process.env.ARCHITECT_STD_MODEL || "deepseek-coder:33b";
  return process.env.ARCHITECT_FAST_MODEL || "qwen2.5:3b";
}

async function llmPlan(params: { goal: string; repoDigest: string; tools: string[]; model: string }): Promise<any> {
  const prompt = [
    "You are a principal software architect.",
    "Given the goal, a digest of the repo, and a shortlist of available tools, output a JSON WorkPlan that my executor can run.",
    "Be concise. Include caps (max_files_changed, require_green_tests), budgets (time_ms, max_steps), successSignals, and a small DAG of steps.",
    "Respond with ONLY JSON.",
    "",
    `Goal: ${params.goal}`,
    `RepoDigest: ${params.repoDigest}`,
    `Tools: ${params.tools.join(", ")}`,
    "",
    "Return shape:",
    `{"name": "...","caps":{"max_files_changed":40,"require_green_tests":true},"budgets":{"time_ms":480000,"max_steps":12},"successSignals":["tests_pass","preview_ok"],"steps":[{"id":"preflight","tool":"preflight_checks"},{"id":"scaffold","tool":"scaffold_feature","params":{"blueprint": "..."}, "requires":["preflight"]},{"id":"tests","tool":"generate_contract_tests","requires":["scaffold"]},{"id":"patch","tool":"apply_patches","requires":["tests"]},{"id":"pr","tool":"open_pr_with_changes","requires":["patch"]},{"id":"preview","tool":"vercel_deploy","params":{"prod":false},"requires":["pr"]}]}`
  ].join("\n");

  const raw = await ollamaGenerate({ model: params.model, prompt, timeoutMs: 180_000 });

  // best-effort JSON extraction
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Planner returned no JSON");

  return JSON.parse(raw.slice(start, end + 1));
}

class ArchitectMCP {
  private server: Server;

  constructor() {
    this.server = new Server({ name: "@robinsonai/architect-mcp", version: "0.1.0" }, { capabilities: { tools: {} } });
    this.setupHandlers();
  }

  private setupHandlers() {
    // Handle initialize request
    this.server.setRequestHandler(InitializeRequestSchema, async (request) => ({
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: "@robinsonai/architect-mcp",
        version: "0.2.0",
      },
    }));

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        { name: "plan_work", description: "Create a WorkPlan from a high-level goal", inputSchema: { type: "object", properties: { goal: { type: "string" }, constraints: { type: "object" }, budgets: { type: "object" }, depth: { type: "string" } }, required: ["goal"] } },
        { name: "get_plan", description: "Fetch full plan by id", inputSchema: { type: "object", properties: { plan_id: { type: "string" } }, required: ["plan_id"] } },
        { name: "get_plan_chunk", description: "Fetch plan chunk", inputSchema: { type: "object", properties: { plan_id: { type: "string" }, offset: { type: "number" }, limit: { type: "number" } }, required: ["plan_id", "offset", "limit"] } },
        { name: "revise_plan", description: "Critique & improve a plan", inputSchema: { type: "object", properties: { plan_id: { type: "string" }, critiqueFocus: { type: "string" } }, required: ["plan_id"] } },
        { name: "export_workplan_to_optimizer", description: "Convert plan to Optimizer workflow JSON", inputSchema: { type: "object", properties: { plan_id: { type: "string" } }, required: ["plan_id"] } },
        { name: "diagnose_architect", description: "Health & env check", inputSchema: { type: "object", properties: {} } }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (req) => {
      const { name, arguments: args } = req.params;
      try {
        switch (name) {
          case "plan_work": return this.handlePlanWork(args as any);
          case "get_plan": return this.handleGetPlan(args as any);
          case "get_plan_chunk": return this.handleGetPlanChunk(args as any);
          case "revise_plan": return this.handleRevisePlan(args as any);
          case "export_workplan_to_optimizer": return this.handleExport(args as any);
          case "diagnose_architect": return toText({ ok: true, db: DB_PATH, wal: true, env: { OLLAMA_BASE_URL: !!process.env.OLLAMA_BASE_URL, TOOL_INDEX_DB: process.env.TOOL_INDEX_DB || null } });
          default: throw new Error(`Unknown tool: ${name}`);
        }
      } catch (e: any) {
        return ok(`Error: ${e.message}`);
      }
    });
  }

  private async handlePlanWork(args: { goal: string; constraints?: any; budgets?: any; depth?: string }): MCPReturn {
    const root = process.cwd();
    const head = await gitHead();
    const { map_json, digest: repoDigest } = ensureRepoMap(root, head);
    const tools = shortlistTools(args.goal, repoDigest);
    const model = pickPlannerModel(args.depth ?? "fast", JSON.parse(map_json).files.length);
    const draft = await llmPlan({ goal: args.goal, repoDigest, tools, model });
    const plan_id = `${Date.now()}-${digest(args.goal + head)}`;
    const summary = `Plan ${draft.name}: ${draft.steps.length} steps, caps=${JSON.stringify(draft.caps)}`;
    db.prepare(`INSERT INTO plans(plan_id, head_sha, goal, depth, tools_json, plan_json, summary, created_at) VALUES (?,?,?,?,?,?,?,?)`).run(plan_id, head, args.goal, args.depth ?? "fast", JSON.stringify(tools), JSON.stringify(draft), summary, now());
    return toText({ plan_id, summary });
  }

  private async handleGetPlan(args: { plan_id: string }): MCPReturn {
    const row = db.prepare(`SELECT plan_json FROM plans WHERE plan_id=?`).get(args.plan_id) as any;
    if (!row) return ok(`Error: plan not found: ${args.plan_id}`);
    return toText(JSON.parse(row.plan_json));
  }

  private async handleGetPlanChunk(args: { plan_id: string; offset: number; limit: number }): MCPReturn {
    const row = db.prepare(`SELECT plan_json FROM plans WHERE plan_id=?`).get(args.plan_id) as any;
    if (!row) return ok(`Error: plan not found: ${args.plan_id}`);
    const s = row.plan_json as string;
    const start = Math.max(0, args.offset || 0);
    const end = Math.min(s.length, start + (args.limit || 2048));
    return toText({ chunk: s.slice(start, end), next: end < s.length ? end : null });
  }

  private async handleRevisePlan(args: { plan_id: string; critiqueFocus?: string }): MCPReturn {
    const row = db.prepare(`SELECT plan_json FROM plans WHERE plan_id=?`).get(args.plan_id) as any;
    if (!row) return ok(`Error: plan not found: ${args.plan_id}`);
    const plan = JSON.parse(row.plan_json);
    plan.caps.max_files_changed = Math.min(50, plan.caps.max_files_changed);
    const summary = `Revised ${plan.name}: ${plan.steps.length} steps`;
    db.prepare(`UPDATE plans SET plan_json=?, summary=? WHERE plan_id=?`).run(JSON.stringify(plan), summary, args.plan_id);
    return toText({ plan_id: args.plan_id, summary });
  }

  private async handleExport(args: { plan_id: string }): MCPReturn {
    const row = db.prepare(`SELECT plan_json FROM plans WHERE plan_id=?`).get(args.plan_id) as any;
    if (!row) return ok(`Error: plan not found: ${args.plan_id}`);
    const plan = JSON.parse(row.plan_json);
    return toText({ workflow: plan });
  }

  async run(): Promise<void> {
    // Warm models before accepting requests
    await warmModels();

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("@robinsonai/architect-mcp running on stdio");
  }
}

new ArchitectMCP().run().catch(console.error);