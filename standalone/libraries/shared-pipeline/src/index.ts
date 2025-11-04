/**
 * Shared Pipeline Library - Phase 2 (Interface Only)
 *
 * Provider-agnostic code generation pipeline with quality gates.
 * Works with Ollama (FREE), OpenAI, Claude, and other LLM providers.
 *
 * NOTE: This is Phase 2 - we're exporting types and interfaces only.
 * The actual implementation will be moved from FREE agent in Phase 3.
 *
 * For now, both FREE and PAID agents will:
 * 1. Import types from this library
 * 2. Use their own implementations (FREE agent has full implementation)
 * 3. PAID agent will import from FREE agent temporarily (will be fixed in Phase 3)
 */

// Re-export types only for now
export * from './types.js';

