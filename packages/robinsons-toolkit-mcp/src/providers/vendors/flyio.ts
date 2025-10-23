import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const id = 'flyio';
let client: any = null;

export function catalog(): Tool[] {
  return [
    { name: 'placeholder', description: 'flyio placeholder tool', inputSchema: { type: 'object', properties: {} } }
  ];
}

export function missingEnv(): string[] {
  return ['FLYIO_TOKEN'].filter(k => !process.env[k]);
}

export async function ensureClient() {
  if (missingEnv().length === 0 && !client) {
    client = { token: process.env.FLYIO_TOKEN };
  }
}

export function isReady(): boolean {
  return client !== null;
}

export async function call(name: string, args: any) {
  return { content: [{ type: 'text', text: `flyio.Created providers/vendors{name} not yet implemented` }] };
}
