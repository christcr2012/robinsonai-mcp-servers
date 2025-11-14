/**
 * Ops-based MCP Generator - Pluggable generator for Free Agent Core
 *
 * Uses OpsGenerator from free-agent-core to eliminate corrupt patch errors
 * LLM outputs structured EditOps → we build valid diffs deterministically
 */

import {
  DiffGenerator,
  GenInput,
} from "../core/generation/types.js";
import { OpsGenerator } from "../core/generation/ops-generator.js";
import { OllamaClient } from "../ollama-client.js";
import { llmGenerate } from "../shared/shared-llm/index.js";

/**
 * LLM client adapter for OpsGenerator
 */
class LLMClientAdapter {
  private ollama: OllamaClient;

  constructor() {
    this.ollama = new OllamaClient();
  }

  async generate(opts: { model: string; prompt: string; format: string; timeoutMs: number }): Promise<{ text: string }> {
    const provider = opts.model.startsWith("gpt-") || opts.model.startsWith("o1-") ? "openai" : "ollama";
    
    const result = await llmGenerate({
      provider: provider as any,
      model: opts.model,
      prompt: opts.prompt,
      format: opts.format as any,
      timeoutMs: opts.timeoutMs,
    });

    return { text: result.text };
  }
}

export class OpsMCPGenerator implements DiffGenerator {
  name = "ops-mcp-generator";
  private opsGen: OpsGenerator;

  constructor() {
    const llmClient = new LLMClientAdapter();
    this.opsGen = new OpsGenerator(llmClient);
  }

  async generate(input: GenInput): Promise<string> {
    console.log(`[OpsMCPGenerator] Using ops-based generation (no corrupt patches!)`);
    
    // Delegate to OpsGenerator
    return await this.opsGen.generate(input);
  }
}

// Export as default for loader
const generator = new OpsMCPGenerator();
export default generator;
export { generator };

