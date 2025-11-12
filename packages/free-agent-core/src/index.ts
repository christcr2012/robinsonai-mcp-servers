// Main exports for free-agent-core

export { runFreeAgent } from "./runner.js";
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

