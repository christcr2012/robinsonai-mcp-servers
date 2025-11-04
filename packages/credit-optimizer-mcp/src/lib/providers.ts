import { setTimeout as sleep } from "node:timers/promises";
import type { ModelInfo } from "./model_catalog.js";

// Simple retry with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, tries = 3) {
  let last: any;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      await sleep(200 * 2 ** i);
    }
  }
  throw last;
}

export type GenArgs = {
  model: ModelInfo;
  input: string;
  system?: string;
  json?: boolean;
  maxTokens?: number;
  temperature?: number;
  tools?: any[];
};

export type GenOut = {
  output: string;
  usage?: { inTok: number; outTok: number };
  provider: string;
  model: string;
};

export const Providers = {
  // —— Ollama (local)
  async generateOllama(a: GenArgs): Promise<GenOut> {
    const url = process.env.OLLAMA_URL || "http://localhost:11434";
    const body: any = {
      model: a.model.id,
      prompt: (a.system ? `${a.system}\n` : "") + a.input,
      options: { temperature: a.temperature ?? 0.2 },
    };
    return withRetry(async () => {
      const r = await fetch(`${url}/api/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(`ollama ${r.status}`);
      // The /api/generate stream returns NDJSON; we can also use /api/chat for tool use.
      const text = await r.text();
      const lastLine = text.trim().split("\n").filter(Boolean).slice(-1)[0];
      const j = JSON.parse(lastLine);
      return {
        output: j.response || "",
        usage: {
          inTok: j.prompt_eval_count ?? 0,
          outTok: j.eval_count ?? 0,
        },
        provider: "ollama",
        model: a.model.id,
      };
    });
  },

  // —— OpenAI
  async generateOpenAI(a: GenArgs): Promise<GenOut> {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY missing");
    const resp: any = await withRetry(async () => {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          authorization: `Bearer ${key}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: a.model.id,
          temperature: a.temperature ?? 0.2,
          response_format: a.json ? { type: "json_object" } : undefined,
          messages: [
            ...(a.system ? [{ role: "system", content: a.system }] : []),
            { role: "user", content: a.input },
          ],
          max_tokens: a.maxTokens ?? 800,
          tools: a.tools,
        }),
      });
      if (!r.ok) throw new Error(`openai ${r.status}: ${await r.text()}`);
      return r.json();
    });
    const choice = resp.choices?.[0];
    const txt = choice?.message?.content || "";
    const usage = resp.usage
      ? {
          inTok: resp.usage.prompt_tokens,
          outTok: resp.usage.completion_tokens,
        }
      : undefined;
    return { output: txt, usage, provider: "openai", model: a.model.id };
  },

  // —— Anthropic
  async generateAnthropic(a: GenArgs): Promise<GenOut> {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY missing");
    const resp: any = await withRetry(async () => {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: a.model.id,
          max_tokens: a.maxTokens ?? 800,
          temperature: a.temperature ?? 0.2,
          system: a.system,
          messages: [{ role: "user", content: a.input }],
        }),
      });
      if (!r.ok) throw new Error(`anthropic ${r.status}: ${await r.text()}`);
      return r.json();
    });
    const txt =
      resp.content
        ?.map((c: any) => c.text || "")
        .join("") || "";
    const usage = resp.usage
      ? { inTok: resp.usage.input_tokens, outTok: resp.usage.output_tokens }
      : undefined;
    return { output: txt, usage, provider: "anthropic", model: a.model.id };
  },

  // —— Google (Gemini)
  async generateGoogle(a: GenArgs): Promise<GenOut> {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) throw new Error("GOOGLE_API_KEY missing");
    const resp: any = await withRetry(async () => {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${a.model.id}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: a.system
                      ? `${a.system}\n${a.input}`
                      : a.input,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: a.temperature ?? 0.2,
              maxOutputTokens: a.maxTokens ?? 800,
            },
          }),
        }
      );
      if (!r.ok) throw new Error(`google ${r.status}: ${await r.text()}`);
      return r.json();
    });
    const txt =
      resp.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text || "")
        .join("") || "";
    // Google doesn't always return token usage; leave undefined.
    return { output: txt, usage: undefined, provider: "google", model: a.model.id };
  },
};

export async function generate(args: GenArgs): Promise<GenOut> {
  const { provider } = args.model;
  if (provider === "ollama") return Providers.generateOllama(args);
  if (provider === "openai") return Providers.generateOpenAI(args);
  if (provider === "anthropic") return Providers.generateAnthropic(args);
  if (provider === "google") return Providers.generateGoogle(args);
  throw new Error(`Unknown provider ${provider}`);
}

