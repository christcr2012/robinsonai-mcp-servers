/**
 * One-shot code generation runner
 * Allows running Free Agent from CLI without MCP server
 */

import minimist from "minimist";
import { resolveRepoRoot } from "@fa/core/utils/paths.js";
import { loadGenerator } from "@fa/core/generation/loader.js";
import type { GenRequest } from "./generation/types.js";

export async function runOneShot(argvRaw: string[]) {
  const argv = minimist(argvRaw);
  
  // Resolve repo path
  const repoArg = argv.repo || argv.r;
  if (!repoArg) {
    throw new Error("Missing required --repo argument");
  }
  const repo = resolveRepoRoot(repoArg);
  
  // Get task description
  const task = argv.task || argv.t || argv._.join(" ");
  if (!task) {
    throw new Error("Missing required --task argument");
  }
  
  // Get options
  const quality = argv.quality || argv.q || process.env.FREE_AGENT_QUALITY || "auto";
  const kind = argv.kind || argv.k || "feature";
  const tier = argv.tier || process.env.FREE_AGENT_TIER || "free";
  const verbose = argv.verbose || argv.v || process.env.CODEGEN_VERBOSE === "1";
  
  // Get generator module
  const generatorModule = argv.generator || argv.g || 
                         process.env.FREE_AGENT_GENERATOR || 
                         "free-agent-mcp/generators/ops";
  
  if (verbose) {
    console.error(`[one-shot] repo=${repo}`);
    console.error(`[one-shot] task=${task}`);
    console.error(`[one-shot] quality=${quality}`);
    console.error(`[one-shot] kind=${kind}`);
    console.error(`[one-shot] tier=${tier}`);
    console.error(`[one-shot] generator=${generatorModule}`);
  }
  
  try {
    // Load generator
    const create = await loadGenerator(generatorModule);
    const gen = create({ logger: verbose ? console : undefined });
    
    // Generate code
    const request: GenRequest = {
      repo,
      task,
      quality: quality as any,
      kind: kind as any,
      tier: tier as any
    };
    
    const { diff, meta } = await gen.generate(request);
    
    // Output diff to stdout
    process.stdout.write(diff);
    
    // Output metadata to stderr if verbose
    if (verbose && meta) {
      console.error(`[one-shot] meta:`, JSON.stringify(meta, null, 2));
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error(`[one-shot] Error: ${error.message}`);
    if (verbose && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

