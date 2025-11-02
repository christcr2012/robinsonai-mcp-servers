export const BASE = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/+$/, '');
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function pingOllama(timeoutMs = 1000): Promise<boolean> {
  // Try both localhost and 127.0.0.1 for better compatibility
  const urls = [
    `${BASE}/api/tags`,
    `${BASE.replace('localhost', '127.0.0.1')}/api/tags`
  ];

  for (const url of urls) {
    try {
      const r = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(timeoutMs),
        headers: { 'Accept': 'application/json' }
      });
      if (r.ok) {
        return true;
      }
    } catch (error: any) {
      // Continue to next URL
      console.error(`[pingOllama] Failed to ping ${url}: ${error?.message || error}`);
    }
  }

  return false;
}

export async function ollamaGenerate(opts: {
  model: string;
  prompt: string;
  format?: 'json' | 'text';
  timeoutMs?: number;
  retries?: number;
}) {
  const { model, prompt, format, timeoutMs = 120000, retries = 2 } = opts;  // 2 minutes for cold start
  console.error(`[sharedGenerate] Starting generation with model: ${model}, timeout: ${timeoutMs}ms`);
  let lastErr: any;
  for (let i = 0; i <= retries; i++) {
    try {
      console.error(`[sharedGenerate] Attempt ${i + 1}/${retries + 1}`);
      // Build request body - only include format if it's 'json'
      // Ollama doesn't accept 'text' as a format value
      const body: any = { model, prompt, stream: false };
      if (format === 'json') {
        body.format = 'json';
      }

      console.error(`[sharedGenerate] Sending fetch to ${BASE}/api/generate`);
      const r = await fetch(`${BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs)
      });
      console.error(`[sharedGenerate] Fetch completed with status: ${r.status}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      console.error('[sharedGenerate] Parsing JSON response...');
      const json = await r.json() as any;
      console.error('[sharedGenerate] JSON parsed successfully');
      return json.response || '';
    } catch (e) {
      console.error(`[sharedGenerate] Error on attempt ${i + 1}:`, e);
      lastErr = e;
      if (i < retries) {
        console.error(`[sharedGenerate] Retrying in ${500 * (i + 1)}ms...`);
        await sleep(500 * (i + 1));
      }
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

