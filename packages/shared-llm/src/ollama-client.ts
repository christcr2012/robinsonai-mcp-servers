export const BASE = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/+$/, '');
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function pingOllama(timeoutMs = 1000): Promise<boolean> {
  try {
    const r = await fetch(`${BASE}/api/tags`, { method: 'GET', signal: AbortSignal.timeout(timeoutMs) });
    return r.ok;
  } catch {
    return false;
  }
}

export async function ollamaGenerate(opts: {
  model: string;
  prompt: string;
  format?: 'json' | 'text';
  timeoutMs?: number;
  retries?: number;
}) {
  const { model, prompt, format, timeoutMs = 45000, retries = 2 } = opts;
  let lastErr: any;
  for (let i = 0; i <= retries; i++) {
    try {
      // Build request body - only include format if it's 'json'
      // Ollama doesn't accept 'text' as a format value
      const body: any = { model, prompt, stream: false };
      if (format === 'json') {
        body.format = 'json';
      }

      const r = await fetch(`${BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs)
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json() as any;
      return json.response || '';
    } catch (e) {
      lastErr = e;
      if (i < retries) await sleep(500 * (i + 1));
    }
  }
  throw new Error(`Ollama generate failed after ${retries + 1} attempt(s): ${lastErr?.message || lastErr}`);
}

export async function warmModels(models: string[]): Promise<void> {
  for (const model of models) {
    try {
      await ollamaGenerate({ model, prompt: 'test', timeoutMs: 10000, retries: 0 });
    } catch {
      // Ignore warm-up failures
    }
  }
}

