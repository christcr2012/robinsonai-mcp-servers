/**
 * System Introspection Handlers
 * Implements system meta-knowledge tools
 */

import { Pool } from 'pg';
import { loadRegistry } from '../../lib/registry.js';

const DEFAULT_CORTEX_DATABASE_URL = 'postgresql://neondb_owner:npg_dMv0ArX1TGYP@ep-broad-recipe-ae1wjh66.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.CORTEX_DATABASE_URL || process.env.RAD_DATABASE_URL || DEFAULT_CORTEX_DATABASE_URL,
    });
  }
  return pool;
}

/**
 * system_get_tool_catalog
 * Returns a grouped list of all tools across connected MCP servers
 */
export async function system_get_tool_catalog(args?: {
  category?: string;
  includeSchemas?: boolean;
}): Promise<{
  ok: boolean;
  categories: Array<{
    name: string;
    displayName: string;
    description: string;
    toolCount: number;
    tools?: Array<{
      name: string;
      description: string;
      inputSchema?: any;
    }>;
  }>;
  totalTools: number;
}> {
  try {
    const registry = loadRegistry();
    const categories = Object.values(registry.categories);

    const result = categories
      .filter(cat => !args?.category || cat.name === args.category)
      .map(cat => {
        const categoryTools = registry.toolsByCategory.get(cat.name) || [];

        return {
          name: cat.name,
          displayName: cat.displayName,
          description: cat.description,
          toolCount: cat.toolCount,
          tools: args?.includeSchemas
            ? categoryTools.map(tool => ({
                name: tool.name,
                description: tool.description || '',
                inputSchema: tool.inputSchema,
              }))
            : categoryTools.map(tool => ({
                name: tool.name,
                description: tool.description || '',
              })),
        };
      });

    const totalTools = result.reduce((sum, cat) => sum + cat.toolCount, 0);

    return {
      ok: true,
      categories: result,
      totalTools,
    };
  } catch (error) {
    return {
      ok: false,
      categories: [],
      totalTools: 0,
    };
  }
}

/**
 * system_get_capabilities
 * Queries capability_registry and returns capability summaries
 */
export async function system_get_capabilities(args?: {
  category?: string;
  scope?: 'global' | 'repo' | 'task';
  complexity?: 'simple' | 'medium' | 'complex' | 'expert';
}): Promise<{
  ok: boolean;
  capabilities: Array<{
    name: string;
    description: string;
    category: string;
    complexity: string;
    scope: string;
    requiredTools: string[];
    estimatedDurationMinutes: number | null;
    metadata: Record<string, any>;
  }>;
}> {
  const pool = getPool();

  try {
    let query = `
      SELECT
        name, description, category, complexity, scope,
        required_tools, estimated_duration_minutes, metadata
      FROM capability_registry
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (args?.category) {
      query += ` AND category = $${paramIndex}`;
      params.push(args.category);
      paramIndex++;
    }

    if (args?.scope) {
      query += ` AND scope = $${paramIndex}`;
      params.push(args.scope);
      paramIndex++;
    }

    if (args?.complexity) {
      query += ` AND complexity = $${paramIndex}`;
      params.push(args.complexity);
      paramIndex++;
    }

    query += ` ORDER BY category, name`;

    const result = await pool.query(query, params);

    return {
      ok: true,
      capabilities: result.rows.map(row => ({
        name: row.name,
        description: row.description,
        category: row.category,
        complexity: row.complexity,
        scope: row.scope || 'global',
        requiredTools: row.required_tools || [],
        estimatedDurationMinutes: row.estimated_duration_minutes,
        metadata: row.metadata || {},
      })),
    };
  } catch (error) {
    console.error('[system_get_capabilities] Error:', error);
    return {
      ok: false,
      capabilities: [],
    };
  }
}

/**
 * system_get_agent_handbook
 * Reads the latest Agent Handbook artifact from Cortex/RAD
 */
export async function system_get_agent_handbook(args?: {
  format?: 'markdown' | 'json' | 'yaml';
}): Promise<{
  ok: boolean;
  handbook?: {
    title: string;
    content: string;
    format: string;
    createdAt: string;
    tags: string[];
  };
  message?: string;
}> {
  const pool = getPool();

  try {
    const result = await pool.query(
      `
      SELECT title, content, format, created_at, tags
      FROM knowledge_artifacts
      WHERE artifact_type = 'agent_handbook'
        AND tags @> ARRAY['handbook', 'system_overview']
      ORDER BY created_at DESC
      LIMIT 1
      `
    );

    if (result.rows.length === 0) {
      return {
        ok: false,
        message: 'Agent Handbook not found. Please run bootstrap_agent_cortex capability to create it.',
      };
    }

    const handbook = result.rows[0];

    return {
      ok: true,
      handbook: {
        title: handbook.title,
        content: handbook.content,
        format: handbook.format,
        createdAt: handbook.created_at,
        tags: handbook.tags || [],
      },
    };
  } catch (error) {
    console.error('[system_get_agent_handbook] Error:', error);
    return {
      ok: false,
      message: `Failed to retrieve Agent Handbook: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * system_get_architecture_overview
 * Returns a short, curated system architecture overview
 */
export async function system_get_architecture_overview(args?: {
  includeComponents?: boolean;
  includeIntegrations?: boolean;
}): Promise<{
  ok: boolean;
  overview: {
    name: string;
    description: string;
    components?: Array<{
      name: string;
      description: string;
      type: string;
    }>;
    integrations?: Array<{
      name: string;
      description: string;
      toolCount: number;
    }>;
  };
}> {
  const includeComponents = args?.includeComponents !== false;
  const includeIntegrations = args?.includeIntegrations !== false;

  const overview: any = {
    name: 'Robinson AI MCP Servers',
    description: 'Multi-agent system with 5 MCP servers providing 1700+ tools for autonomous coding, deployment, and knowledge management',
  };

  if (includeComponents) {
    overview.components = [
      {
        name: 'Free Agent MCP',
        description: 'Local-first agent using Ollama for 0-credit code generation, analysis, and refactoring',
        type: 'agent',
      },
      {
        name: 'Paid Agent MCP',
        description: 'Premium agent using OpenAI/Claude for complex tasks with quality gates and batch processing',
        type: 'agent',
      },
      {
        name: 'Robinson\'s Toolkit MCP',
        description: 'Unified broker for 1700+ integration tools across GitHub, Vercel, Neon, Google, OpenAI, and more',
        type: 'toolkit',
      },
      {
        name: 'Thinking Tools MCP',
        description: 'Cognitive frameworks (SWOT, root cause, premortem, etc.) and Context Engine for semantic code search',
        type: 'thinking',
      },
      {
        name: 'Credit Optimizer MCP',
        description: 'Workflow automation, scaffolding, and cost optimization for multi-agent orchestration',
        type: 'optimizer',
      },
      {
        name: 'Agent Cortex',
        description: 'Knowledge management system storing playbooks, workflows, patterns, capabilities, and artifacts',
        type: 'knowledge',
      },
      {
        name: 'RAD (Repository Agent Database)',
        description: 'Long-term memory storing tasks, decisions, lessons, and indexed documentation',
        type: 'memory',
      },
    ];
  }

  if (includeIntegrations) {
    try {
      const registry = loadRegistry();
      overview.integrations = Object.values(registry.categories).map(cat => ({
        name: cat.displayName,
        description: cat.description,
        toolCount: cat.toolCount,
      }));
    } catch (error) {
      console.error('[system_get_architecture_overview] Failed to load integrations:', error);
    }
  }

  return {
    ok: true,
    overview,
  };
}

