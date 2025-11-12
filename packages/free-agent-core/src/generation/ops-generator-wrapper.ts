/**
 * Wrapper for OpsGenerator that can be loaded as a generator module
 * This allows the CLI to use the ops-based generator without needing the MCP server
 */
import { OpsGenerator } from "./ops-generator.js";
import { DiffGenerator } from "./types.js";

// Create a simple LLM client adapter for Ollama
class SimpleLLMClient {
  async generate(prompt: string, options?: any): Promise<string> {
    // Use Ollama via HTTP
    const baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
    const model = process.env.OLLAMA_MODEL || "mistral:7b";
    
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: options || {},
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json() as { response: string };
    return data.response;
  }
}

// Create and export the generator instance
const llmClient = new SimpleLLMClient();
const generator = new OpsGenerator(llmClient as any);

export default generator;
export { generator };

