export { BASE, pingOllama, ollamaGenerate, warmModels } from './ollama-client.js';
export { llmGenerate, llmGenerateJSON, type LLMGenerateOptions, type LLMGenerateResult } from './llm-client.js';
export { ToolkitClient, getSharedToolkitClient, type ToolkitCallParams, type ToolkitCallResult } from './toolkit-client.js';
export { ThinkingClient, getSharedThinkingClient, type ThinkingToolCallParams, type ThinkingToolCallResult } from './thinking-client.js';
export {
  FileEditor,
  getSharedFileEditor,
  type FileEditResult,
  type StrReplaceParams,
  type InsertParams,
  type SaveFileParams,
  type DeleteFileParams
} from './file-editor.js';
export {
  getWorkspaceRoot,
  resolveWorkspacePath,
  workspacePathExists
} from './workspace.js';
export {
  createLlmRouter,
  type LlmRouter,
  type ProviderName,
  type Providers
} from './llm-router.js';

// Provider-agnostic metrics system
export {
  type ProviderMetricsAdapter,
  type CostEstimate,
  type UsageStats,
  type CapacityInfo,
  registerMetricsAdapter,
  getMetricsAdapter,
  getAllMetricsAdapters,
  getAvailableMetricsAdapters,
  aggregateCostEstimates,
} from './metrics/provider-metrics.js';
export { OpenAIMetricsAdapter } from './metrics/openai-adapter.js';
export { OllamaMetricsAdapter } from './metrics/ollama-adapter.js';
