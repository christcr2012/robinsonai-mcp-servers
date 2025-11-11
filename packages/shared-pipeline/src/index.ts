/**
 * Shared Pipeline Library - Phase 3 (Full Implementation)
 *
 * Provider-agnostic code generation pipeline with quality gates.
 * Works with Ollama (FREE), OpenAI, Claude, and other LLM providers.
 *
 * This library provides:
 * - Code synthesis (generation)
 * - Quality evaluation (judge)
 * - Fix generation (refine)
 * - Sandbox execution (Docker and local)
 * - Full pipeline orchestration
 */

// Export types
export * from './types.js';

// Export pipeline implementation
export * from './synthesize.js';
export * from './judge.js';
export * from './refine.js';
export * from './sandbox.js';
export * from './docker-sandbox.js';
export * from './pipeline.js';

