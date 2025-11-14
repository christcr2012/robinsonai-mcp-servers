// LLM Router with Ollama health check and provider selection
import http from 'node:http';

export type ProviderName = 'ollama' | 'openai' | 'anthropic' | 'moonshot';

export type Providers = {
  ollama?: { baseUrl: string };
  openai?: { apiKey?: string };
  anthropic?: { apiKey?: string };
  moonshot?: { apiKey?: string; baseUrl?: string };
};

export type LlmRouter = {
  hasOllama: boolean;
  pick(modelHint?: 'fast' | 'medium' | 'complex'): ProviderName;
  order: ProviderName[];
  providers: Providers;
};

/**
 * Check if Ollama is reachable at the given base URL
 */
async function isOllamaUp(baseUrl: string, timeoutMs = 1500): Promise<boolean> {
  const url = new URL('/api/tags', baseUrl);
  return new Promise<boolean>((resolve) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      // 200 with JSON listing tags is enough
      resolve(res.statusCode! >= 200 && res.statusCode! < 500);
      res.resume();
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.on('error', () => resolve(false));
  });
}

/**
 * Create an LLM router that detects available providers and selects the best one
 * based on agent type (free-agent prefers Ollama, paid-agent prefers cloud)
 */
export async function createLlmRouter(env = process.env): Promise<LlmRouter> {
  const providers: Providers = {
    ollama: env.OLLAMA_BASE_URL ? { baseUrl: env.OLLAMA_BASE_URL } : undefined,
    openai: env.OPENAI_API_KEY ? { apiKey: env.OPENAI_API_KEY } : undefined,
    anthropic: env.ANTHROPIC_API_KEY ? { apiKey: env.ANTHROPIC_API_KEY } : undefined,
    moonshot: env.MOONSHOT_API_KEY ? {
      apiKey: env.MOONSHOT_API_KEY,
      baseUrl: env.MOONSHOT_BASE_URL ?? 'https://api.moonshot.cn/v1'
    } : undefined,
  };

  const strictOllama = env.FREE_AGENT_STRICT_OLLAMA === '1';
  const wantOllama = !!providers.ollama;

  let ollamaReady = false;
  if (wantOllama) {
    const healthTimeout = Number(env.OLLAMA_HEALTH_TIMEOUT_MS) || 1500;
    ollamaReady = await isOllamaUp(providers.ollama!.baseUrl, healthTimeout);
  }

  if (strictOllama && !ollamaReady) {
    throw new Error(
      `Ollama is required but not reachable at ${providers.ollama?.baseUrl ?? '(unset)'}. ` +
      `Start Ollama or set FREE_AGENT_STRICT_OLLAMA=0 to use cloud providers.`
    );
  }

  // Select provider order by agent
  const order: ProviderName[] = [];
  if (env.AGENT_NAME === 'free-agent') {
    // Free Agent: Ollama-first, then Moonshot (cheap remote), then OpenAI/Anthropic
    if (ollamaReady) order.push('ollama');
    if (providers.moonshot) order.push('moonshot'); // Kimi K2 is cheap and good for coding
    if (providers.openai) order.push('openai');
    if (providers.anthropic) order.push('anthropic');
  } else {
    // Paid Agent or others: cloud-first (quality over cost)
    if (providers.openai) order.push('openai');
    if (providers.anthropic) order.push('anthropic');
    if (providers.moonshot) order.push('moonshot'); // Moonshot as fallback for paid
    if (ollamaReady) order.push('ollama');
  }

  if (order.length === 0) {
    throw new Error(
      'No LLM providers available. Supply OPENAI_API_KEY / ANTHROPIC_API_KEY / MOONSHOT_API_KEY, or run Ollama.'
    );
  }

  // Log startup banner
  const agentName = env.AGENT_NAME || 'unknown';
  console.error(`\n[${agentName}] LLM Router initialized`);
  console.error(`[${agentName}] Available providers: ${order.join(', ')}`);
  console.error(`[${agentName}] Primary provider: ${order[0]}`);
  if (ollamaReady && providers.ollama) {
    console.error(`[${agentName}] Ollama: ✓ reachable at ${providers.ollama.baseUrl}`);
  } else if (wantOllama && !ollamaReady) {
    console.error(`[${agentName}] Ollama: ✗ not reachable (using cloud fallback)`);
  }
  console.error('');

  return {
    hasOllama: ollamaReady,
    pick(modelHint?: 'fast' | 'medium' | 'complex') {
      // Simple heuristic: prefer earlier providers
      // Could be extended to route based on modelHint
      return order[0];
    },
    order,
    providers,
  };
}

