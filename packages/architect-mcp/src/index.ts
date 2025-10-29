#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, InitializeRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import Database from "better-sqlite3";
import { ollamaGenerate, warmModels } from "./ollama-client.js";
import {
  handleSubmitSpec,
  handleGetSpecChunk,
  handlePlanWork,
  handleGetPlanStatus,
  handleGetPlanChunk,
  handleExportWorkplan,
  handleRevisePlan,
  handleListTemplates,
  handleGetTemplate,
  handleDecomposeSpec,
  handleForecastRunCost,
  handleListModels,
  handleGetSpendStats,
} from "./tools/plan.js";
import { handleRunPlanSteps } from "./tools/run_workflow.js";

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
  // Return REAL MCP tools that are actually available
  // These are the delegation tools from Autonomous Agent MCP and workflow tools from Credit Optimizer MCP
  return [
    "delegate_code_generation_autonomous-agent-mcp",
    "delegate_code_analysis_autonomous-agent-mcp",
    "delegate_code_refactoring_autonomous-agent-mcp",
    "delegate_test_generation_autonomous-agent-mcp",
    "delegate_documentation_autonomous-agent-mcp",
    "execute_autonomous_workflow_credit-optimizer-mcp",
    "execute_bulk_fix_credit-optimizer-mcp",
    "execute_refactor_pattern_credit-optimizer-mcp",
    "execute_test_generation_credit-optimizer-mcp",
    "scaffold_feature_credit-optimizer-mcp",
    "scaffold_component_credit-optimizer-mcp",
    "scaffold_api_endpoint_credit-optimizer-mcp",
    "scaffold_database_schema_credit-optimizer-mcp",
    "scaffold_test_suite_credit-optimizer-mcp",
  ];
}

function pickPlannerModel(depth: string, repoSize: number): string {
  if (depth === "forensic" || repoSize > 5000) return process.env.ARCHITECT_BIG_MODEL || "qwen2.5-coder:32b";
  if (depth === "thorough") return process.env.ARCHITECT_STD_MODEL || "deepseek-coder:33b";
  return process.env.ARCHITECT_FAST_MODEL || "qwen2.5:3b";
}

async function llmPlan(params: { goal: string; repoDigest: string; tools: string[]; model: string }): Promise<any> {
  const prompt = [
    "You are a principal software architect creating CONCRETE, EXECUTABLE work plans.",
    "",
    "CRITICAL REQUIREMENTS:",
    "1. Use ONLY tools from the provided tool list (no fake tools!)",
    "2. Be SPECIFIC: Include exact file paths, function names, parameter values",
    "3. FORCE DELEGATION: Use delegate_code_generation_autonomous-agent-mcp for ALL code generation",
    "4. Include concrete success criteria (specific test files, not 'run tests')",
    "",
    "DELEGATION RULES:",
    "- Code generation → delegate_code_generation_autonomous-agent-mcp",
    "- Code analysis → delegate_code_analysis_autonomous-agent-mcp",
    "- Refactoring → delegate_code_refactoring_autonomous-agent-mcp",
    "- Tests → delegate_test_generation_autonomous-agent-mcp",
    "",
    `Goal: ${params.goal}`,
    `RepoDigest: ${params.repoDigest}`,
    `Available Tools: ${params.tools.join(", ")}`,
    "",
    "EXAMPLE (CONCRETE PLAN):",
    `{
  "name": "Add 10 Upstash Redis Tools",
  "caps": {"max_files_changed": 20, "require_green_tests": true},
  "budgets": {"time_ms": 600000, "max_steps": 15},
  "successSignals": ["npm test passes", "all 10 tools registered"],
  "steps": [
    {
      "id": "gen_hset",
      "tool": "delegate_code_generation_autonomous-agent-mcp",
      "params": {
        "task": "Create HSET tool handler in packages/robinsons-toolkit-mcp/src/integrations/upstash/redis-tools.ts",
        "context": "TypeScript, Upstash Redis client, MCP tool pattern",
        "complexity": "simple"
      }
    },
    {
      "id": "gen_hget",
      "tool": "delegate_code_generation_autonomous-agent-mcp",
      "params": {
        "task": "Create HGET tool handler in packages/robinsons-toolkit-mcp/src/integrations/upstash/redis-tools.ts",
        "context": "TypeScript, Upstash Redis client, MCP tool pattern",
        "complexity": "simple"
      },
      "requires": ["gen_hset"]
    }
  ]
}`,
    "",
    "Now create a CONCRETE plan for the goal above. Use ONLY tools from the Available Tools list.",
    "Respond with ONLY JSON (no markdown, no explanation)."
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
        // Spec management
        { name: "submit_spec", description: "Store large specification (max 200 KB)", inputSchema: { type: "object", properties: { title: { type: "string" }, text: { type: "string" } }, required: ["title", "text"] } },
        { name: "get_spec_chunk", description: "Retrieve spec in chunks", inputSchema: { type: "object", properties: { spec_id: { type: "number" }, from: { type: "number" }, size: { type: "number" } }, required: ["spec_id"] } },
        { name: "decompose_spec", description: "Break spec into work items", inputSchema: { type: "object", properties: { spec_id: { type: "number" }, max_item_size: { type: "number" } }, required: ["spec_id"] } },

        // Planning (incremental)
        { name: "plan_work", description: "Create WorkPlan (returns plan_id immediately)", inputSchema: { type: "object", properties: { goal: { type: "string" }, spec_id: { type: "number" }, mode: { type: "string" }, budgets: { type: "object" } } } },
        { name: "get_plan_status", description: "Check planning progress", inputSchema: { type: "object", properties: { plan_id: { type: "number" } }, required: ["plan_id"] } },
        { name: "get_plan_chunk", description: "Fetch plan steps in chunks", inputSchema: { type: "object", properties: { plan_id: { type: "number" }, from: { type: "number" }, size: { type: "number" } }, required: ["plan_id"] } },
        { name: "revise_plan", description: "Revise plan based on validation errors", inputSchema: { type: "object", properties: { plan_id: { type: "number" }, critique_focus: { type: "string" } }, required: ["plan_id"] } },
        { name: "export_workplan_to_optimizer", description: "Export validated plan to Optimizer", inputSchema: { type: "object", properties: { plan_id: { type: "number" } }, required: ["plan_id"] } },
        { name: "run_plan_steps", description: "Execute validated plan steps locally", inputSchema: { type: "object", properties: { plan_id: { type: "number" } }, required: ["plan_id"] } },

        // Templates
        { name: "list_templates", description: "List available step templates", inputSchema: { type: "object", properties: {} } },
        { name: "get_template", description: "Get template details", inputSchema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] } },

        // Cost forecasting
        { name: "forecast_run_cost", description: "Estimate cost for a plan", inputSchema: { type: "object", properties: { plan_id: { type: "string" } }, required: ["plan_id"] } },
        { name: "list_models", description: "List available models across all providers", inputSchema: { type: "object", properties: {} } },
        { name: "get_spend_stats", description: "Get monthly spend statistics", inputSchema: { type: "object", properties: {} } },

        // Legacy (keep for compatibility)
        { name: "get_plan", description: "Fetch full plan by id (legacy)", inputSchema: { type: "object", properties: { plan_id: { type: "string" } }, required: ["plan_id"] } },
        { name: "diagnose_architect", description: "Health & env check", inputSchema: { type: "object", properties: {} } }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (req) => {
      const { name, arguments: args } = req.params;
      try {
        switch (name) {
          // New tools
          case "submit_spec": return handleSubmitSpec(args as any);
          case "get_spec_chunk": return handleGetSpecChunk(args as any);
          case "decompose_spec": return handleDecomposeSpec(args as any);
          case "plan_work": return handlePlanWork(args as any);
          case "get_plan_status": return handleGetPlanStatus(args as any);
          case "get_plan_chunk": return handleGetPlanChunk(args as any);
          case "revise_plan": return handleRevisePlan(args as any);
          case "export_workplan_to_optimizer": return handleExportWorkplan(args as any);
          case "run_plan_steps": return handleRunPlanSteps(args as any);
          case "list_templates": return handleListTemplates();
          case "get_template": return handleGetTemplate(args as any);
          case "forecast_run_cost": return handleForecastRunCost(args as any);
          case "list_models": return handleListModels();
          case "get_spend_stats": return handleGetSpendStats();

          // Legacy tools
          case "get_plan": return this.handleGetPlan(args as any);
          case "diagnose_architect": return toText({
            ok: true,
            db: DB_PATH,
            wal: true,
            new_architecture: true,
            env: {
              OLLAMA_BASE_URL: !!process.env.OLLAMA_BASE_URL,
              ARCHITECT_PLANNER_TIME_MS: process.env.ARCHITECT_PLANNER_TIME_MS || '90000',
              ARCHITECT_PLANNER_SLICE_MS: process.env.ARCHITECT_PLANNER_SLICE_MS || '5000',
              ARCHITECT_MAX_STEPS: process.env.ARCHITECT_MAX_STEPS || '12',
              ARCHITECT_MAX_FILES_CHANGED: process.env.ARCHITECT_MAX_FILES_CHANGED || '40',
            }
          });

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
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("@robinsonai/architect-mcp running on stdio");

    // Warm models in background (don't block server startup)
    warmModels().catch(err => console.error('[Architect] Model warming failed:', err.message));
  }
}

new ArchitectMCP().run().catch(console.error);