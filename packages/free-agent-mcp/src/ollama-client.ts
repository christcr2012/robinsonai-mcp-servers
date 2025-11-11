/**
 * Ollama Client
 *
 * Manages connections to local Ollama instance and model selection.
 * Now with auto-start capability to save Augment credits!
 * Uses shared-llm for reliable connectivity with timeout/retry.
 */

import { Ollama } from 'ollama';
import { spawn } from 'child_process';
import { ollamaGenerate as sharedGenerate, pingOllama } from '@robinson_ai_systems/shared-llm';
import { getModelManager, type ModelSelectionCriteria } from './utils/model-manager.js';

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
      // PRIMARY: Mistral 7B - Excellent for code generation (NEW)
      [
        'mistral:7b',
        {
          name: 'mistral:7b',
          speed: 'medium',
          quality: 'better',
          useCase: ['code', 'medium', 'refactoring', 'tests', 'features'],
        },
      ],
      // FALLBACK: Qwen 7B Coder - Good alternative if Mistral unavailable
      [
        'qwen2.5-coder:7b',
        {
          name: 'qwen2.5-coder:7b',
          speed: 'medium',
          quality: 'good',
          useCase: ['code', 'medium', 'refactoring', 'tests'],
        },
      ],
      // ROUTER: Qwen 3B - Fast for routing/intent detection only
      [
        'qwen2.5:3b',
        {
          name: 'qwen2.5:3b',
          speed: 'fast',
          quality: 'good',
          useCase: ['router', 'intent', 'scaffolding', 'simple'],
        },
      ],
      // EMBEDDINGS: Nomic Embed Text - For semantic search
      [
        'nomic-embed-text',
        {
          name: 'nomic-embed-text',
          speed: 'fast',
          quality: 'good',
          useCase: ['embeddings', 'semantic-search'],
        },
      ],
    ]);
  }

  /**
   * Select the best model for the task
   */
  async selectModel(options: GenerateOptions): Promise<string> {
    const modelManager = getModelManager(this.baseUrl);

    // If model explicitly specified, use it (but verify it exists)
    if (options.model && options.model !== 'auto') {
      const modelMap: Record<string, string> = {
        'primary': 'mistral:7b',
        'fallback': 'qwen2.5-coder:7b',
        'router': 'qwen2.5:3b',
        'mistral': 'mistral:7b',
        'qwen-coder': 'qwen2.5-coder:7b',
      };
      const requestedModel = modelMap[options.model] || options.model;

      // Check if model exists
      const modelInfo = modelManager.getModelInfo(requestedModel);
      if (modelInfo) {
        return requestedModel;
      }

      // Fall through to auto-selection if model doesn't exist
      console.warn(`[OllamaClient] Requested model ${requestedModel} not found, auto-selecting...`);
    }

    // Auto-select: Try Mistral first (primary), then fallback to Qwen
    const modelManager_models = await modelManager.listAvailableModels();

    // Prefer Mistral for code generation
    if (modelManager_models.includes('mistral:7b')) {
      return 'mistral:7b';
    }

    // Fallback to Qwen 7B Coder
    if (modelManager_models.includes('qwen2.5-coder:7b')) {
      return 'qwen2.5-coder:7b';
    }

    // Last resort: use ModelManager's selection
    const criteria: ModelSelectionCriteria = {
      task: 'code', // Default to code task
      complexity: (options.complexity as any) || 'medium',
      preferSpeed: false, // Prefer quality over speed for code
      requiredCapabilities: ['code'],
    };

    const selectedModel = await modelManager.selectModel(criteria);

    if (!selectedModel) {
      throw new Error('No Ollama models available. Please pull mistral:7b or qwen2.5-coder:7b.');
    }

    return selectedModel;
  }

  /**
   * Generate text using Ollama (with auto-start, dynamic model selection, and adaptive timeouts!)
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

    const modelManager = getModelManager(this.baseUrl);

    // Discover models if not done yet
    await modelManager.discoverModels();

    // Select best model
    const model = await this.selectModel(options);
    const startTime = Date.now();

    // Get adaptive timeout based on model size and environment config
    // Check if model is already loaded (warm start) or needs to be loaded (cold start)
    const isColdStart = false; // Assume warm start after first use

    // Use environment-configured timeouts if available
    let timeout = await modelManager.getAdaptiveTimeout(model, isColdStart);

    // Override with environment variables if set
    if (process.env.OLLAMA_REQUEST_TIMEOUT) {
      timeout = parseInt(process.env.OLLAMA_REQUEST_TIMEOUT, 10) * 1000; // Convert seconds to ms
    } else if (isColdStart && process.env.OLLAMA_STARTUP_TIMEOUT) {
      timeout = parseInt(process.env.OLLAMA_STARTUP_TIMEOUT, 10) * 1000;
    } else if (!isColdStart && process.env.OLLAMA_WARMUP_TIMEOUT) {
      timeout = parseInt(process.env.OLLAMA_WARMUP_TIMEOUT, 10) * 1000;
    }

    console.error(`[OllamaClient] Using model: ${model} (timeout: ${timeout}ms, cold_start: ${isColdStart})`);
    console.error(`[OllamaClient] Prompt length: ${prompt.length} chars`);

    try {
      // Use shared client with adaptive timeout and retry
      console.error('[OllamaClient] Calling sharedGenerate...');
      const text = await sharedGenerate({
        model,
        prompt,
        format: 'text',
        timeoutMs: timeout,
        retries: 2
      });

      const timeMs = Date.now() - startTime;
      console.error(`[OllamaClient] sharedGenerate completed in ${timeMs}ms`);

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
      // If model not found, try fallback
      if (error.message?.includes('not found') || error.message?.includes('404')) {
        console.warn(`[OllamaClient] Model ${model} failed, trying fallback...`);

        const criteria: ModelSelectionCriteria = {
          task: 'code',
          complexity: (options.complexity as any) || 'simple',
        };

        const fallbackChain = await modelManager.getFallbackChain(model, criteria);

        // Try first fallback
        if (fallbackChain.length > 1) {
          const fallbackModel = fallbackChain[1];
          console.error(`[OllamaClient] Retrying with fallback model: ${fallbackModel}`);

          const fallbackTimeout = await modelManager.getAdaptiveTimeout(fallbackModel, isColdStart);

          const text = await sharedGenerate({
            model: fallbackModel,
            prompt,
            format: 'text',
            timeoutMs: fallbackTimeout,
            retries: 1
          });

          const timeMs = Date.now() - startTime;
          const tokensInput = Math.ceil(prompt.length / 4);
          const tokensGenerated = Math.ceil(text.length / 4);

          return {
            text,
            model: fallbackModel,
            tokensGenerated,
            tokensInput,
            tokensTotal: tokensInput + tokensGenerated,
            timeMs,
          };
        }

        throw new Error(
          `No available models found. Please pull at least one model: ollama pull qwen2.5:3b`
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
        'mistral:7b',           // PRIMARY: Excellent for code
        'qwen2.5-coder:7b',     // FALLBACK: Good alternative
        'qwen2.5:3b',           // ROUTER: Fast for routing
        'nomic-embed-text',     // EMBEDDINGS: For semantic search
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
   * Enhanced with better detection, configurable timeout, and exponential backoff
   */
  private async startOllama(): Promise<void> {
    console.error('🚀 Auto-starting Ollama...');

    // Get configurable timeout from environment (default: 180 seconds for cold start)
    const timeoutSeconds = parseInt(process.env.OLLAMA_STARTUP_TIMEOUT || '180', 10);
    console.error(`⏱️ Using startup timeout: ${timeoutSeconds} seconds`);

    // Get Ollama path from environment or use defaults
    const ollamaPath = process.env.OLLAMA_PATH || (
      process.platform === 'win32'
        ? 'C:\\Users\\chris\\AppData\\Local\\Programs\\Ollama\\ollama.exe'
        : 'ollama'
    );

    try {
      // First, check if Ollama is already running (might be Windows service)
      console.error('🔍 Checking if Ollama is already running...');
      console.error(`🔗 Base URL: ${this.baseUrl}`);
      const isRunning = await pingOllama(5000); // Increased timeout for initial check

      if (isRunning) {
        console.error('✅ Ollama is already running!');
        return;
      }

      console.error('❌ Ollama not responding, attempting to start...');

      console.error(`🚀 Spawning Ollama process: ${ollamaPath}`);

      this.ollamaProcess = spawn(ollamaPath, ['serve'], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      });

      this.ollamaProcess.unref();
      this.startedByUs = true;

      console.error(`⏳ Waiting for Ollama to be ready (timeout: ${timeoutSeconds}s)...`);

      // Exponential backoff: 1s, 2s, 4s, 8s, then 1s intervals
      const delays = [1000, 2000, 4000, 8000];
      let totalWait = 0;
      let attemptCount = 0;

      while (totalWait < timeoutSeconds * 1000) {
        const delay = attemptCount < delays.length ? delays[attemptCount] : 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        totalWait += delay;
        attemptCount++;

        try {
          const ready = await pingOllama(2000);
          if (ready) {
            console.error(`✅ Ollama ready after ${totalWait}ms!`);
            return;
          }
        } catch {
          // Not ready yet, continue waiting
          console.error(`⏳ Still waiting... (${Math.floor(totalWait / 1000)}s / ${timeoutSeconds}s)`);
        }
      }

      throw new Error(`Ollama started but not ready within ${timeoutSeconds} seconds. Try increasing OLLAMA_START_TIMEOUT.`);
    } catch (error: any) {
      // Better error messages
      if (error.code === 'ENOENT') {
        throw new Error(
          `Ollama not found at: ${ollamaPath}\n` +
          `Please install Ollama from https://ollama.com or set OLLAMA_PATH environment variable.`
        );
      }

      if (error.code === 'EADDRINUSE' || error.message?.includes('address already in use')) {
        throw new Error(
          `Port 11434 is already in use. Another Ollama instance may be running.\n` +
          `Try: pkill ollama (Linux/Mac) or taskkill /F /IM ollama.exe (Windows)`
        );
      }

      throw new Error(`Failed to auto-start Ollama: ${error.message}`);
    }
  }

  /**
   * Ensure Ollama is running (auto-start if needed)
   * Enhanced with better health checking using pingOllama
   */
  async ensureRunning(): Promise<void> {
    console.error(`[OllamaClient] Ensuring Ollama is running at ${this.baseUrl}...`);

    try {
      // Use pingOllama for more reliable health check with longer timeout
      console.error('[OllamaClient] Checking Ollama health...');
      const isRunning = await pingOllama(10000); // 10 second timeout

      if (isRunning) {
        console.error('[OllamaClient] ✅ Ollama is running and healthy!');
        return; // Already running, all good!
      }

      console.error('[OllamaClient] ❌ Ollama not responding');

      // Not running, try to start if auto-start enabled
      if (this.autoStart) {
        console.error('[OllamaClient] Auto-start enabled, attempting to start Ollama...');
        await this.startOllama();

        // Verify it started successfully
        const isNowRunning = await pingOllama(5000);
        if (!isNowRunning) {
          throw new Error('Ollama started but still not responding to health checks');
        }
        console.error('[OllamaClient] ✅ Ollama started successfully!');
      } else {
        throw new Error(
          'Ollama is not running. Please start Ollama with: ollama serve\n' +
          'Or enable auto-start by setting autoStart=true in constructor.'
        );
      }
    } catch (error: any) {
      console.error(`[OllamaClient] Error in ensureRunning: ${error.message}`);

      // If pingOllama failed and we haven't tried auto-start yet, try it
      if (this.autoStart && !error.message?.includes('auto-start') && !error.message?.includes('started but still not responding')) {
        console.error('[OllamaClient] Ping failed, trying auto-start as fallback...');
        await this.startOllama();
      } else {
        throw error;
      }
    }
  }

  /**
   * Cleanup spawned Ollama process on shutdown
   */
  async cleanup(): Promise<void> {
    if (this.ollamaProcess && this.startedByUs) {
      console.error('🧹 Cleaning up spawned Ollama process...');
      try {
        this.ollamaProcess.kill();
        console.error('✅ Ollama process terminated');
      } catch (error: any) {
        console.error(`⚠️ Failed to kill Ollama process: ${error.message}`);
      }
    }
  }
}

