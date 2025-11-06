export const optimizerHealthDescriptor = {
  name: "credit_optimizer_health",
  description: "List enabled providers and environment readiness.",
  inputSchema: { type: "object" },
};

export async function optimizerHealthTool() {
  const env = {
    OLLAMA_URL: process.env.OLLAMA_URL || "http://localhost:11434",
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    GOOGLE_API_KEY: !!process.env.GOOGLE_API_KEY,
  };
  return {
    content: [{ type: "text", text: JSON.stringify({ ok: true, env }, null, 2) }],
  };
}

