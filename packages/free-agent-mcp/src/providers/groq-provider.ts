/**
 * Groq Provider
 * 
 * Provider implementation for Groq Cloud (ultra-fast inference).
 * Supports Llama, Mixtral, and other models with competitive pricing.
 */

import { BaseProvider, ModelInfo, GenerateRequest, GenerateResponse, ProviderConfig } from './base-provider.js';

export class GroqProvider extends BaseProvider {
  private apiKey: string;
  private baseUrl: string;
  private models: Map<string, ModelInfo> = new Map();

  constructor(config: ProviderConfig = {}) {
    super('groq', config);
    
    this.apiKey = config.apiKey || process.env.GROQ_API_KEY || '';
    this.baseUrl = config.baseUrl || 'https://api.groq.com/openai/v1';

    // Initialize known Groq models
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

      for (const model of data.data || []) {
        const info = this.parseModelInfo(model);
        this.models.set(info.id, info);
        models.push(info);
      }

      return models;
    } catch (error) {
      console.error('[GroqProvider] Failed to discover models:', error);
      // Return known models as fallback
      return Array.from(this.models.values());
    }
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    if (!this.apiKey) {
      throw new Error('Groq API key not configured');
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

      // Add JSON mode if requested
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
        provider: 'groq',
        tokensInput,
        tokensOutput,
        tokensTotal: tokensInput + tokensOutput,
        cost,
        timeMs,
        finishReason: choice?.finish_reason || 'stop',
      };
    } catch (error: any) {
      throw new Error(`Groq generation failed: ${error.message}`);
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
   * Initialize known Groq models with pricing
   */
  private initializeKnownModels(): void {
    const knownModels: ModelInfo[] = [
      {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B',
        provider: 'groq',
        contextLength: 128000,
        capabilities: ['chat', 'code'],
        speed: 'fast',
        quality: 'best',
        pricing: {
          inputPerMillion: 0.59,
          outputPerMillion: 0.79,
        },
      },
      {
        id: 'llama-3.1-70b-versatile',
        name: 'Llama 3.1 70B',
        provider: 'groq',
        contextLength: 128000,
        capabilities: ['chat', 'code'],
        speed: 'fast',
        quality: 'best',
        pricing: {
          inputPerMillion: 0.59,
          outputPerMillion: 0.79,
        },
      },
      {
        id: 'llama-3.1-8b-instant',
        name: 'Llama 3.1 8B',
        provider: 'groq',
        contextLength: 128000,
        capabilities: ['chat', 'code'],
        speed: 'fast',
        quality: 'good',
        pricing: {
          inputPerMillion: 0.05,
          outputPerMillion: 0.08,
        },
      },
      {
        id: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B',
        provider: 'groq',
        contextLength: 32768,
        capabilities: ['chat', 'code'],
        speed: 'fast',
        quality: 'better',
        pricing: {
          inputPerMillion: 0.24,
          outputPerMillion: 0.24,
        },
      },
      {
        id: 'gemma2-9b-it',
        name: 'Gemma 2 9B',
        provider: 'groq',
        contextLength: 8192,
        capabilities: ['chat', 'code'],
        speed: 'fast',
        quality: 'good',
        pricing: {
          inputPerMillion: 0.20,
          outputPerMillion: 0.20,
        },
      },
    ];

    for (const model of knownModels) {
      this.models.set(model.id, model);
    }
  }

  /**
   * Parse model information from Groq API response
   */
  private parseModelInfo(model: any): ModelInfo {
    const id = model.id;
    const existing = this.models.get(id);

    // If we have known info, use it
    if (existing) {
      return existing;
    }

    // Otherwise, create basic info
    return {
      id,
      name: id,
      provider: 'groq',
      contextLength: 8192, // Default
      capabilities: ['chat'],
      speed: 'fast', // Groq is always fast
      quality: 'good',
      pricing: {
        inputPerMillion: 0.50, // Conservative estimate
        outputPerMillion: 0.50,
      },
    };
  }
}

