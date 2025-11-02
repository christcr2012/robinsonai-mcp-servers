/**
 * Unified LLM Client
 * 
 * Supports Ollama (FREE), OpenAI (PAID), and Claude (PAID)
 * Provides consistent interface across all providers
 */

import { ollamaGenerate } from './ollama-client.js';

export interface LLMGenerateOptions {
  provider: 'ollama' | 'openai' | 'claude';
  model: string;
  prompt: string;
  format?: 'json' | 'text';
  timeoutMs?: number;
  retries?: number;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMGenerateResult {
  text: string;
  model: string;
  provider: string;
  tokensInput?: number;
  tokensOutput?: number;
  tokensTotal?: number;
  cost?: number;
}

/**
 * Generate text using any LLM provider
 */
export async function llmGenerate(options: LLMGenerateOptions): Promise<LLMGenerateResult> {
  const { provider, model, prompt, format, timeoutMs, retries, temperature, maxTokens } = options;

  console.error(`[LLM Client] Using provider: ${provider}, model: ${model}`);

  if (provider === 'ollama') {
    // Use Ollama (FREE)
    const response = await ollamaGenerate({
      model,
      prompt,
      format,
      timeoutMs,
      retries,
    });

    // Estimate tokens (rough: 1 token ≈ 4 chars)
    const tokensInput = Math.ceil(prompt.length / 4);
    const tokensOutput = Math.ceil(response.length / 4);

    return {
      text: response,
      model,
      provider: 'ollama',
      tokensInput,
      tokensOutput,
      tokensTotal: tokensInput + tokensOutput,
      cost: 0,
    };
  }

  if (provider === 'openai') {
    // Use OpenAI (PAID)
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: temperature ?? 0.2,
      max_tokens: maxTokens ?? 4096,
      response_format: format === 'json' ? { type: 'json_object' } : undefined,
    });

    const text = response.choices[0]?.message?.content || '';
    const tokensInput = response.usage?.prompt_tokens || 0;
    const tokensOutput = response.usage?.completion_tokens || 0;
    const tokensTotal = response.usage?.total_tokens || 0;

    // Calculate cost (approximate - will be refined with actual pricing)
    const costPerInputToken = 0.0025 / 1000; // gpt-4o: $0.0025 per 1K input tokens
    const costPerOutputToken = 0.01 / 1000; // gpt-4o: $0.01 per 1K output tokens
    const cost = (tokensInput * costPerInputToken) + (tokensOutput * costPerOutputToken);

    return {
      text,
      model,
      provider: 'openai',
      tokensInput,
      tokensOutput,
      tokensTotal,
      cost,
    };
  }

  if (provider === 'claude') {
    // Use Claude (PAID)
    const { Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await client.messages.create({
      model,
      max_tokens: maxTokens ?? 4096,
      temperature: temperature ?? 0.2,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    const text = content.type === 'text' ? content.text : '';
    const tokensInput = response.usage.input_tokens;
    const tokensOutput = response.usage.output_tokens;
    const tokensTotal = tokensInput + tokensOutput;

    // Calculate cost (approximate - will be refined with actual pricing)
    const costPerInputToken = 0.003 / 1000; // claude-3-5-sonnet: $0.003 per 1K input tokens
    const costPerOutputToken = 0.015 / 1000; // claude-3-5-sonnet: $0.015 per 1K output tokens
    const cost = (tokensInput * costPerInputToken) + (tokensOutput * costPerOutputToken);

    return {
      text,
      model,
      provider: 'claude',
      tokensInput,
      tokensOutput,
      tokensTotal,
      cost,
    };
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

/**
 * Generate JSON using any LLM provider
 */
export async function llmGenerateJSON<T = any>(options: Omit<LLMGenerateOptions, 'format'>): Promise<{
  data: T;
  result: LLMGenerateResult;
}> {
  const result = await llmGenerate({
    ...options,
    format: 'json',
  });

  try {
    const data = JSON.parse(result.text);
    return { data, result };
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : error}`);
  }
}

