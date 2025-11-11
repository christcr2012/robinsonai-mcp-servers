/**
 * Gateway Tools for Chris's Infrastructure
 * 
 * 3 tools for unified API gateway access to N8N, Crawl4AI, SearXNG, and other services
 */

export const gatewayTools = [
  // ============================================================================
  // Service Discovery
  // ============================================================================
  {
    name: 'fastapi_gateway_services',
    description: 'List all available services through the unified API gateway',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ============================================================================
  // Service Health
  // ============================================================================
  {
    name: 'fastapi_gateway_service_health',
    description: 'Check health status of a specific service through the gateway',
    inputSchema: {
      type: 'object',
      properties: {
        service: {
          type: 'string',
          description: 'Service name (e.g., n8n, crawl4ai, searxng)',
        },
      },
      required: ['service'],
    },
  },

  // ============================================================================
  // Unified Proxy
  // ============================================================================
  {
    name: 'fastapi_gateway_proxy',
    description: 'Proxy requests to any service through the unified gateway (N8N, Crawl4AI, SearXNG, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        service: {
          type: 'string',
          description: 'Service name (n8n, crawl4ai, searxng, etc.)',
        },
        path: {
          type: 'string',
          description: 'API path (e.g., /api/v1/workflows, /crawl)',
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
          default: 'GET',
          description: 'HTTP method',
        },
        query_params: {
          type: 'object',
          description: 'Query parameters (optional)',
        },
        body: {
          type: 'object',
          description: 'Request body for POST/PUT/PATCH (optional)',
        },
      },
      required: ['service', 'path'],
    },
  },
];

