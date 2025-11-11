/**
 * Dynamic Model Manager
 * 
 * Discovers and manages ALL available Ollama models at runtime.
 * Handles timeouts, cold starts, and smart model selection.
 */

import { Ollama } from 'ollama';

export interface ModelInfo {
  name: string;
  size: number; // bytes
  sizeGB: number;
  family: string; // e.g., 'llama', 'qwen', 'deepseek'
  parameter_size: string; // e.g., '3b', '7b', '33b'
  capabilities: ModelCapability[];
  speed: 'fast' | 'medium' | 'slow';
  quality: 'good' | 'better' | 'best';
  modified_at: string;
}

export type ModelCapability = 'code' | 'chat' | 'vision' | 'embedding';

export interface ModelSelectionCriteria {
  task: 'code' | 'analysis' | 'refactor' | 'test' | 'docs' | 'chat';
  complexity: 'simple' | 'medium' | 'complex';
  preferSpeed?: boolean; // Prefer fast models over quality
  requiredCapabilities?: ModelCapability[];
}

export class ModelManager {
  private ollama: Ollama;
  private models: Map<string, ModelInfo> = new Map();
  private lastDiscovery: number = 0;
  private discoveryInterval: number = 60000; // Re-discover every 60 seconds
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
    this.ollama = new Ollama({ host: baseUrl });
  }

  /**
   * Discover all available models from Ollama
   */
  async discoverModels(force: boolean = false): Promise<ModelInfo[]> {
    const now = Date.now();
    
    // Use cached models if recent (unless forced)
    if (!force && this.models.size > 0 && (now - this.lastDiscovery) < this.discoveryInterval) {
      return Array.from(this.models.values());
    }

    try {
      const response = await this.ollama.list();
      this.models.clear();

      for (const model of response.models) {
        const info = this.parseModelInfo(model);
        this.models.set(info.name, info);
      }

      this.lastDiscovery = now;
      console.error(`[ModelManager] Discovered ${this.models.size} models`);
      
      return Array.from(this.models.values());
    } catch (error) {
      console.error('[ModelManager] Failed to discover models:', error);
      return [];
    }
  }

  /**
   * Parse model information from Ollama response
   */
  private parseModelInfo(model: any): ModelInfo {
    const name = model.name;
    const size = model.size || 0;
    const sizeGB = size / (1024 * 1024 * 1024);

    // Extract family and parameter size from name
    // Examples: "qwen2.5:3b", "deepseek-coder:33b", "llama3.2:3b"
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
    const capabilities: ModelCapability[] = ['chat']; // All models can chat

    // Code capability: explicit markers OR known code-capable models
    const isCodeCapable = baseName.includes('coder') ||
                         baseName.includes('code') ||
                         family === 'codellama' ||
                         family === 'mistral' ||  // Mistral is excellent for code
                         family === 'deepseek' ||  // DeepSeek is code-focused
                         family === 'qwen';        // Qwen models support code

    if (isCodeCapable) {
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

    return {
      name,
      size,
      sizeGB,
      family,
      parameter_size: paramSize,
      capabilities,
      speed,
      quality,
      modified_at: model.modified_at || new Date().toISOString(),
    };
  }

  /**
   * Select the best model for a task
   */
  async selectModel(criteria: ModelSelectionCriteria): Promise<string | null> {
    // Ensure we have fresh model list
    const models = await this.discoverModels();

    if (models.length === 0) {
      console.error('[ModelManager] No models available');
      return null;
    }

    // Filter by required capabilities
    let candidates = models;
    if (criteria.requiredCapabilities && criteria.requiredCapabilities.length > 0) {
      candidates = models.filter(m => 
        criteria.requiredCapabilities!.every(cap => m.capabilities.includes(cap))
      );
    }

    // If task is code-related, prefer code models
    if (criteria.task === 'code' || criteria.task === 'refactor' || criteria.task === 'test') {
      const codeModels = candidates.filter(m => m.capabilities.includes('code'));
      if (codeModels.length > 0) {
        candidates = codeModels;
      }
    }

    // Sort by criteria
    candidates.sort((a, b) => {
      // If preferSpeed, prioritize speed over quality
      if (criteria.preferSpeed) {
        if (a.speed !== b.speed) {
          const speedOrder = { fast: 0, medium: 1, slow: 2 };
          return speedOrder[a.speed] - speedOrder[b.speed];
        }
      }

      // Match complexity to quality
      const targetQuality = this.getTargetQuality(criteria.complexity);
      const aMatch = a.quality === targetQuality ? 0 : 1;
      const bMatch = b.quality === targetQuality ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;

      // Prefer larger models for complex tasks
      if (criteria.complexity === 'complex') {
        return b.size - a.size;
      }

      // Prefer smaller models for simple tasks
      if (criteria.complexity === 'simple') {
        return a.size - b.size;
      }

      // Default: prefer medium-sized models
      return Math.abs(a.sizeGB - 5) - Math.abs(b.sizeGB - 5);
    });

    return candidates[0]?.name || models[0]?.name || null;
  }

  /**
   * Get fallback chain for a model
   */
  async getFallbackChain(primaryModel: string, criteria: ModelSelectionCriteria): Promise<string[]> {
    const models = await this.discoverModels();
    const chain: string[] = [primaryModel];

    // Filter models with same capabilities
    let candidates = models.filter(m => 
      m.name !== primaryModel &&
      (!criteria.requiredCapabilities || 
       criteria.requiredCapabilities.every(cap => m.capabilities.includes(cap)))
    );

    // Sort by size (smaller = faster fallback)
    candidates.sort((a, b) => a.size - b.size);

    // Add up to 2 fallbacks
    chain.push(...candidates.slice(0, 2).map(m => m.name));

    return chain;
  }

  /**
   * Get adaptive timeout for a model
   */
  async getAdaptiveTimeout(modelName: string, isColdStart: boolean = false): Promise<number> {
    const model = this.models.get(modelName);
    
    if (!model) {
      // Unknown model, use conservative timeout
      return isColdStart ? 180000 : 60000; // 3 min cold, 1 min warm
    }

    // Base timeout on model size
    let baseTimeout: number;
    if (model.sizeGB < 2) {
      baseTimeout = 30000; // 30s for small models
    } else if (model.sizeGB < 5) {
      baseTimeout = 60000; // 1min for medium models
    } else if (model.sizeGB < 10) {
      baseTimeout = 120000; // 2min for large models
    } else {
      baseTimeout = 180000; // 3min for huge models
    }

    // Double timeout for cold starts
    if (isColdStart) {
      baseTimeout *= 2;
    }

    return baseTimeout;
  }

  /**
   * Get model info
   */
  getModelInfo(modelName: string): ModelInfo | undefined {
    return this.models.get(modelName);
  }

  /**
   * List all models
   */
  listModels(): ModelInfo[] {
    return Array.from(this.models.values());
  }

  /**
   * List available model names (for quick lookup)
   */
  async listAvailableModels(): Promise<string[]> {
    await this.discoverModels();
    return Array.from(this.models.keys());
  }

  /**
   * Get models by capability
   */
  getModelsByCapability(capability: ModelCapability): ModelInfo[] {
    return Array.from(this.models.values()).filter(m =>
      m.capabilities.includes(capability)
    );
  }

  /**
   * Get target quality for complexity
   */
  private getTargetQuality(complexity: string): 'good' | 'better' | 'best' {
    switch (complexity) {
      case 'simple': return 'good';
      case 'medium': return 'better';
      case 'complex': return 'best';
      default: return 'good';
    }
  }

  /**
   * Check if Ollama is running
   */
  async isOllamaRunning(): Promise<boolean> {
    try {
      await this.ollama.list();
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
let modelManager: ModelManager | null = null;

export function getModelManager(baseUrl?: string): ModelManager {
  if (!modelManager) {
    modelManager = new ModelManager(baseUrl);
  }
  return modelManager;
}

