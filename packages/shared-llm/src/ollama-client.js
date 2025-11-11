export const BASE = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/+$/, '');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
export async function pingOllama(timeoutMs = 1000) {
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
        } catch (error) {
            // Continue to next URL
            console.error(`[pingOllama] Failed to ping ${url}: ${error.message}`);
        }
    }
    return false;
}
export async function ollamaGenerate(opts) {
    const { model, prompt, format, timeoutMs = 120000, retries = 2 } = opts; // 2 minutes for cold start
    let lastErr;
    for (let i = 0; i <= retries; i++) {
        try {
            // Build request body - only include format if it's 'json'
            // Ollama doesn't accept 'text' as a format value
            const body = { model, prompt, stream: false };
            if (format === 'json') {
                body.format = 'json';
            }
            const r = await fetch(`${BASE}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
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