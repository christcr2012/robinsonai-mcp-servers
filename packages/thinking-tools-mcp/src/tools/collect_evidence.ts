import { think_collect_evidence } from "./think_collect_evidence.js";

type J = Record<string, any>;
type Tool = { name:string; description:string; inputSchema:J; handler:(args:J)=>Promise<J> };

// Tool name validation regex (Augment requirement)
const NAME_REGEX = /^[a-zA-Z0-9_.:-]{1,64}$/;

function safeName(name: string, fallback: string): string {
  const n = name?.trim().replace(/\s+/g, "_");
  return NAME_REGEX.test(n) ? n : fallback;
}

// Evidence collection tool (new implementation)
export const collect_evidence_tool: Tool = {
  name: safeName("think_collect_evidence", "think_collect_evidence"),
  description: "Copy repo files into .robctx/evidence using include/exclude globs. Returns ok, root, scanned, copied, output_dir.",
  inputSchema: {
    type: "object",
    properties: {
      include: { type: "array", items: { type: "string" }, description: "Globs relative to repo root (default: ['**/*'])" },
      exclude: { type: "array", items: { type: "string" }, description: "Globs to exclude (default: node_modules, .git, dist, etc.)" },
      maxFiles: { type: "number", description: "Safety cap (default: 5000)" }
    }
  },
  handler: async (args) => think_collect_evidence(args)
};

// Health check tool
export const health_check_tool: Tool = {
  name: safeName("thinking_tools_health_check", "thinking_tools_health_check"),
  description: "Get thinking tools health status. Returns ok, count, names.",
  inputSchema: {
    type: "object",
    properties: {}
  },
  handler: async () => {
    const tools = getCollectorTools();
    return {
      ok: true,
      count: tools.length,
      names: tools.map(t => t.name),
      message: "Toolkit is healthy"
    };
  }
};

// Validation tool
export const validate_tools_tool: Tool = {
  name: safeName("thinking_tools_validate", "thinking_tools_validate"),
  description: "Validate thinking tool names against Augment's regex. Returns ok, total, invalid.",
  inputSchema: {
    type: "object",
    properties: {}
  },
  handler: async () => {
    const tools = getCollectorTools();
    const invalid = tools.filter(t => !NAME_REGEX.test(t.name));
    return {
      ok: invalid.length === 0,
      total: tools.length,
      invalid: invalid.map(t => ({ name: t.name, reason: "Does not match ^[a-zA-Z0-9_.:-]{1,64}$" })),
      message: invalid.length === 0 ? "All tools valid" : `${invalid.length} invalid tool names found`
    };
  }
};

export function getCollectorTools(): Tool[] {
  return [
    collect_evidence_tool,
    health_check_tool,
    validate_tools_tool
  ];
}

