/**
 * Provider System
 * 
 * Unified interface for local and cloud LLM providers.
 * Supports: Local Ollama, Groq, Together.ai
 */

export * from './base-provider.js';
export * from './ollama-provider.js';
export * from './groq-provider.js';
export * from './together-provider.js';

import { getProviderRegistry, ProviderRegistry } from './base-provider.js';
import { OllamaProvider } from './ollama-provider.js';
import { GroqProvider } from './groq-provider.js';
import { TogetherProvider } from './together-provider.js';

/**
 * Initialize all providers
 */
export function initializeProviders(): ProviderRegistry {
  const registry = getProviderRegistry();

  // Register local Ollama provider (always available)
  registry.registerProvider(new OllamaProvider());

  // Register cloud providers if API keys are configured
  if (process.env.GROQ_API_KEY) {
    registry.registerProvider(new GroqProvider());
  }

  if (process.env.TOGETHER_API_KEY) {
    registry.registerProvider(new TogetherProvider());
  }

  return registry;
}

/**
 * Get initialized provider registry
 */
export function getProviders(): ProviderRegistry {
  return initializeProviders();
}

