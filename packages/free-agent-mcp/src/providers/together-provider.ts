/**
 * Together.ai Provider
 * 
 * Provider implementation for Together.ai (wide model selection).
 * Supports many open-source models with competitive pricing.
 */

import { BaseProvider, ModelInfo, GenerateRequest, GenerateResponse, ProviderConfig } from './base-provider.js';

export class TogetherProvider extends BaseProvider {
  private apiKey: string;
  private baseUrl: string;
  private models: Map<string, ModelInfo> = new Map();

  constructor(config: ProviderConfig = {}) {
    super('together', config);
    
    this.apiKey = config.apiKey || process.env.TOGETHER_API_KEY || '';
    this.baseUrl = config.baseUrl || 'https://api.together.xyz/v1';

    // Initialize known Together.ai models
    this.initializeKnownModels();
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      // Try to list models to verify API key
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  async discoverModels(): Promise<ModelInfo[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const models: ModelInfo[] = [];

      for (const model of data || []) {
        const info = this.parseModelInfo(model);
        this.models.set(info.id, info);
        models.push(info);
      }

      return models;
    } catch (error) {
      console.error('[TogetherProvider] Failed to discover models:', error);
      // Return known models as fallback
      return Array.from(this.models.values());
    }
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    if (!this.apiKey) {
      throw new Error('Together.ai API key not configured');
    }

    const startTime = Date.now();

    try {
      const messages: any[] = [];

      // Add system message if provided
      if (request.systemPrompt) {
        messages.push({
          role: 'system',
          content: request.systemPrompt,
        });
      }

      // Add user message
      messages.push({
        role: 'user',
        content: request.prompt,
      });

      const body: any = {
        model: request.model,
        messages,
        temperature: request.temperature ?? 0.2,
        max_tokens: request.maxTokens ?? 4096,
        stream: false,
      };

      // Add stop sequences if provided
      if (request.stopSequences && request.stopSequences.length > 0) {
        body.stop = request.stopSequences;
      }

      // Add JSON mode if requested (if model supports it)
      if (request.format === 'json') {
        body.response_format = { type: 'json_object' };
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.config.timeout || 120000),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }

      const data = await response.json();
      const timeMs = Date.now() - startTime;

      const choice = data.choices?.[0];
      const text = choice?.message?.content || '';
      const tokensInput = data.usage?.prompt_tokens || this.estimateTokens(request.prompt);
      const tokensOutput = data.usage?.completion_tokens || this.estimateTokens(text);

      // Get model info for cost calculation
      const modelInfo = this.models.get(request.model);
      const cost = modelInfo ? this.calculateCost(modelInfo, tokensInput, tokensOutput) : 0;

      return {
        text,
        model: request.model,
        provider: 'together',
        tokensInput,
        tokensOutput,
        tokensTotal: tokensInput + tokensOutput,
        cost,
        timeMs,
        finishReason: choice?.finish_reason || 'stop',
      };
    } catch (error: any) {
      throw new Error(`Together.ai generation failed: ${error.message}`);
    }
  }

  async getModelInfo(modelId: string): Promise<ModelInfo | null> {
    // Check cache first
    if (this.models.has(modelId)) {
      return this.models.get(modelId)!;
    }

    // Try to discover if not in cache
    await this.discoverModels();
    return this.models.get(modelId) || null;
  }

  /**
   * Initialize known Together.ai models with pricing
   */
  private initializeKnownModels(): void {
    const knownModels: ModelInfo[] = [
      {
        id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
        name: 'Llama 3.1 70B Turbo',
        provider: 'together',
        contextLength: 128000,
        capabilities: ['chat', 'code'],
        speed: 'fast',
        quality: 'best',
        pricing: {
          inputPerMillion: 0.88,
          outputPerMillion: 0.88,
        },
      },
      {
        id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
        name: 'Llama 3.1 8B Turbo',
        provider: 'together',
        contextLength: 128000,
        capabilities: ['chat', 'code'],
        speed: 'fast',
        quality: 'good',
        pricing: {
          inputPerMillion: 0.18,
          outputPerMillion: 0.18,
        },
      },
      {
        id: 'Qwen/Qwen2.5-Coder-32B-Instruct',
        name: 'Qwen 2.5 Coder 32B',
        provider: 'together',
        contextLength: 32768,
        capabilities: ['chat', 'code'],
        speed: 'medium',
        quality: 'best',
        pricing: {
          inputPerMillion: 0.80,
          outputPerMillion: 0.80,
        },
      },
      {
        id: 'Qwen/Qwen2.5-Coder-7B-Instruct',
        name: 'Qwen 2.5 Coder 7B',
        provider: 'together',
        contextLength: 32768,
        capabilities: ['chat', 'code'],
        speed: 'fast',
        quality: 'better',
        pricing: {
          inputPerMillion: 0.20,
          outputPerMillion: 0.20,
        },
      },
      {
        id: 'deepseek-ai/deepseek-coder-33b-instruct',
        name: 'DeepSeek Coder 33B',
        provider: 'together',
        contextLength: 16384,
        capabilities: ['chat', 'code'],
        speed: 'medium',
        quality: 'best',
        pricing: {
          inputPerMillion: 0.80,
          outputPerMillion: 0.80,
        },
      },
      {
        id: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        name: 'Mixtral 8x7B',
        provider: 'together',
        contextLength: 32768,
        capabilities: ['chat', 'code'],
        speed: 'fast',
        quality: 'better',
        pricing: {
          inputPerMillion: 0.60,
          outputPerMillion: 0.60,
        },
      },
    ];

    for (const model of knownModels) {
      this.models.set(model.id, model);
    }
  }

  /**
   * Parse model information from Together.ai API response
   */
  private parseModelInfo(model: any): ModelInfo {
    const id = model.id || model.name;
    const existing = this.models.get(id);

    // If we have known info, use it
    if (existing) {
      return existing;
    }

    // Detect capabilities from name
    const capabilities: any[] = ['chat'];
    if (id.toLowerCase().includes('code')) {
      capabilities.push('code');
    }

    // Estimate quality from parameter count
    let quality: 'good' | 'better' | 'best' = 'good';
    if (id.includes('70b') || id.includes('33b') || id.includes('32b')) {
      quality = 'best';
    } else if (id.includes('13b') || id.includes('8x7b')) {
      quality = 'better';
    }

    return {
      id,
      name: model.display_name || id,
      provider: 'together',
      contextLength: model.context_length || 8192,
      capabilities,
      speed: 'medium',
      quality,
      pricing: {
        inputPerMillion: 0.60, // Conservative estimate
        outputPerMillion: 0.60,
      },
    };
  }
}

