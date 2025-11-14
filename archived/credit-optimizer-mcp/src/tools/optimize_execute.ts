import { routeAndExecute, type TaskType } from "../lib/policy.js";

export const optimizeExecuteDescriptor = {
  name: "credit_optimize_execute",
  description:
    "Run a prompt under a budget and quality policy. Will try free local (Ollama) first, then escalate to paid if gates fail.",
  inputSchema: {
    type: "object",
    required: ["task", "prompt"],
    properties: {
      task: {
        type: "string",
        enum: ["codegen", "analysis", "classification", "embedding"],
      },
      prompt: {
        type: "object",
        properties: { system: { type: "string" }, user: { type: "string" } },
        required: ["user"],
      },
      budget: {
        type: "object",
        properties: {
          maxUsd: { type: "number" },
          preferFree: { type: "boolean" },
          maxLatencyMs: { type: "number" },
          quality: { type: "number" },
        },
      },
    },
  },
};

export async function optimizeExecuteTool(
  args: {
    task: TaskType;
    prompt: { system?: string; user: string };
    budget?: any;
  },
  ctx: { workspaceRoot: string }
) {
  const res = await routeAndExecute({
    workspaceRoot: ctx.workspaceRoot,
    task: args.task,
    prompt: args.prompt,
    budget: args.budget,
  });
  return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
}

