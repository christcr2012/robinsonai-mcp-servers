/**
 * Shared Utilities Library
 *
 * Common utilities used across Robinson AI MCP Servers.
 * Extracted from FREE agent to enable sharing with PAID agent.
 */

// Project analysis and DNA extraction
export { makeProjectBrief, formatBriefForPrompt, type ProjectBrief } from './project-brief.js';
export { buildPortableBrief } from './portable-brief-builder.js';

// Code analysis and retrieval
export { buildSymbolIndex, type SymbolIndex, type Symbol } from './symbol-indexer.js';
export { retrieveCodeContext, type RetrievalResult } from './code-retrieval.js';

// Code generation utilities
export { generateMultiFileDiff, formatDiffsForPrompt } from './diff-generator.js';
export { installAndCacheDependencies, hasCachedDependencies } from './dependency-cache.js';

// Repository tools
export { detectCapabilities, formatCapabilities, type Capabilities } from './repo-probe.js';
export { runRepoTools } from './repo-tools.js';

// Language and schema utilities
export { detectSchemas } from './schema-codegen.js';

