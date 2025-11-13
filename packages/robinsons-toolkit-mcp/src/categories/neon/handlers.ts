/**
 * Neon Database Handler Methods (Minimal Working Version)
 * Based on temp-neon-mcp.ts
 * 
 * This is a minimal version with key handlers to establish the pattern.
 * Full extraction will be done once this pattern is proven to work.
 */

import axios, { AxiosInstance } from 'axios';

// Neon API client setup
function createNeonClient(apiKey: string): AxiosInstance {
  return axios.create({
    baseURL: 'https://console.neon.tech/api/v2',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
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

// PROJECT MANAGEMENT HANDLERS

export async function neonListProjects(args: any) {
  const neonClient = getNeonClient();
  const params = new URLSearchParams();
  if (args.limit) params.append('limit', args.limit.toString());
  if (args.search) params.append('search', args.search);
  if (args.cursor) params.append('cursor', args.cursor);
  if (args.org_id) params.append('org_id', args.org_id);

  const response = await neonClient.get(`/projects?${params.toString()}`);
  return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
}

export async function neonListOrganizations(args: any) {
  const neonClient = getNeonClient();
  const response = await neonClient.get('/users/me/organizations');
  let orgs = response.data.organizations || [];

  if (args.search) {
    const searchLower = args.search.toLowerCase();
    orgs = orgs.filter((org: any) =>
      org.name?.toLowerCase().includes(searchLower) ||
      org.id?.toLowerCase().includes(searchLower)
    );
  }

  return { content: [{ type: 'text', text: JSON.stringify({ organizations: orgs }, null, 2) }] };
}

export async function neonCreateProject(args: any) {
  const neonClient = getNeonClient();
  const body: any = {};
  if (args.name) body.project = { name: args.name };
  if (args.org_id) body.project.org_id = args.org_id;
  if (args.region_id) body.project.region_id = args.region_id;
  if (args.pg_version) body.project.pg_version = args.pg_version;

  const response = await neonClient.post('/projects', body);
  return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
}

export async function neonDescribeProject(args: any) {
  const neonClient = getNeonClient();
  const response = await neonClient.get(`/projects/${args.projectId}`);
  return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
}

export async function neonDeleteProject(args: any) {
  const neonClient = getNeonClient();
  const response = await neonClient.delete(`/projects/${args.projectId}`);
  return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
}

// BRANCH MANAGEMENT HANDLERS

export async function neonListBranches(args: any) {
  const neonClient = getNeonClient();
  const params = new URLSearchParams();
  if (args.search) params.append('search', args.search);

  const response = await neonClient.get(`/projects/${args.projectId}/branches?${params.toString()}`);
  return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
}

export async function neonCreateBranch(args: any) {
  const neonClient = getNeonClient();
  const body: any = {};
  if (args.branchName) body.branch = { name: args.branchName };
  if (args.parent_id) body.branch.parent_id = args.parent_id;

  const response = await neonClient.post(`/projects/${args.projectId}/branches`, body);
  return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
}

export async function neonDeleteBranch(args: any) {
  const neonClient = getNeonClient();
  const response = await neonClient.delete(`/projects/${args.projectId}/branches/${args.branchId}`);
  return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
}

// AUTH HANDLER

export async function neonCheckApiKey(args: any) {
  try {
    const apiKey = process.env.NEON_API_KEY || '';
    if (!apiKey) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ configured: false, message: 'NEON_API_KEY environment variable is not set' }, null, 2)
        }]
      };
    }

    const neonClient = getNeonClient();
    const response = await neonClient.get('/users/me');
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ configured: true, valid: true, user: response.data }, null, 2)
      }]
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ configured: true, valid: false, error: error.message }, null, 2)
      }]
    };
  }
}

