// Minimal model catalog with rough costs & capabilities.
// Add/modify entries as you enable more providers.
export type ModelKind = "chat" | "embed" | "rerank";
export type Provider = "ollama" | "openai" | "anthropic" | "google";

export type ModelInfo = {
  id: string;
  provider: Provider;
  kind: ModelKind;
  ctx: number; // context window
  tps?: number; // rough tokens/sec
  priceIn?: number; // USD per 1K input tokens
  priceOut?: number; // USD per 1K output tokens (chat)
  quality: number; // 0..1 subjective (use your evals)
  supports: { tools?: boolean; json?: boolean; reasoning?: boolean };
};

export const MODELS: ModelInfo[] = [
  // —— Local / Free-ish
  {
    id: "llama3.1:70b-instruct-q5_K_M",
    provider: "ollama",
    kind: "chat",
    ctx: 131072,
    tps: 20,
    priceIn: 0,
    priceOut: 0,
    quality: 0.78,
    supports: { tools: false, json: true },
  },
  {
    id: "qwen2.5-coder:32b-instruct-q5_K_M",
    provider: "ollama",
    kind: "chat",
    ctx: 32768,
    tps: 30,
    priceIn: 0,
    priceOut: 0,
    quality: 0.80,
    supports: { tools: false, json: true },
  },
  {
    id: "nomic-embed-text",
    provider: "ollama",
    kind: "embed",
    ctx: 8192,
    priceIn: 0,
    priceOut: 0,
    quality: 0.70,
    supports: {},
  },

  // —— Paid (examples – enable the ones you have keys for)
  {
    id: "gpt-4o-mini",
    provider: "openai",
    kind: "chat",
    ctx: 128000,
    priceIn: 0.15,
    priceOut: 0.60,
    quality: 0.88,
    supports: { tools: true, json: true },
  },
  {
    id: "gpt-4.1-mini",
    provider: "openai",
    kind: "chat",
    ctx: 128000,
    priceIn: 0.30,
    priceOut: 1.20,
    quality: 0.92,
    supports: { tools: true, json: true, reasoning: true },
  },
  {
    id: "text-embedding-3-small",
    provider: "openai",
    kind: "embed",
    ctx: 8192,
    priceIn: 0.02,
    priceOut: 0,
    quality: 0.86,
    supports: {},
  },

  {
    id: "claude-3-haiku-20240307",
    provider: "anthropic",
    kind: "chat",
    ctx: 200000,
    priceIn: 0.25,
    priceOut: 1.25,
    quality: 0.88,
    supports: { tools: true, json: true },
  },
  {
    id: "claude-3-5-sonnet-20241022",
    provider: "anthropic",
    kind: "chat",
    ctx: 200000,
    priceIn: 3,
    priceOut: 15,
    quality: 0.98,
    supports: { tools: true, json: true, reasoning: true },
  },

  {
    id: "gemini-1.5-pro",
    provider: "google",
    kind: "chat",
    ctx: 1000000,
    priceIn: 1.25,
    priceOut: 5,
    quality: 0.93,
    supports: { tools: true, json: true, reasoning: true },
  },
];

export function listBy(kind: ModelKind) {
  return MODELS.filter((m) => m.kind === kind);
}

