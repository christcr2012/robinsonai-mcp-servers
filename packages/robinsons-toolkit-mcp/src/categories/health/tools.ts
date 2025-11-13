/**
 * Health & User Tools for Chris's Infrastructure
 * 
 * 2 tools for health checks and user information
 */

export const healthTools = [
  // ============================================================================
  // Health Check
  // ============================================================================
  {
    name: 'fastapi_health_check',
    description: 'Check health status of the FastAPI gateway and all connected services',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ============================================================================
  // User Info
  // ============================================================================
  {
    name: 'fastapi_user_info',
    description: 'Get current user information and database status',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

