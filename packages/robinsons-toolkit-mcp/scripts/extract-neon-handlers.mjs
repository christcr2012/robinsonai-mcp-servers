#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('temp-neon-mcp.ts', 'utf-8');

// Find all private async methods (handlers)
const methodRegex = /private\s+async\s+(\w+)\s*\([^)]*\)\s*\{([\s\S]*?)^\s*\}/gm;

const handlers = [];
let match;

while ((match = methodRegex.exec(content)) !== null) {
  const methodName = match[1];
  const methodBody = match[2];
  
  handlers.push({
    methodName,
    body: methodBody.trim()
  });
}

console.log(`✅ Found ${handlers.length} handler methods`);

// Generate handlers.ts content
const handlerFunctions = handlers.map(h => {
  // Convert camelCase to neon_snake_case for function name
  const funcName = 'neon' + h.methodName.charAt(0).toUpperCase() + h.methodName.slice(1);

  // Replace this.client with neonClient
  const adaptedBody = h.body
    .replace(/this\.client\./g, 'neonClient.')
    .replace(/this\.client/g, 'neonClient');

  return `export async function ${funcName}(args: any) {
  const neonClient = getNeonClient();
${adaptedBody}
}`;
}).join('\n\n');

const handlersTs = `/**
 * Neon Database Handler Methods
 * Extracted from temp-neon-mcp.ts
 * Total: ${handlers.length} handlers
 */

import axios, { AxiosInstance } from 'axios';

// Neon API client setup
function createNeonClient(apiKey: string): AxiosInstance {
  return axios.create({
    baseURL: 'https://console.neon.tech/api/v2',
    headers: {
      'Authorization': \`Bearer \${apiKey}\`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
}

// Get API key from environment
function getNeonApiKey(): string {
  const apiKey = process.env.NEON_API_KEY || '';
  if (!apiKey) {
    throw new Error('NEON_API_KEY environment variable is not set');
  }
  return apiKey;
}

// Create client instance (singleton)
let clientInstance: AxiosInstance | null = null;

function getNeonClient(): AxiosInstance {
  if (!clientInstance) {
    clientInstance = createNeonClient(getNeonApiKey());
  }
  return clientInstance;
}

${handlerFunctions}
`;

writeFileSync('src/categories/neon/handlers.ts', handlersTs);
console.log(`✅ Wrote src/categories/neon/handlers.ts (${handlers.length} handlers)`);

