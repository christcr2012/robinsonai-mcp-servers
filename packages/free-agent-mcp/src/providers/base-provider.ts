/**
 * Base Provider Interface
 * 
 * Abstract interface for LLM providers (local Ollama, Groq, Together.ai, etc.)
 * Allows seamless switching between local and cloud models.
 */

export interface ModelInfo {
  id: string; // Unique model identifier
  name: string; // Display name
  provider: 'ollama' | 'groq' | 'together' | 'ollama-cloud';
  size?: number; // Model size in bytes (if known)
  contextLength: number; // Max context window
  capabilities: ModelCapability[];
  pricing?: {
    inputPerMillion: number; // Cost per 1M input tokens
    outputPerMillion: number; // Cost per 1M output tokens
  };
  speed: 'fast' | 'medium' | 'slow';
  quality: 'good' | 'better' | 'best';
}

export type ModelCapability = 'code' | 'chat' | 'vision' | 'embedding' | 'function-calling';

export interface GenerateRequest {
  model: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  format?: 'text' | 'json';
}

export interface GenerateResponse {
  text: string;
  model: string;
  provider: string;
  tokensInput: number;
  tokensOutput: number;
  tokensTotal: number;
  cost: number; // Cost in USD
  timeMs: number;
  finishReason?: 'stop' | 'length' | 'error';
}

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * Base provider interface that all providers must implement
 */
export abstract class BaseProvider {
  protected config: ProviderConfig;
  protected name: string;

  constructor(name: string, config: ProviderConfig = {}) {
    this.name = name;
    this.config = {
      timeout: 120000, // 2 minutes default
      maxRetries: 2,
      ...config,
    };
  }

  /**
   * Check if provider is available/configured
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Discover available models from this provider
   */
  abstract discoverModels(): Promise<ModelInfo[]>;

  /**
   * Generate text using a model
   */
  abstract generate(request: GenerateRequest): Promise<GenerateResponse>;

  /**
   * Get model info
   */
  abstract getModelInfo(modelId: string): Promise<ModelInfo | null>;

  /**
   * Get provider name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Calculate cost for a generation
   */
  protected calculateCost(model: ModelInfo, tokensInput: number, tokensOutput: number): number {
    if (!model.pricing) {
      return 0; // Free (local models)
    }

    const inputCost = (tokensInput / 1_000_000) * model.pricing.inputPerMillion;
    const outputCost = (tokensOutput / 1_000_000) * model.pricing.outputPerMillion;

    return inputCost + outputCost;
  }

  /**
   * Estimate tokens from text (rough approximation)
   */
  protected estimateTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
}

/**
 * Provider registry for managing multiple providers
 */
export class ProviderRegistry {
  private providers: Map<string, BaseProvider> = new Map();
  private modelCache: Map<string, ModelInfo> = new Map();
  private lastDiscovery: number = 0;
  private discoveryInterval: number = 300000; // 5 minutes

  /**
   * Register a provider
   */
  registerProvider(provider: BaseProvider): void {
    this.providers.set(provider.getName(), provider);
  }

  /**
   * Get a provider by name
   */
  getProvider(name: string): BaseProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get all providers
   */
  getAllProviders(): BaseProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Discover models from all providers
   */
  async discoverAllModels(force: boolean = false): Promise<ModelInfo[]> {
    const now = Date.now();

    // Use cache if recent
    if (!force && this.modelCache.size > 0 && (now - this.lastDiscovery) < this.discoveryInterval) {
      return Array.from(this.modelCache.values());
    }

    this.modelCache.clear();
    const allModels: ModelInfo[] = [];

    for (const provider of this.providers.values()) {
      try {
        const available = await provider.isAvailable();
        if (!available) {
          console.error(`[ProviderRegistry] Provider ${provider.getName()} not available, skipping`);
          continue;
        }

        const models = await provider.discoverModels();
        allModels.push(...models);

        for (const model of models) {
          this.modelCache.set(model.id, model);
        }

        console.error(`[ProviderRegistry] Discovered ${models.length} models from ${provider.getName()}`);
      } catch (error) {
        console.error(`[ProviderRegistry] Failed to discover models from ${provider.getName()}:`, error);
      }
    }

    this.lastDiscovery = now;
    return allModels;
  }

  /**
   * Get model info by ID
   */
  async getModelInfo(modelId: string): Promise<ModelInfo | null> {
    // Check cache first
    if (this.modelCache.has(modelId)) {
      return this.modelCache.get(modelId)!;
    }

    // Try each provider
    for (const provider of this.providers.values()) {
      try {
        const info = await provider.getModelInfo(modelId);
        if (info) {
          this.modelCache.set(modelId, info);
          return info;
        }
      } catch (error) {
        // Continue to next provider
      }
    }

    return null;
  }

  /**
   * Generate using the appropriate provider
   */
  async generate(modelId: string, request: Omit<GenerateRequest, 'model'>): Promise<GenerateResponse> {
    // Find which provider has this model
    const modelInfo = await this.getModelInfo(modelId);
    
    if (!modelInfo) {
      throw new Error(`Model ${modelId} not found in any provider`);
    }

    const provider = this.providers.get(modelInfo.provider);
    
    if (!provider) {
      throw new Error(`Provider ${modelInfo.provider} not registered`);
    }

    return provider.generate({ ...request, model: modelId });
  }

  /**
   * Select best model based on criteria
   */
  async selectBestModel(criteria: {
    task: 'code' | 'chat' | 'analysis';
    complexity: 'simple' | 'medium' | 'complex';
    preferLocal?: boolean; // Prefer local models over cloud
    maxCost?: number; // Max cost per request in USD
    requiredCapabilities?: ModelCapability[];
  }): Promise<string | null> {
    const models = await this.discoverAllModels();

    if (models.length === 0) {
      return null;
    }

    // Filter by required capabilities
    let candidates = models;
    if (criteria.requiredCapabilities && criteria.requiredCapabilities.length > 0) {
      candidates = models.filter(m =>
        criteria.requiredCapabilities!.every(cap => m.capabilities.includes(cap))
      );
    }

    // Filter by max cost
    if (criteria.maxCost !== undefined) {
      candidates = candidates.filter(m => {
        if (!m.pricing) return true; // Free models always pass
        // Estimate cost for typical request (1000 input, 500 output tokens)
        const estimatedCost = (1000 / 1_000_000) * m.pricing.inputPerMillion +
                             (500 / 1_000_000) * m.pricing.outputPerMillion;
        return estimatedCost <= criteria.maxCost!;
      });
    }

    // Prefer local models if requested
    if (criteria.preferLocal) {
      const localModels = candidates.filter(m => m.provider === 'ollama');
      if (localModels.length > 0) {
        candidates = localModels;
      }
    }

    // Sort by quality and speed
    candidates.sort((a, b) => {
      // Prefer local models (0 cost)
      const aCost = a.pricing ? 1 : 0;
      const bCost = b.pricing ? 1 : 0;
      if (aCost !== bCost) return aCost - bCost;

      // Match complexity to quality
      const targetQuality = criteria.complexity === 'simple' ? 'good' :
                           criteria.complexity === 'medium' ? 'better' : 'best';
      const aMatch = a.quality === targetQuality ? 0 : 1;
      const bMatch = b.quality === targetQuality ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;

      // Prefer faster models for simple tasks
      if (criteria.complexity === 'simple') {
        const speedOrder = { fast: 0, medium: 1, slow: 2 };
        return speedOrder[a.speed] - speedOrder[b.speed];
      }

      return 0;
    });

    return candidates[0]?.id || null;
  }
}

// Singleton registry
let registry: ProviderRegistry | null = null;

export function getProviderRegistry(): ProviderRegistry {
  if (!registry) {
    registry = new ProviderRegistry();
  }
  return registry;
}

