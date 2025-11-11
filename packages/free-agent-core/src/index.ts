// Main exports for free-agent-core

export { runFreeAgent } from "./runner.js";
export { loadAdapter } from "./repo/adapter.js";
export { discover } from "./repo/discover.js";
export { ensureCodegen } from "./spec/codegen.js";
export { generateFromRegistry } from "./spec/generator.js";
export { buildPipeline } from "./pipeline/index.js";
export { validatePatchUnifiedDiff } from "./shared/patchGuard.js";
export { applyUnifiedDiff } from "./shared/diff.js";

export type { Adapter, Cmds } from "./repo/types.js";

