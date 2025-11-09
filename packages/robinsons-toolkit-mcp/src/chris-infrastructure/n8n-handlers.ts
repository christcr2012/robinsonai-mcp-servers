/**
 * N8N Handlers for Chris's Infrastructure
 * 
 * Handler functions for all 12 N8N tools
 */

import { fastAPIClient } from './fastapi-client.js';

// ============================================================================
// Workflow Operations
// ============================================================================

export async function handleN8nWorkflowTrigger(args: any) {
  const { workflow_id, data } = args;
  return await fastAPIClient.n8nTriggerWorkflow(workflow_id, data);
}

export async function handleN8nWorkflowList(args: any) {
  const { active } = args;
  
  let url = '/gateway/n8n/api/v1/workflows';
  if (active !== undefined) {
    url += `?active=${active}`;
  }
  
  return await fastAPIClient.request(url, {
    method: 'GET',
  });
}

export async function handleN8nWorkflowGet(args: any) {
  const { workflow_id } = args;
  return await fastAPIClient.n8nGetWorkflow(workflow_id);
}

export async function handleN8nWorkflowCreate(args: any) {
  const { name, nodes, connections, active = false } = args;
  
  return await fastAPIClient.request('/gateway/n8n/api/v1/workflows', {
    method: 'POST',
    body: JSON.stringify({
      name,
      nodes,
      connections,
      active,
    }),
  });
}

export async function handleN8nWorkflowUpdate(args: any) {
  const { workflow_id, name, nodes, connections, active } = args;
  
  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (nodes !== undefined) updateData.nodes = nodes;
  if (connections !== undefined) updateData.connections = connections;
  if (active !== undefined) updateData.active = active;
  
  return await fastAPIClient.request(`/gateway/n8n/api/v1/workflows/${workflow_id}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData),
  });
}

export async function handleN8nWorkflowDelete(args: any) {
  const { workflow_id } = args;
  
  return await fastAPIClient.request(`/gateway/n8n/api/v1/workflows/${workflow_id}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// Execution Operations
// ============================================================================

export async function handleN8nExecutionGetStatus(args: any) {
  const { execution_id } = args;
  return await fastAPIClient.n8nGetExecutionStatus(execution_id);
}

export async function handleN8nExecutionList(args: any) {
  const { workflow_id, status, limit = 10 } = args;
  
  let url = '/gateway/n8n/api/v1/executions?';
  const params = [];
  
  if (workflow_id) params.push(`workflowId=${workflow_id}`);
  if (status) params.push(`status=${status}`);
  params.push(`limit=${limit}`);
  
  url += params.join('&');
  
  return await fastAPIClient.request(url, {
    method: 'GET',
  });
}

export async function handleN8nExecutionDelete(args: any) {
  const { execution_id } = args;
  
  return await fastAPIClient.request(`/gateway/n8n/api/v1/executions/${execution_id}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// Credential Operations
// ============================================================================

export async function handleN8nCredentialList(args: any) {
  const { type } = args;
  
  let url = '/gateway/n8n/api/v1/credentials';
  if (type) {
    url += `?type=${type}`;
  }
  
  return await fastAPIClient.request(url, {
    method: 'GET',
  });
}

export async function handleN8nCredentialCreate(args: any) {
  const { name, type, data } = args;
  
  return await fastAPIClient.request('/gateway/n8n/api/v1/credentials', {
    method: 'POST',
    body: JSON.stringify({
      name,
      type,
      data,
    }),
  });
}

// ============================================================================
// Admin Operations
// ============================================================================

export async function handleN8nConnectionTest(args: any) {
  try {
    const result = await fastAPIClient.n8nListWorkflows();
    return {
      success: true,
      message: 'Connection successful',
      workflows: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

