/**
 * Ollama Client
 *
 * Manages connections to local Ollama instance and model selection.
 * Now with auto-start capability to save Augment credits!
 * Uses shared-llm for reliable connectivity with timeout/retry.
 */

import { Ollama } from 'ollama';
import { spawn } from 'child_process';
import { ollamaGenerate as sharedGenerate, pingOllama } from '@robinsonai/shared-llm';

export interface ModelConfig {
  name: string;
  speed: 'fast' | 'medium' | 'slow';
  quality: 'good' | 'better' | 'best';
  useCase: string[];
}

export interface GenerateOptions {
  model?: string;
  complexity?: 'simple' | 'medium' | 'complex';
  temperature?: number;
  maxTokens?: number;
}

export class OllamaClient {
  private ollama: any;
  private models: Map<string, ModelConfig>;
  private baseUrl: string;
  private autoStart: boolean;
  private ollamaProcess: any = null;
  private startedByUs: boolean = false;

  constructor(autoStart: boolean = true) {
    // Support remote Ollama via environment variable
    // Local (default): http://localhost:11434
    // Remote: https://ollama.my-internal-host:11434
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.ollama = new (Ollama as any)({ host: this.baseUrl });
    this.models = this.initializeModels();
    this.autoStart = autoStart;
  }

  /**
   * Get the current Ollama base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  private initializeModels(): Map<string, ModelConfig> {
    return new Map([
      // Fast router models (3B) - for intent & scaffolding
      [
        'qwen2.5:3b',
        {
          name: 'qwen2.5:3b',
          speed: 'fast',
          quality: 'good',
          useCase: ['router', 'intent', 'scaffolding', 'simple'],
        },
      ],
      [
        'llama3.2:3b',
        {
          name: 'llama3.2:3b',
          speed: 'fast',
          quality: 'good',
          useCase: ['router', 'intent', 'scaffolding', 'simple'],
        },
      ],
      // Big coder models (32-34B) - for complex tasks
      [
        'deepseek-coder:33b',
        {
          name: 'deepseek-coder:33b',
          speed: 'slow',
          quality: 'best',
          useCase: ['complex', 'algorithms', 'architecture'],
        },
      ],
      [
        'qwen2.5-coder:32b',
        {
          name: 'qwen2.5-coder:32b',
          speed: 'fast',
          quality: 'good',
          useCase: ['simple', 'crud', 'boilerplate'],
        },
      ],
      [
        'codellama:34b',
        {
          name: 'codellama:34b',
          speed: 'medium',
          quality: 'better',
          useCase: ['medium', 'refactoring', 'tests'],
        },
      ],
    ]);
  }

  /**
   * Select the best model for the task
   */
  selectModel(options: GenerateOptions): string {
    // If model explicitly specified, use it
    if (options.model && options.model !== 'auto') {
      const modelMap: Record<string, string> = {
        'router': 'qwen2.5:3b',
        'router-alt': 'llama3.2:3b',
        'deepseek-coder': 'deepseek-coder:33b',
        'qwen-coder': 'qwen2.5-coder:32b',
        'codellama': 'codellama:34b',
      };
      return modelMap[options.model] || 'codellama:34b';
    }

    // Auto-select based on complexity
    const complexity = options.complexity || 'medium';

    switch (complexity) {
      case 'simple':
        // Use fast 3B router model for simple tasks (10x faster!)
        return 'qwen2.5:3b';
      case 'complex':
        // Use best quality 33B model for complex tasks
        return 'deepseek-coder:33b';
      case 'medium':
      default:
        // Use balanced 34B model for medium tasks
        return 'codellama:34b';
    }
  }

  /**
   * Generate text using Ollama (with auto-start and shared client!)
   */
  async generate(prompt: string, options: GenerateOptions = {}): Promise<{
    text: string;
    model: string;
    tokensGenerated: number;
    tokensInput: number;
    tokensTotal: number;
    timeMs: number;
  }> {
    // Auto-start Ollama if needed (saves Augment credits!)
    await this.ensureRunning();

    const model = this.selectModel(options);
    const startTime = Date.now();

    try {
      // Use shared client with timeout/retry for reliability
      const text = await sharedGenerate({
        model,
        prompt,
        format: 'text',
        timeoutMs: 45000,
        retries: 2
      });

      const timeMs = Date.now() - startTime;

      // Estimate tokens (rough approximation: 1 token ≈ 4 chars)
      const tokensInput = Math.ceil(prompt.length / 4);
      const tokensGenerated = Math.ceil(text.length / 4);

      return {
        text,
        model,
        tokensGenerated,
        tokensInput,
        tokensTotal: tokensInput + tokensGenerated,
        timeMs,
      };
    } catch (error: any) {
      // If model not found, suggest pulling it
      if (error.message?.includes('not found')) {
        throw new Error(
          `Model ${model} not found. Please run: ollama pull ${model}`
        );
      }
      throw error;
    }
  }

  /**
   * Check if Ollama is running and models are available
   */
  async checkHealth(): Promise<{
    running: boolean;
    models: string[];
    errors: string[];
  }> {
    const errors: string[] = [];
    let running = false;
    let availableModels: string[] = [];

    try {
      // Check if Ollama is running
      const response = await this.ollama.list();
      running = true;
      availableModels = response.models.map((m: any) => m.name);

      // Check if recommended models are available
      const recommendedModels = [
        'qwen2.5:3b',           // Fast router
        'deepseek-coder:33b',   // Best quality
        'qwen2.5-coder:32b',    // Fast coder
        'codellama:34b',        // Balanced
      ];

      for (const model of recommendedModels) {
        if (!availableModels.includes(model)) {
          errors.push(`Model ${model} not found. Run: ollama pull ${model}`);
        }
      }
    } catch (error: any) {
      errors.push(`Ollama not running. Please start Ollama.`);
    }

    return {
      running,
      models: availableModels,
      errors,
    };
  }

  /**
   * Get model info
   */
  getModelInfo(modelName: string): ModelConfig | undefined {
    return this.models.get(modelName);
  }

  /**
   * List all configured models
   */
  listModels(): ModelConfig[] {
    return Array.from(this.models.values());
  }

  /**
   * Auto-start Ollama if not running (saves Augment credits!)
   */
  private async startOllama(): Promise<void> {
    console.error('🚀 Auto-starting Ollama...');

    const ollamaPath = process.platform === 'win32'
      ? 'C:\\Users\\chris\\AppData\\Local\\Programs\\Ollama\\ollama.exe'
      : 'ollama';

    try {
      this.ollamaProcess = spawn(ollamaPath, ['serve'], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      });

      this.ollamaProcess.unref();
      this.startedByUs = true;

      console.error('⏳ Waiting for Ollama to be ready...');

      // Wait up to 30 seconds
      for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          await this.ollama.list();
          console.error('✅ Ollama ready!');
          return;
        } catch {
          // Not ready yet
        }
      }

      throw new Error('Ollama started but not ready within 30 seconds');
    } catch (error: any) {
      throw new Error(`Failed to auto-start Ollama: ${error.message}`);
    }
  }

  /**
   * Ensure Ollama is running (auto-start if needed)
   */
  async ensureRunning(): Promise<void> {
    try {
      // Quick health check
      await this.ollama.list();
    } catch (error) {
      // Ollama not running
      if (this.autoStart) {
        await this.startOllama();
      } else {
        throw new Error('Ollama is not running. Please start Ollama with: ollama serve');
      }
    }
  }
}

