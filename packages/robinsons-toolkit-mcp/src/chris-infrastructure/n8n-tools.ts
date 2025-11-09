/**
 * N8N Tools for Chris's Infrastructure
 * 
 * 12 tools for N8N workflow automation via FastAPI Gateway
 */

export const n8nTools = [
  // ============================================================================
  // Workflow Operations
  // ============================================================================
  {
    name: 'n8n_workflow_trigger',
    description: 'Trigger an N8N workflow via webhook',
    inputSchema: {
      type: 'object',
      properties: {
        workflow_id: {
          type: 'string',
          description: 'Workflow ID or webhook path',
        },
        data: {
          type: 'object',
          description: 'Data to send to the workflow',
        },
      },
      required: ['workflow_id'],
    },
  },

  {
    name: 'n8n_workflow_list',
    description: 'List all N8N workflows',
    inputSchema: {
      type: 'object',
      properties: {
        active: {
          type: 'boolean',
          description: 'Filter by active status (optional)',
        },
      },
    },
  },

  {
    name: 'n8n_workflow_get',
    description: 'Get details of a specific N8N workflow',
    inputSchema: {
      type: 'object',
      properties: {
        workflow_id: {
          type: 'string',
          description: 'Workflow ID',
        },
      },
      required: ['workflow_id'],
    },
  },

  {
    name: 'n8n_workflow_create',
    description: 'Create a new N8N workflow',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Workflow name',
        },
        nodes: {
          type: 'array',
          description: 'Workflow nodes configuration',
        },
        connections: {
          type: 'object',
          description: 'Node connections',
        },
        active: {
          type: 'boolean',
          default: false,
          description: 'Activate workflow immediately',
        },
      },
      required: ['name', 'nodes'],
    },
  },

  {
    name: 'n8n_workflow_update',
    description: 'Update an existing N8N workflow',
    inputSchema: {
      type: 'object',
      properties: {
        workflow_id: {
          type: 'string',
          description: 'Workflow ID',
        },
        name: {
          type: 'string',
          description: 'New workflow name (optional)',
        },
        nodes: {
          type: 'array',
          description: 'Updated nodes configuration (optional)',
        },
        connections: {
          type: 'object',
          description: 'Updated connections (optional)',
        },
        active: {
          type: 'boolean',
          description: 'Activate/deactivate workflow (optional)',
        },
      },
      required: ['workflow_id'],
    },
  },

  {
    name: 'n8n_workflow_delete',
    description: 'Delete an N8N workflow',
    inputSchema: {
      type: 'object',
      properties: {
        workflow_id: {
          type: 'string',
          description: 'Workflow ID to delete',
        },
      },
      required: ['workflow_id'],
    },
  },

  // ============================================================================
  // Execution Operations
  // ============================================================================
  {
    name: 'n8n_execution_get_status',
    description: 'Get status of a workflow execution',
    inputSchema: {
      type: 'object',
      properties: {
        execution_id: {
          type: 'string',
          description: 'Execution ID',
        },
      },
      required: ['execution_id'],
    },
  },

  {
    name: 'n8n_execution_list',
    description: 'List workflow executions',
    inputSchema: {
      type: 'object',
      properties: {
        workflow_id: {
          type: 'string',
          description: 'Filter by workflow ID (optional)',
        },
        status: {
          type: 'string',
          enum: ['success', 'error', 'running', 'waiting'],
          description: 'Filter by execution status (optional)',
        },
        limit: {
          type: 'number',
          default: 10,
          description: 'Number of executions to return',
        },
      },
    },
  },

  {
    name: 'n8n_execution_delete',
    description: 'Delete a workflow execution',
    inputSchema: {
      type: 'object',
      properties: {
        execution_id: {
          type: 'string',
          description: 'Execution ID to delete',
        },
      },
      required: ['execution_id'],
    },
  },

  // ============================================================================
  // Credential Operations
  // ============================================================================
  {
    name: 'n8n_credential_list',
    description: 'List all N8N credentials',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Filter by credential type (optional)',
        },
      },
    },
  },

  {
    name: 'n8n_credential_create',
    description: 'Create a new N8N credential',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Credential name',
        },
        type: {
          type: 'string',
          description: 'Credential type (e.g., "httpBasicAuth", "oAuth2Api")',
        },
        data: {
          type: 'object',
          description: 'Credential data',
        },
      },
      required: ['name', 'type', 'data'],
    },
  },

  // ============================================================================
  // Admin Operations
  // ============================================================================
  {
    name: 'n8n_connection_test',
    description: 'Test connection to N8N',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

