import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

let mcpClient: Client | null = null;
let availableTools: any[] = [];

// Initialize MCP client connection to Robinson's Toolkit
async function initializeMCP() {
  console.log('Initializing MCP connection to Robinson\'s Toolkit...');
  
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@robinson_ai_systems/robinsons-toolkit-mcp@1.15.0'],
    env: {
      ...process.env,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
      VERCEL_TOKEN: process.env.VERCEL_TOKEN || '',
      NEON_API_KEY: process.env.NEON_API_KEY || '',
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || '',
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    },
  });

  mcpClient = new Client({
    name: 'robinsons-toolkit-api-wrapper',
    version: '1.0.0',
  }, {
    capabilities: {},
  });

  await mcpClient.connect(transport);
  console.log('MCP client connected!');

  // Get available tools
  const toolsResponse = await mcpClient.listTools();
  availableTools = toolsResponse.tools;
  console.log(`Loaded ${availableTools.length} tools from Robinson's Toolkit`);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mcpConnected: mcpClient !== null,
    toolsLoaded: availableTools.length,
  });
});

// List all available tools
app.get('/api/tools', (req, res) => {
  res.json({
    tools: availableTools.map(tool => ({
      name: tool.name,
      description: tool.description,
    })),
    total: availableTools.length,
  });
});

// List tools by category
app.get('/api/tools/category/:category', (req, res) => {
  const { category } = req.params;
  const categoryTools = availableTools.filter(tool => 
    tool.name.startsWith(`${category}_`)
  );
  
  res.json({
    category,
    tools: categoryTools.map(tool => ({
      name: tool.name,
      description: tool.description,
    })),
    total: categoryTools.length,
  });
});

// Execute a tool
app.post('/api/tools/execute', async (req, res) => {
  try {
    const { toolName, arguments: args } = req.body;

    if (!toolName) {
      return res.status(400).json({ error: 'toolName is required' });
    }

    if (!mcpClient) {
      return res.status(503).json({ error: 'MCP client not initialized' });
    }

    // Find the tool
    const tool = availableTools.find(t => t.name === toolName);
    if (!tool) {
      return res.status(404).json({ 
        error: `Tool '${toolName}' not found`,
        availableTools: availableTools.map(t => t.name).slice(0, 10),
      });
    }

    // Execute the tool
    const result = await mcpClient.callTool({
      name: toolName,
      arguments: args || {},
    });

    res.json({
      success: true,
      tool: toolName,
      result: result.content,
    });
  } catch (error: any) {
    console.error('Tool execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Broker-style tool execution (for Robinson's Toolkit)
app.post('/api/toolkit/call', async (req, res) => {
  try {
    const { category, tool_name, arguments: args } = req.body;

    if (!category || !tool_name) {
      return res.status(400).json({ 
        error: 'category and tool_name are required' 
      });
    }

    if (!mcpClient) {
      return res.status(503).json({ error: 'MCP client not initialized' });
    }

    // Call toolkit_call broker tool
    const result = await mcpClient.callTool({
      name: 'toolkit_call',
      arguments: {
        category,
        tool_name,
        arguments: args || {},
      },
    });

    res.json({
      success: true,
      category,
      tool: tool_name,
      result: result.content,
    });
  } catch (error: any) {
    console.error('Toolkit call error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// OpenAPI schema endpoint for Custom GPT
app.get('/openapi.json', (req, res) => {
  const schema = {
    openapi: '3.0.0',
    info: {
      title: 'Robinson\'s Toolkit API',
      description: 'REST API wrapper for Robinson\'s Toolkit MCP - 1237+ tools across 16+ integrations',
      version: '1.0.0',
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000',
      },
    ],
    paths: {
      '/api/tools': {
        get: {
          summary: 'List all available tools',
          operationId: 'listTools',
          responses: {
            '200': {
              description: 'List of tools',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      tools: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                            description: { type: 'string' },
                          },
                        },
                      },
                      total: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/toolkit/call': {
        post: {
          summary: 'Execute a tool from Robinson\'s Toolkit',
          operationId: 'executeToolkitTool',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['category', 'tool_name'],
                  properties: {
                    category: {
                      type: 'string',
                      description: 'Tool category (github, vercel, postgres, neo4j, etc.)',
                      enum: ['github', 'vercel', 'neon', 'upstash', 'google', 'openai', 'stripe', 'supabase', 'playwright', 'twilio', 'resend', 'cloudflare', 'postgres', 'neo4j', 'qdrant', 'n8n'],
                    },
                    tool_name: {
                      type: 'string',
                      description: 'Tool name (e.g., postgres_query_execute, github_repo_create)',
                    },
                    arguments: {
                      type: 'object',
                      description: 'Tool-specific arguments',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Tool execution result',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      category: { type: 'string' },
                      tool: { type: 'string' },
                      result: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  res.json(schema);
});

// Start server
const PORT = process.env.PORT || 3000;

initializeMCP()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Robinson's Toolkit API Wrapper running on port ${PORT}`);
      console.log(`📖 OpenAPI schema: http://localhost:${PORT}/openapi.json`);
      console.log(`🔧 Tools loaded: ${availableTools.length}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize MCP:', error);
    process.exit(1);
  });

