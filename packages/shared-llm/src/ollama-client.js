export const BASE = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/+$/, '');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
export async function pingOllama(timeoutMs = 1000) {
    try {
        const r = await fetch(`${BASE}/api/tags`, { method: 'GET', signal: AbortSignal.timeout(timeoutMs) });
        return r.ok;
    }
    catch {
        return false;
    }
}
export async function ollamaGenerate(opts) {
    const { model, prompt, format = 'text', timeoutMs = 45000, retries = 2 } = opts;
    let lastErr;
    for (let i = 0; i <= retries; i++) {
        try {
            const r = await fetch(`${BASE}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model, prompt, format, stream: false }),
                signal: AbortSignal.timeout(timeoutMs)
            });
            if (!r.ok)
                throw new Error(`HTTP ${r.status}`);
            const json = await r.json();
            return json.response || '';
        }
        catch (e) {
            lastErr = e;
            if (i < retries)
                await sleep(500 * (i + 1));
        }
    }
    throw new Error(`Ollama generate failed after ${retries + 1} attempt(s): ${lastErr?.message || lastErr}`);
}
export async function warmModels(models) {
    for (const model of models) {
        try {
            await ollamaGenerate({ model, prompt: 'test', timeoutMs: 10000, retries: 0 });
        }
        catch {
            // Ignore warm-up failures
        }
    }
}
//# sourceMappingURL=ollama-client.js.map