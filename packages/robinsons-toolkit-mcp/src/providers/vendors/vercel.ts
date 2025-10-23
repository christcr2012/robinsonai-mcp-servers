import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const id = 'vercel';
let client: any = null;

export function catalog(): Tool[] {
  return [
    { name: 'list_projects', description: 'List Vercel projects', inputSchema: { type: 'object', properties: {} } },
    { name: 'create_deployment', description: 'Create Vercel deployment', inputSchema: { type: 'object', properties: { project: { type: 'string' } }, required: ['project'] } },
    { name: 'list_deployments', description: 'List deployments', inputSchema: { type: 'object', properties: { project: { type: 'string' } } } }
  ];
}

export function missingEnv(): string[] {
  return ['VERCEL_TOKEN'].filter(k => !process.env[k]);
}

export async function ensureClient() {
  if (missingEnv().length === 0 && !client) {
    client = { token: process.env.VERCEL_TOKEN };
  }
}

export function isReady(): boolean {
  return client !== null;
}

export async function call(name: string, args: any) {
  return { content: [{ type: 'text', text: `Vercel.${name} not yet implemented` }] };
}

