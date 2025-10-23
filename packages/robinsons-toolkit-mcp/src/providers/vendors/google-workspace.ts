import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const id = 'google-workspace';
let client: any = null;

export function catalog(): Tool[] {
  return [
    { name: 'placeholder', description: 'google-workspace placeholder tool', inputSchema: { type: 'object', properties: {} } }
  ];
}

export function missingEnv(): string[] {
  return ['GOOGLE_WORKSPACE_TOKEN'].filter(k => !process.env[k]);
}

export async function ensureClient() {
  if (missingEnv().length === 0 && !client) {
    client = { token: process.env.GOOGLE_WORKSPACE_TOKEN };
  }
}

export function isReady(): boolean {
  return client !== null;
}

export async function call(name: string, args: any) {
  return { content: [{ type: 'text', text: `google-workspace.Created providers/vendors{name} not yet implemented` }] };
}
