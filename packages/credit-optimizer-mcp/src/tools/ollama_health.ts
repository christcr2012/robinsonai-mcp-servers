export const ollamaHealthDescriptor = {
  name: "credit_ollama_health",
  description: "Check Ollama availability and loaded models.",
  inputSchema: { type: "object", properties: {} },
};

export async function ollamaHealthTool() {
  const url = process.env.OLLAMA_URL || "http://localhost:11434";
  try {
    const r = await fetch(`${url}/api/tags`);
    if (!r.ok) throw new Error(String(r.status));
    const j: any = await r.json();
    const models = (j.models || []).map((m: any) => ({
      name: m.name,
      size: m.size,
      digest: m.digest,
    }));
    return {
      content: [
        { type: "text", text: JSON.stringify({ ok: true, url, models }, null, 2) },
      ],
    };
  } catch (e: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ ok: false, url, error: e.message }, null, 2),
        },
      ],
    };
  }
}

