/**
 * Agent Cortex - The Agent's Brain
 * Exports all Cortex modules and types
 */

// Main client
export { AgentCortexClient, getCortexClient } from './cortex-client.js';

// Repositories
export { PlaybooksRepo } from './playbooks-repo.js';
export { WorkflowsRepo } from './workflows-repo.js';
export { PatternsRepo } from './patterns-repo.js';
export { CapabilitiesRepo } from './capabilities-repo.js';
export { ArtifactsRepo } from './artifacts-repo.js';
export { EvidenceCacheRepo } from './evidence-cache.js';

// Embeddings
export { generateEmbedding, cosineSimilarity } from './embeddings.js';
export type { EmbeddingOptions } from './embeddings.js';

// Types
export type {
  ThinkingPlaybook,
  ThinkingToolStep,
  ToolWorkflow,
  WorkflowStep,
  CodePattern,
  PatternVariable,
  Capability,
  KnowledgeArtifact,
  EvidenceCacheEntry,
  CortexContext,
  GetCortexContextOptions,
  RecordOutcomeOptions,
} from './types.js';

