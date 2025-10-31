/*
  model_adapters.ts – unified adapters for OpenAI, Anthropic, Ollama
  ------------------------------------------------------------------
  Exposes a minimal interface:
    - generateText({ system, input })
    - generateJSON<T>({ system, input })

  Env vars expected (use your own loading strategy):
    OPENAI_API_KEY, ANTHROPIC_API_KEY, OLLAMA_HOST (optional)
*/

export type GenArgs = { system: string; input: any; model?: string; json?: boolean };

export interface ModelAdapter {
  generateText(args: GenArgs): Promise<string>;
  generateJSON<T=any>(args: GenArgs): Promise<T>;
}

// -----------------------------
// OpenAI (Responses API style; adjust if using older SDK)
// -----------------------------
export class OpenAIAdapter implements ModelAdapter {
  private client: any;
  constructor(apiKey = process.env.OPENAI_API_KEY) {
    // Lazy import to avoid bundling
    // @ts-ignore
    const OpenAI = require('openai').default;
    this.client = new OpenAI({ apiKey });
  }
  async generateText({ system, input, model = 'gpt-4o-mini' }: GenArgs): Promise<string> {
    const res = await this.client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify(input) }
      ],
      temperature: 0.2
    });
    return res.choices[0]?.message?.content || '';
  }
  async generateJSON<T=any>({ system, input, model = 'gpt-4o-mini' }: GenArgs): Promise<T> {
    const res = await this.client.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system + '\nReturn ONLY strict JSON.' },
        { role: 'user', content: JSON.stringify(input) }
      ],
      temperature: 0.2
    });
    const text = res.choices[0]?.message?.content || '{}';
    return JSON.parse(text);
  }
}

// -----------------------------
// Anthropic
// -----------------------------
export class AnthropicAdapter implements ModelAdapter {
  private client: any;
  constructor(apiKey = process.env.ANTHROPIC_API_KEY) {
    // @ts-ignore
    const { Anthropic } = require('@anthropic-ai/sdk');
    this.client = new Anthropic({ apiKey });
  }
  async generateText({ system, input, model = 'claude-3-5-sonnet-latest' }: GenArgs): Promise<string> {
    const res = await this.client.messages.create({
      model,
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: JSON.stringify(input) }],
      temperature: 0.2
    });
    const chunk = res.content?.[0];
    // @ts-ignore
    return chunk?.type === 'text' ? chunk.text : JSON.stringify(res.content);
  }
  async generateJSON<T=any>({ system, input, model = 'claude-3-5-sonnet-latest' }: GenArgs): Promise<T> {
    const res = await this.client.messages.create({
      model,
      max_tokens: 4096,
      system: system + '\nReturn ONLY strict JSON.',
      messages: [{ role: 'user', content: JSON.stringify(input) }],
      temperature: 0.2
    });
    const text = (res.content?.[0] as any)?.text || '{}';
    return JSON.parse(text);
  }
}

// -----------------------------
// Ollama (local)
// -----------------------------
export class OllamaAdapter implements ModelAdapter {
  private host: string;
  constructor(host = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434') { this.host = host; }

  async call(model: string, prompt: string, format?: 'json'): Promise<string> {
    const res = await fetch(`${this.host}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model, prompt, options: { temperature: 0.2 }, format })
    });
    // Streamed newline-delimited JSON; collect text fields
    const reader = res.body?.getReader();
    let out = '';
    if (reader) {
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).trim().split(/\n+/);
        for (const line of lines) {
          try { const obj = JSON.parse(line); if (obj.response) out += obj.response; } catch {}
        }
      }
    } else { out = await res.text(); }
    return out;
  }

  async generateText({ system, input, model = 'qwen2.5-coder:7b' }: GenArgs): Promise<string> {
    const prompt = `${system}\n\nUSER:\n${JSON.stringify(input)}\n\nASSISTANT:`;
    return await this.call(model, prompt);
  }
  async generateJSON<T=any>({ system, input, model = 'qwen2.5-coder:7b' }: GenArgs): Promise<T> {
    const prompt = `${system}\nReturn ONLY strict JSON.\n\nINPUT:\n${JSON.stringify(input)}`;
    const text = await this.call(model, prompt, 'json');
    return JSON.parse(text);
  }
}

