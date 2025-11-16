// Main exports for agent-core

export { runFreeAgent, runAgentTask } from "./runner.js";
export type { AgentTask, AgentRunResult, AgentKind, AgentTier, AgentTaskConstraints } from './task.js';
export { runStandardPlanningChain } from './thinking.js';
export type { ThinkingStep, PlanningResult } from './thinking.js';
export { gatherEvidence } from './evidence.js';
export type { EvidenceBundle, EvidenceOptions } from './evidence.js';
export { getRadClient, RadClient } from './rad-client.js';
export type { TaskRecord, DecisionRecord, LessonRecord, KnowledgeQuery, RelatedKnowledge } from './rad-client.js';
export { getCortexClient, AgentCortexClient } from './cortex/index.js';
export type {
  ThinkingPlaybook,
  ThinkingToolStep,
  ToolWorkflow,
  WorkflowStep as CortexWorkflowStep,
  CodePattern,
  PatternVariable,
  Capability,
  KnowledgeArtifact,
  EvidenceCacheEntry,
  CortexContext,
  GetCortexContextOptions,
  RecordOutcomeOptions
} from './cortex/index.js';
export { buildDependencyGraph, findReadySteps, validateWorkflow, estimateWorkflowCost, generateSimpleWorkflow } from './workflow.js';
export type { Workflow, WorkflowStep, WorkflowResult, AgentAssignment } from './workflow.js';
export { executeWorkflow, executeBatchOperation } from './executor.js';
export type { ExecutorOptions, StepResult } from './executor.js';
export { loadAdapter } from "./repo/adapter.js";
export { discover } from "./repo/discover.js";
export { ensureCodegen } from "./spec/codegen.js";
export { generateFromRegistry } from "./spec/generator.js";
export { buildPipeline } from "./pipeline/index.js";
export { validatePatchUnifiedDiff } from "./shared/patchGuard.js";
export { applyUnifiedDiff } from "./shared/diff.js";

// Pattern Contract Engine exports
export { learnPatternContract } from "./patterns/learn.js";
export { pickExamples } from "./patterns/examples.js";
export { enforceContractOnDiff } from "./patterns/enforce.js";
export { runBatch } from "./evals/batch.js";

export type { Adapter, Cmds } from "./repo/types.js";
export type { PatternContract } from "./patterns/contract.js";
export type { Example } from "./patterns/examples.js";
export type { DiffGenerator, GenInput, FileTarget } from "./generation/types.js";
export { loadGenerator, createFallbackGenerator } from "./generation/loader.js";
export { OpsGenerator } from "./generation/ops-generator.js";

// Patch generation exports (for debugging)
export { applyOpsInPlace } from "./patch/applyOps.js";
export { bundleUnified } from "./patch/unified.js";
export type { PatchOps, EditOp } from "./patch/ops.js";
