#!/usr/bin/env node

/**
 * Autonomous AI Agent MCP Server
 * 
 * Offloads heavy AI work from Augment Code to FREE local LLMs (Ollama).
 * 
 * Features:
 * - Code generation using local LLMs (0 Augment credits!)
 * - Code analysis (0 Augment credits!)
 * - Code refactoring (0 Augment credits!)
 * - Test generation (0 Augment credits!)
 * - Documentation generation (0 Augment credits!)
 * 
 * Savings: 90%+ reduction in Augment Code credits!
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { OllamaClient } from './ollama-client.js';
import { CodeGenerator } from './agents/code-generator.js';
import { CodeAnalyzer } from './agents/code-analyzer.js';
import { CodeRefactor } from './agents/code-refactor.js';
import { StatsTracker } from './utils/stats-tracker.js';

/**
 * Main Autonomous Agent MCP Server
 */
class AutonomousAgentServer {
  private server: Server;
  private ollama: OllamaClient;
  private codeGenerator: CodeGenerator;
  private codeAnalyzer: CodeAnalyzer;
  private codeRefactor: CodeRefactor;
  private stats: StatsTracker;

  constructor() {
    this.server = new Server(
      {
        name: 'autonomous-agent-mcp',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize components
    this.ollama = new OllamaClient();
    this.codeGenerator = new CodeGenerator(this.ollama);
    this.codeAnalyzer = new CodeAnalyzer(this.ollama);
    this.codeRefactor = new CodeRefactor(this.ollama);
    this.stats = new StatsTracker();

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error('[DEBUG] ListTools called');
      const tools = this.getTools();
      console.error(`[DEBUG] Returning ${tools.length} tools`);
      return { tools };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const startTime = Date.now();
        let result: any;

        switch (name) {
          case 'delegate_code_generation':
            result = await this.codeGenerator.generate(args as any);
            break;

          case 'delegate_code_analysis':
            result = await this.codeAnalyzer.analyze(args as any);
            break;

          case 'delegate_code_refactoring':
            result = await this.codeRefactor.refactor(args as any);
            break;

          case 'delegate_test_generation':
            result = await this.codeGenerator.generateTests(args as any);
            break;

          case 'delegate_documentation':
            result = await this.codeGenerator.generateDocs(args as any);
            break;

          case 'get_agent_stats':
            result = await this.stats.getStats(args as any);
            break;

          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        // Track stats
        const timeMs = Date.now() - startTime;
        await this.stats.recordUsage(name, result.augmentCreditsUsed || 0, result.creditsSaved || 0, timeMs);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private getTools(): Tool[] {
    return [
      {
        name: 'delegate_code_generation',
        description: 'Generate code using local LLM (0 Augment credits!). Saves 90%+ credits vs Augment generating code.',
        inputSchema: {
          type: 'object',
          properties: {
            task: {
              type: 'string',
              description: 'What to build (e.g., "notifications feature", "user authentication")',
            },
            context: {
              type: 'string',
              description: 'Project context (e.g., "Next.js, TypeScript, Supabase")',
            },
            template: {
              type: 'string',
              description: 'Optional template to use',
              enum: ['react-component', 'api-endpoint', 'database-schema', 'test-suite', 'none'],
            },
            model: {
              type: 'string',
              description: 'Which model to use (auto selects based on complexity)',
              enum: ['deepseek-coder', 'qwen-coder', 'codellama', 'auto'],
            },
            complexity: {
              type: 'string',
              description: 'Task complexity (affects model selection)',
              enum: ['simple', 'medium', 'complex'],
            },
          },
          required: ['task', 'context'],
        },
      },
      {
        name: 'delegate_code_analysis',
        description: 'Analyze code using local LLM (0 Augment credits!). Find issues, performance problems, security vulnerabilities.',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Code to analyze',
            },
            files: {
              type: 'array',
              description: 'Multiple files to analyze',
              items: { type: 'string' },
            },
            question: {
              type: 'string',
              description: 'What to analyze (e.g., "find performance issues", "check security")',
            },
            model: {
              type: 'string',
              enum: ['deepseek-coder', 'qwen-coder', 'codellama', 'auto'],
            },
          },
          required: ['question'],
        },
      },
      {
        name: 'delegate_code_refactoring',
        description: 'Refactor code using local LLM (0 Augment credits!). Extract components, improve structure, apply patterns.',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Code to refactor',
            },
            instructions: {
              type: 'string',
              description: 'How to refactor (e.g., "extract into components", "apply SOLID principles")',
            },
            style: {
              type: 'string',
              description: 'Code style to follow',
              enum: ['functional', 'oop', 'minimal', 'verbose'],
            },
            model: {
              type: 'string',
              enum: ['deepseek-coder', 'qwen-coder', 'codellama', 'auto'],
            },
          },
          required: ['code', 'instructions'],
        },
      },
      {
        name: 'delegate_test_generation',
        description: 'Generate tests using local LLM (0 Augment credits!). Create comprehensive test suites.',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Code to test',
            },
            framework: {
              type: 'string',
              description: 'Test framework',
              enum: ['jest', 'vitest', 'mocha', 'pytest', 'go-test'],
            },
            coverage: {
              type: 'string',
              description: 'Coverage level',
              enum: ['basic', 'comprehensive', 'edge-cases'],
            },
            model: {
              type: 'string',
              enum: ['deepseek-coder', 'qwen-coder', 'codellama', 'auto'],
            },
          },
          required: ['code', 'framework'],
        },
      },
      {
        name: 'delegate_documentation',
        description: 'Generate documentation using local LLM (0 Augment credits!). Create JSDoc, TSDoc, or README files.',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Code to document',
            },
            style: {
              type: 'string',
              description: 'Documentation style',
              enum: ['jsdoc', 'tsdoc', 'markdown', 'readme'],
            },
            detail: {
              type: 'string',
              enum: ['brief', 'detailed', 'comprehensive'],
            },
          },
          required: ['code'],
        },
      },
      {
        name: 'get_agent_stats',
        description: 'Get usage statistics for the autonomous agent. See how many credits you\'ve saved!',
        inputSchema: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              enum: ['today', 'week', 'month', 'all'],
            },
          },
        },
      },
    ];
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Autonomous Agent MCP server running on stdio');
    console.error('Ready to offload heavy AI work to FREE local LLMs!');
  }
}

// Start the server
const server = new AutonomousAgentServer();
server.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

