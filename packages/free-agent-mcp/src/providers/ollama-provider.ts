/**
 * Local Ollama Provider
 * 
 * Provider implementation for local Ollama instance.
 * Supports all locally installed models with 0 cost.
 */

import { Ollama } from 'ollama';
import { BaseProvider, ModelInfo, GenerateRequest, GenerateResponse, ProviderConfig } from './base-provider.js';

export class OllamaProvider extends BaseProvider {
  private ollama: Ollama;
  private models: Map<string, ModelInfo> = new Map();

  constructor(config: ProviderConfig = {}) {
    super('ollama', config);
    
    const baseUrl = config.baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.ollama = new Ollama({ host: baseUrl });
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.ollama.list();
      return true;
    } catch {
      return false;
    }
  }

  async discoverModels(): Promise<ModelInfo[]> {
    try {
      const response = await this.ollama.list();
      this.models.clear();

      const models: ModelInfo[] = [];

      for (const model of response.models) {
        const info = this.parseModelInfo(model);
        this.models.set(info.id, info);
        models.push(info);
      }

      return models;
    } catch (error) {
      console.error('[OllamaProvider] Failed to discover models:', error);
      return [];
    }
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const startTime = Date.now();

    try {
      // Build request body
      const body: any = {
        model: request.model,
        prompt: request.prompt,
        stream: false,
        options: {
          temperature: request.temperature ?? 0.2,
          num_predict: request.maxTokens ?? 4096,
        },
      };

      // Add system prompt if provided
      if (request.systemPrompt) {
        body.system = request.systemPrompt;
      }

      // Add format if JSON requested
      if (request.format === 'json') {
        body.format = 'json';
      }

      // Add stop sequences if provided
      if (request.stopSequences && request.stopSequences.length > 0) {
        body.options.stop = request.stopSequences;
      }

      // Use fetch directly to get non-streaming response
      const baseUrl = this.config.baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.config.timeout || 120000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const timeMs = Date.now() - startTime;
      const tokensInput = this.estimateTokens(request.prompt + (request.systemPrompt || ''));
      const tokensOutput = this.estimateTokens(data.response || '');

      return {
        text: data.response || '',
        model: request.model,
        provider: 'ollama',
        tokensInput,
        tokensOutput,
        tokensTotal: tokensInput + tokensOutput,
        cost: 0, // Local models are FREE!
        timeMs,
        finishReason: data.done ? 'stop' : 'length',
      };
    } catch (error: any) {
      throw new Error(`Ollama generation failed: ${error.message}`);
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
   * Parse model information from Ollama response
   */
  private parseModelInfo(model: any): ModelInfo {
    const name = model.name;
    const size = model.size || 0;
    const sizeGB = size / (1024 * 1024 * 1024);

    // Extract family and parameter size from name
    const parts = name.split(':');
    const baseName = parts[0] || name;
    const paramSize = parts[1] || 'unknown';

    // Determine family
    let family = 'unknown';
    if (baseName.includes('qwen')) family = 'qwen';
    else if (baseName.includes('deepseek')) family = 'deepseek';
    else if (baseName.includes('llama')) family = 'llama';
    else if (baseName.includes('codellama')) family = 'codellama';
    else if (baseName.includes('mistral')) family = 'mistral';
    else if (baseName.includes('phi')) family = 'phi';
    else if (baseName.includes('gemma')) family = 'gemma';

    // Detect capabilities based on name
    const capabilities: any[] = ['chat']; // All models can chat
    if (baseName.includes('coder') || baseName.includes('code') || family === 'codellama') {
      capabilities.push('code');
    }
    if (baseName.includes('vision') || baseName.includes('llava')) {
      capabilities.push('vision');
    }
    if (baseName.includes('embed')) {
      capabilities.push('embedding');
    }

    // Determine speed based on size
    let speed: 'fast' | 'medium' | 'slow';
    if (sizeGB < 2) speed = 'fast';
    else if (sizeGB < 5) speed = 'medium';
    else speed = 'slow';

    // Determine quality based on parameter size
    let quality: 'good' | 'better' | 'best';
    const paramNum = parseInt(paramSize);
    if (isNaN(paramNum)) quality = 'good';
    else if (paramNum < 7) quality = 'good';
    else if (paramNum < 20) quality = 'better';
    else quality = 'best';

    // Estimate context length based on model family
    let contextLength = 4096; // Default
    if (family === 'qwen') contextLength = 32768;
    else if (family === 'llama') contextLength = 8192;
    else if (family === 'mistral') contextLength = 8192;

    return {
      id: name,
      name: name,
      provider: 'ollama',
      size,
      contextLength,
      capabilities,
      speed,
      quality,
      // No pricing - local models are FREE!
    };
  }
}

