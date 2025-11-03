import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

type Json = any;

export class MCPClient {
  private client!: Client;
  private transport!: StdioClientTransport;
  private inited = false;

  constructor(
    private label: string,
    private command: string,
    private args: string[] = [],
    private env: Record<string,string|undefined> = {}
  ) {}

  async start(): Promise<void> {
    if (this.inited) return;

    // Filter out undefined values from env
    const cleanEnv: Record<string, string> = {};
    for (const [k, v] of Object.entries({ ...process.env, ...this.env })) {
      if (v !== undefined) cleanEnv[k] = v;
    }

    // Debug: Check if OPENAI_API_KEY is being passed
    if (this.label === "paid-agent") {
      console.error(`[${this.label}] OPENAI_API_KEY in env:`, !!cleanEnv.OPENAI_API_KEY);
      console.error(`[${this.label}] ANTHROPIC_API_KEY in env:`, !!cleanEnv.ANTHROPIC_API_KEY);
    }

    this.transport = new StdioClientTransport({
      command: this.command,
      args: this.args,
      env: cleanEnv
    });

    this.client = new Client({
      name: "agent-orchestrator",
      version: "0.1.0"
    }, {
      capabilities: {}
    });

    await this.client.connect(this.transport);
    this.inited = true;
    console.error(`[${this.label}] Connected successfully`);
  }

  async listTools(): Promise<{name:string, description?:string}[]> {
    const res = await this.client.listTools();
    return res.tools ?? [];
  }

  async callTool(name: string, args: Json, timeoutMs = 120000): Promise<any> {
    const resP = this.client.callTool({ name, arguments: args });
    const to = new Promise((_r, rej)=> setTimeout(()=>rej(new Error(`tool ${name} timeout`)), timeoutMs));
    const result: any = await Promise.race([resP, to]);

    // Extract content from MCP response
    if (result?.content && Array.isArray(result.content)) {
      const textContent = result.content.find((c: any) => c.type === "text");
      if (textContent?.text) {
        try {
          return JSON.parse(textContent.text);
        } catch {
          return textContent.text;
        }
      }
    }
    return result;
  }

  async findTool(regex: RegExp): Promise<string | null> {
    const tools = await this.listTools();
    const t = tools.find(t => regex.test(t.name));
    return t?.name ?? null;
  }

  async stop() {
    try {
      await this.client.close();
    } catch {}
  }
}

