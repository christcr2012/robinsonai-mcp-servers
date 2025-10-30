/**
 * Code Generator Agent
 * 
 * Generates code using local LLMs (Ollama).
 * Saves 90%+ Augment credits!
 */

import { OllamaClient, GenerateOptions } from '../ollama-client.js';
import { PromptBuilder } from '../utils/prompt-builder.js';

export interface GenerateRequest {
  task: string;
  context: string;
  template?: string;
  model?: string;
  complexity?: 'simple' | 'medium' | 'complex';
}

export interface GenerateResult {
  code: string;
  files?: Array<{
    path: string;
    content: string;
  }>;
  augmentCreditsUsed: number;
  creditsSaved: number;
  model: string;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost: {
    total: number;
    currency: string;
    note: string;
  };
  timeMs: number;
}

export class CodeGenerator {
  private ollama: OllamaClient;
  private promptBuilder: PromptBuilder;

  constructor(ollama: OllamaClient) {
    this.ollama = ollama;
    this.promptBuilder = new PromptBuilder();
  }

  /**
   * Generate code from task description
   */
  async generate(request: GenerateRequest): Promise<GenerateResult> {
    const prompt = this.promptBuilder.buildGenerationPrompt(request);

    const options: GenerateOptions = {
      model: request.model,
      complexity: request.complexity || 'medium',
      temperature: 0.7,
      maxTokens: 4096,
    };

    const result = await this.ollama.generate(prompt, options);

    // Parse the generated code
    const { code, files } = this.parseGeneratedCode(result.text);

    // Calculate credit savings
    // Augment would use ~13,000 credits to generate this
    // We use ~500 credits (just for planning)
    const augmentCreditsUsed = 500;
    const creditsSaved = 13000 - augmentCreditsUsed;

    return {
      code,
      files,
      augmentCreditsUsed,
      creditsSaved,
      model: result.model,
      tokens: {
        input: result.tokensInput || 0,
        output: result.tokensGenerated || 0,
        total: result.tokensTotal || 0,
      },
      cost: {
        total: 0,
        currency: 'USD',
        note: 'FREE - Local Ollama model',
      },
      timeMs: result.timeMs,
    };
  }

  /**
   * Generate tests for code
   */
  async generateTests(request: {
    code: string;
    framework: string;
    coverage?: string;
    model?: string;
  }): Promise<GenerateResult> {
    const prompt = this.promptBuilder.buildTestPrompt(request);

    const options: GenerateOptions = {
      model: request.model,
      complexity: 'medium',
      temperature: 0.5, // Lower temp for tests (more deterministic)
      maxTokens: 4096,
    };

    const result = await this.ollama.generate(prompt, options);

    const { code, files } = this.parseGeneratedCode(result.text);

    return {
      code,
      files,
      augmentCreditsUsed: 400,
      creditsSaved: 8000,
      model: result.model,
      tokens: {
        input: result.tokensInput || 0,
        output: result.tokensGenerated || 0,
        total: result.tokensTotal || 0,
      },
      cost: {
        total: 0,
        currency: 'USD',
        note: 'FREE - Local Ollama model',
      },
      timeMs: result.timeMs,
    };
  }

  /**
   * Generate documentation
   */
  async generateDocs(request: {
    code: string;
    style?: string;
    detail?: string;
  }): Promise<GenerateResult> {
    const prompt = this.promptBuilder.buildDocPrompt(request);

    const options: GenerateOptions = {
      model: 'qwen-coder', // Fast model for docs
      complexity: 'simple',
      temperature: 0.3, // Very deterministic for docs
      maxTokens: 2048,
    };

    const result = await this.ollama.generate(prompt, options);

    return {
      code: result.text,
      augmentCreditsUsed: 200,
      creditsSaved: 3000,
      model: result.model,
      tokens: {
        input: result.tokensInput || 0,
        output: result.tokensGenerated || 0,
        total: result.tokensTotal || 0,
      },
      cost: {
        total: 0,
        currency: 'USD',
        note: 'FREE - Local Ollama model',
      },
      timeMs: result.timeMs,
    };
  }

  /**
   * Parse generated code into structured format
   */
  private parseGeneratedCode(text: string): {
    code: string;
    files?: Array<{ path: string; content: string }>;
  } {
    // Check if response contains multiple files
    const filePattern = /```(\w+)?\s*\/\/\s*(.+?)\n([\s\S]+?)```/g;
    const matches = Array.from(text.matchAll(filePattern));

    if (matches.length > 1) {
      // Multiple files
      const files = matches.map((match) => ({
        path: match[2].trim(),
        content: match[3].trim(),
      }));

      return { code: '', files };
    }

    // Single code block
    const codeBlockPattern = /```(?:\w+)?\n([\s\S]+?)```/;
    const match = text.match(codeBlockPattern);

    if (match) {
      return { code: match[1].trim() };
    }

    // No code blocks, return as-is
    return { code: text.trim() };
  }
}

