import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { listBy, MODELS, type ModelKind, type ModelInfo } from "./model_catalog.js";
import { generate } from "./providers.js";

export type TaskType = "codegen" | "analysis" | "classification" | "embedding";
export type Budget = {
  maxUsd?: number;
  preferFree?: boolean;
  maxLatencyMs?: number;
  quality?: number; /* 0..1 */
};

export type RouteResult = {
  tried: { model: string; provider: string; estCost: number }[];
  final: {
    model: string;
    provider: string;
    costUsd: number;
    latencyMs: number;
    output: string;
    usage?: { inTok: number; outTok: number };
  };
  escalated: boolean;
};

function cacheDir(root: string) {
  return path.join(root, ".rce_cache");
}

function hashKey(x: any) {
  return crypto.createHash("sha1").update(JSON.stringify(x)).digest("hex");
}

async function getCache(root: string, key: string): Promise<any | null> {
  try {
    const f = await fs.readFile(
      path.join(cacheDir(root), `${key}.json`),
      "utf8"
    );
    return JSON.parse(f);
  } catch {
    return null;
  }
}

async function putCache(root: string, key: string, val: any) {
  await fs.mkdir(cacheDir(root), { recursive: true });
  await fs.writeFile(
    path.join(cacheDir(root), `${key}.json`),
    JSON.stringify(val),
    "utf8"
  );
}

function priceEstimate(m: ModelInfo, inTok: number, outTok: number) {
  const inK = inTok / 1000,
    outK = outTok / 1000;
  const pIn = m.priceIn ?? 0,
    pOut = m.priceOut ?? 0;
  return +(inK * pIn + outK * pOut).toFixed(6);
}

function pickCandidates(task: TaskType, preferFree: boolean): ModelInfo[] {
  const chat = listBy("chat");
  const embed = listBy("embed");
  if (task === "embedding")
    return preferFree
      ? embed
          .filter((m) => m.provider === "ollama")
          .concat(embed.filter((m) => m.provider !== "ollama"))
      : embed;
  const base = preferFree
    ? chat
        .filter((m) => m.provider === "ollama")
        .concat(chat.filter((m) => m.provider !== "ollama"))
    : chat;
  // sort by (quality/price) then quality
  return base.sort(
    (a, b) =>
      b.quality / (b.priceOut || 0.0001) - a.quality / (a.priceOut || 0.0001) ||
      b.quality - a.quality
  );
}

function qualityGate(task: TaskType, text: string): boolean {
  // Cheap heuristics; you can swap with a grader later.
  if (task === "codegen")
    return (
      /```|class |function |def |interface |return /.test(text) &&
      text.length > 120
    );
  if (task === "analysis")
    return (
      text.split(/\n/).length >= 6 &&
      /summary|recommend|risk|option/i.test(text)
    );
  if (task === "classification")
    return text.trim().length > 0 && text.length < 2000;
  return text.trim().length > 0;
}

export async function routeAndExecute(args: {
  workspaceRoot: string;
  task: TaskType;
  prompt: { system?: string; user: string };
  budget?: Budget;
}): Promise<RouteResult> {
  const root = args.workspaceRoot;
  const budget = args.budget ?? {};
  const preferFree = budget.preferFree ?? process.env.CO_PREFER_FREE === "1";
  const qualityTarget = budget.quality ?? 0.85;
  const maxUsd = budget.maxUsd ?? Number(process.env.CO_MAX_USD ?? 0.5);

  const cacheKey = hashKey({ task: args.task, prompt: args.prompt });
  const cached = await getCache(root, cacheKey);
  if (cached) return cached;

  // naive token estimate (works for planning cost; providers return real usage later)
  const inTokEst = Math.ceil(
    (args.prompt.user.length + (args.prompt.system?.length || 0)) / 4
  );
  const outTokEst = 800; // default cap; adjust per task

  const candidates = pickCandidates(args.task, preferFree);
  const tried: RouteResult["tried"] = [];
  let escalated = false;

  for (const m of candidates) {
    const est = priceEstimate(m, inTokEst, outTokEst);
    if (maxUsd !== undefined && est > maxUsd) continue;

    tried.push({ model: m.id, provider: m.provider, estCost: est });

    try {
      const t0 = Date.now();
      const out = await generate({
        model: m,
        input: args.prompt.user,
        system: args.prompt.system,
        json: false,
        maxTokens: outTokEst,
      });
      const latencyMs = Date.now() - t0;
      const realCost = out.usage
        ? priceEstimate(m, out.usage.inTok || inTokEst, out.usage.outTok || outTokEst)
        : est;

      // pass/fail gate
      const pass = qualityGate(args.task, out.output);
      if (pass || m.provider !== "ollama") {
        const final = {
          model: m.id,
          provider: m.provider,
          costUsd: realCost,
          latencyMs,
          output: out.output,
          usage: out.usage,
        };
        const result: RouteResult = { tried, final, escalated };
        await putCache(root, cacheKey, result);
        return result;
      } else {
        // escalate to next candidate (paid) if gate failed
        escalated = true;
        continue;
      }
    } catch (e) {
      // model failed; try next
      escalated = true;
      continue;
    }
  }
  throw new Error("No eligible model met the budget/availability constraints.");
}

