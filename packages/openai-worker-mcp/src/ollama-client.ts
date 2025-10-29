/**
 * Ollama Client using OpenAI SDK
 * 
 * Uses OpenAI SDK with baseURL override to call Ollama's OpenAI-compatible API.
 * This allows us to use the same SDK for both Ollama (FREE) and OpenAI (PAID).
 */

import OpenAI from 'openai';
import { getModelConfig } from './model-catalog.js';

export interface OllamaClientConfig {
  baseURL?: string;
  apiKey?: string;
}

export interface ChatCompletionParams {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResult {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string;
}

export class OllamaClient {
  private client: OpenAI;
  private baseURL: string;

  constructor(config: OllamaClientConfig = {}) {
    this.baseURL = config.baseURL || process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1';
    
    // Create OpenAI client with Ollama baseURL
    this.client = new OpenAI({
      baseURL: this.baseURL,
      apiKey: config.apiKey || 'ollama', // Required but unused by Ollama
    });

    console.error(`[OllamaClient] Initialized with baseURL: ${this.baseURL}`);
  }

  /**
   * Create chat completion using Ollama
   */
  async chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResult> {
    const { model, messages, temperature = 0.7, maxTokens, stream = false } = params;

    // Get model config to extract actual model name
    const modelConfig = getModelConfig(model);
    const actualModel = modelConfig.model;

    console.error(`[OllamaClient] Creating chat completion with model: ${actualModel}`);

    try {
      const response = await this.client.chat.completions.create({
        model: actualModel,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false, // Force non-streaming for now
      });

      // Type guard to ensure we have a ChatCompletion (not a stream)
      if ('choices' in response && Array.isArray(response.choices)) {
        const choice = response.choices[0];
        if (!choice) {
          throw new Error('No response from Ollama');
        }

        return {
          content: choice.message.content || '',
          usage: {
            promptTokens: response.usage?.prompt_tokens || 0,
            completionTokens: response.usage?.completion_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0,
          },
          model: actualModel,
          finishReason: choice.finish_reason || 'stop',
        };
      } else {
        throw new Error('Unexpected response format from Ollama');
      }
    } catch (error: any) {
      console.error(`[OllamaClient] Error:`, error.message);
      throw new Error(`Ollama chat completion failed: ${error.message}`);
    }
  }

  /**
   * Check if Ollama is available
   */
  async ping(): Promise<boolean> {
    try {
      // Try to list models as a health check
      await this.client.models.list();
      console.error('[OllamaClient] Ping successful');
      return true;
    } catch (error: any) {
      console.error('[OllamaClient] Ping failed:', error.message);
      return false;
    }
  }

  /**
   * List available Ollama models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await this.client.models.list();
      const models = response.data.map((model: any) => model.id);
      console.error(`[OllamaClient] Found ${models.length} models:`, models);
      return models;
    } catch (error: any) {
      console.error('[OllamaClient] Failed to list models:', error.message);
      return [];
    }
  }

  /**
   * Get base URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }
}

/**
 * Shared singleton instance
 */
let sharedOllamaClient: OllamaClient | null = null;

/**
 * Get shared Ollama client instance
 */
export function getSharedOllamaClient(): OllamaClient {
  if (!sharedOllamaClient) {
    sharedOllamaClient = new OllamaClient();
  }
  return sharedOllamaClient;
}

