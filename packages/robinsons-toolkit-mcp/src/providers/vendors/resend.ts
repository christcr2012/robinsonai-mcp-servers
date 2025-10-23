import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const id = 'resend';
let client: any = null;

export function catalog(): Tool[] {
  return [
    { name: 'placeholder', description: 'resend placeholder tool', inputSchema: { type: 'object', properties: {} } }
  ];
}

export function missingEnv(): string[] {
  return ['RESEND_TOKEN'].filter(k => !process.env[k]);
}

export async function ensureClient() {
  if (missingEnv().length === 0 && !client) {
    client = { token: process.env.RESEND_TOKEN };
  }
}

export function isReady(): boolean {
  return client !== null;
}

export async function call(name: string, args: any) {
  return { content: [{ type: 'text', text: `resend.Created providers/vendors{name} not yet implemented` }] };
}
