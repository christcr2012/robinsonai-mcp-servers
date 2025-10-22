/**
 * Ollama client for Architect MCP
 * Simple, reliable, fast - no dependencies on ollama npm package
 *
 * @copyright Robinson AI Systems - https://www.robinsonaisystems.com
 */

const OLLAMA = process.env.OLLAMA_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:11434";

export async function ollamaGenerate({
  model,
  prompt,
  options = {},
  timeoutMs = 120_000
}: {
  model: string;
  prompt: string;
  options?: Record<string, any>;
  timeoutMs?: number;
}): Promise<string> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${OLLAMA}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false, options }),
      signal: controller.signal
    });
    clearTimeout(t);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Ollama error ${res.status}: ${text}`);
    }
    const data: any = await res.json();
    // data.response is the full text when stream=false
    return data.response as string;
  } catch (err) {
    clearTimeout(t);
    if ((err as any).name === 'AbortError') {
      throw new Error(`Ollama timeout after ${timeoutMs}ms`);
    }
    throw err;
  }
}

/**
 * Warm up models by sending a tiny prompt to each.
 * This ensures models are loaded into memory before real requests.
 */
export async function warmModels() {
  const models = [
    process.env.ARCHITECT_FAST_MODEL || "qwen2.5:3b",
    process.env.ARCHITECT_STD_MODEL  || "deepseek-coder:33b",
    process.env.ARCHITECT_BIG_MODEL  || "qwen2.5-coder:32b"
  ];

  console.error(`[Architect] Warming ${models.length} models...`);

  for (const m of models) {
    try {
      await ollamaGenerate({ model: m, prompt: "ok", timeoutMs: 10_000 });
      console.error(`[Architect] ✓ ${m} ready`);
    } catch (err) {
      console.error(`[Architect] ⚠ ${m} not available: ${(err as Error).message}`);
    }
  }
}

