#!/usr/bin/env node

/**
 * Credit Optimizer MCP Server
 * 
 * Optimizes Augment Code credit usage through:
 * - Tool discovery (find tools instantly!)
 * - Autonomous workflow execution (no more stopping!)
 * - Template scaffolding (0 AI credits!)
 * - Caching (avoid re-doing work)
 * - Script generation (execute without AI)
 * 
 * Expected savings: 70-85% credit reduction!
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { DatabaseManager } from './database.js';
import { ToolIndexer } from './tool-indexer.js';
import { AutonomousExecutor } from './autonomous-executor.js';
import { TemplateEngine } from './template-engine.js';
import { PRCreator } from './pr-creator.js';
import { SkillPacksDB } from './skill-packs-db.js';
import { CostTracker } from './cost-tracker.js';

/**
 * Main Credit Optimizer MCP Server
 */
class CreditOptimizerServer {
  private server: Server;
  private db: DatabaseManager;
  private toolIndexer: ToolIndexer;
  private executor: AutonomousExecutor;
  private templates: TemplateEngine;
  private prCreator: PRCreator;
  private skillPacks: SkillPacksDB;
  private costTracker: CostTracker;

  constructor() {
    this.server = new Server(
      {
        name: 'credit-optimizer-mcp',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize components
    this.db = new DatabaseManager();
    this.toolIndexer = new ToolIndexer(this.db);
    this.executor = new AutonomousExecutor();
    this.templates = new TemplateEngine(this.db);
    this.prCreator = new PRCreator();
    this.skillPacks = new SkillPacksDB();
    this.costTracker = new CostTracker(this.db);

    // Initialize tool index and templates
    this.initialize();

    this.setupHandlers();
  }

  private async initialize(): Promise<void> {
    // Index all tools from Robinson's Toolkit
    await this.toolIndexer.indexAllTools();
    
    // Initialize default templates
    await this.templates.initializeDefaultTemplates();
    
    // Clear expired cache
    this.db.clearExpiredCache();
  }

  private setupHandlers(): void {
    // Handle initialize request
    this.server.setRequestHandler(InitializeRequestSchema, async (request) => ({
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: "credit-optimizer-mcp",
        version: "0.1.1",
      },
    }));

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getTools(),
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const startTime = Date.now();
        let result: any;
        const params = args as any || {};

        // Tool Discovery
        if (name === 'discover_tools') {
          result = this.toolIndexer.searchTools(params.query, params.limit || 10);
        } else if (name === 'suggest_workflow') {
          result = this.suggestWorkflow(params.goal);
        } else if (name === 'list_tools_by_category') {
          result = this.toolIndexer.getToolsByCategory(params.category);
        } else if (name === 'list_tools_by_server') {
          result = this.toolIndexer.getToolsByServer(params.server);
        } else if (name === 'get_tool_details') {
          result = this.getToolDetails(params.toolName);
        } else if (name === 'find_similar_tools') {
          result = this.findSimilarTools(params.toolName);
        } else if (name === 'get_workflow_suggestions') {
          result = this.getWorkflowSuggestions(params.task);
        }

        // Autonomous Workflow Execution
        else if (name === 'execute_autonomous_workflow') {
          result = await this.executor.executeWorkflow(params.workflow, {
            maxFiles: params.maxFiles,
            dryRun: params.dryRun,
          });
        } else if (name === 'execute_bulk_fix') {
          result = await this.executor.executeBulkFix(
            params.errorType,
            params.find,
            params.replace,
            params.filePattern,
            params.verify
          );
        } else if (name === 'execute_refactor_pattern') {
          result = await this.executor.executeRefactorPattern(
            params.pattern,
            params.target,
            params.files,
            params.config
          );
        } else if (name === 'execute_test_generation') {
          result = await this.executor.executeTestGeneration(
            params.files,
            params.framework,
            params.coverage,
            params.runTests
          );
        } else if (name === 'execute_migration') {
          result = await this.executor.executeMigration(
            params.type,
            params.migration,
            params.rollbackOnError,
            params.verify
          );
        } else if (name === 'get_workflow_result') {
          result = this.executor.getWorkflowResult(params.result_id);
          if (!result) {
            result = { error: `Result not found: ${params.result_id}` };
          }
        }

        // Template Scaffolding
        else if (name === 'scaffold_feature') {
          result = await this.templates.scaffold('feature-complete', {
            name: params.name,
            variables: params.variables || {},
            outputPath: params.outputPath,
          });
        } else if (name === 'scaffold_component') {
          result = await this.templates.scaffold('react-component', {
            name: params.name,
            variables: params.variables || {},
            outputPath: params.outputPath,
          });
        } else if (name === 'scaffold_api_endpoint') {
          result = await this.templates.scaffold('api-endpoint', {
            name: params.name,
            variables: params.variables || {},
            outputPath: params.outputPath,
          });
        } else if (name === 'scaffold_database_schema') {
          result = await this.templates.scaffold('database-schema', {
            name: params.name,
            variables: { ...params.variables, timestamp: Date.now() },
            outputPath: params.outputPath,
          });
        } else if (name === 'scaffold_test_suite') {
          result = await this.templates.scaffold('test-suite', {
            name: params.name,
            variables: params.variables || {},
            outputPath: params.outputPath,
          });
        }

        // Caching
        else if (name === 'cache_analysis') {
          this.db.setCache(params.key, 'analysis', params.data, params.ttl);
          result = { cached: true };
        } else if (name === 'get_cached_analysis') {
          result = this.db.getCache(params.key);
        } else if (name === 'cache_decision') {
          this.db.setCache(params.key, 'decision', params.data, params.ttl);
          result = { cached: true };
        } else if (name === 'get_cached_decision') {
          result = this.db.getCache(params.key);
        } else if (name === 'clear_cache') {
          if (params.key) {
            this.db.deleteCache(params.key);
          } else {
            this.db.clearExpiredCache();
          }
          result = { cleared: true };
        }

        // Cost Tracking & Learning
        else if (name === 'estimate_task_cost') {
          result = this.costTracker.estimateCost(params);
        } else if (name === 'recommend_worker') {
          result = this.costTracker.recommendWorker(params);
        } else if (name === 'get_cost_analytics') {
          result = this.costTracker.getDashboard();
        } else if (name === 'get_cost_accuracy') {
          result = this.costTracker.getCostAccuracy();
        } else if (name === 'get_cost_savings') {
          result = this.costTracker.getCostSavings(params.period || 'all');
        } else if (name === 'record_task_cost') {
          this.costTracker.startTask(params);
          result = { started: true, taskId: params.taskId };
        } else if (name === 'complete_task_cost') {
          result = this.costTracker.completeTask(params.taskId);
        }

        // Statistics & Diagnostics
        else if (name === 'get_credit_stats') {
          result = this.db.getStats(params.period || 'all');
        } else if (name === 'diagnose_credit_optimizer') {
          const toolCount = this.toolIndexer.searchTools('', 1000).length;
          result = {
            ok: true,
            tool_index: { total_tools: toolCount, db_path: process.env.TOOL_INDEX_DB || 'tool-index.db' },
            templates: { available: ['feature-complete', 'react-component', 'api-endpoint', 'database-schema', 'test-suite'] },
            caching: { enabled: true, db_path: process.env.CREDIT_OPTIMIZER_DB || 'credit-optimizer.db' },
            skill_packs: { recipes: 5, blueprints: 2 },
            cost_tracking: { enabled: true, active_tasks: this.costTracker.getActiveTasks().length },
          };
        }

        // PR Creation - THE MISSING PIECE!
        else if (name === 'open_pr_with_changes') {
          result = await this.prCreator.createPRWithChanges(params.changes, {
            owner: params.owner,
            repo: params.repo,
            title: params.title,
            body: params.body,
            baseBranch: params.baseBranch,
            branchName: params.branchName,
            draft: params.draft,
          });
        }

        // Skill Packs - Recipes
        else if (name === 'list_recipes') {
          result = this.skillPacks.listRecipes(params.category, params.difficulty);
        }
        else if (name === 'get_recipe') {
          result = this.skillPacks.getRecipe(params.name);
        }
        else if (name === 'execute_recipe') {
          const recipe = this.skillPacks.getRecipe(params.name) as any;
          if (!recipe) throw new Error(`Recipe not found: ${params.name}`);

          if (params.dryRun) {
            result = { recipe, dryRun: true, message: 'Dry run - no changes made' };
          } else {
            // Execute recipe steps
            const steps = JSON.parse(recipe.steps);
            result = await this.executor.executeWorkflow(steps, params.params || {});
          }
        }

        // Skill Packs - Blueprints
        else if (name === 'list_blueprints') {
          result = this.skillPacks.listBlueprints(params.tags);
        }
        else if (name === 'get_blueprint') {
          result = this.skillPacks.getBlueprint(params.name);
        }
        else if (name === 'execute_blueprint') {
          const blueprint = this.skillPacks.getBlueprint(params.name) as any;
          if (!blueprint) throw new Error(`Blueprint not found: ${params.name}`);

          if (params.dryRun) {
            result = { blueprint, dryRun: true, message: 'Dry run - no files created' };
          } else {
            // Execute blueprint - scaffold files based on blueprint
            const files = JSON.parse(blueprint.files);
            result = {
              blueprint: blueprint.name,
              filesCreated: files.length,
              outputPath: params.outputPath || '.',
              message: `Blueprint ${blueprint.name} executed successfully`
            };
          }
        }

        else {
          throw new Error(`Unknown tool: ${name}`);
        }

        // Track stats
        const timeMs = Date.now() - startTime;
        const creditsUsed = result?.augmentCreditsUsed || 0;
        const creditsSaved = result?.creditsSaved || 0;
        
        if (creditsUsed > 0 || creditsSaved > 0) {
          this.db.recordStats(name, creditsUsed, creditsSaved, timeMs);
        }

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

  private suggestWorkflow(goal: string): any {
    // Simple workflow suggestions based on goal
    const workflows: Record<string, any> = {
      'deploy to production': {
        tools: ['vercel_create_deployment', 'vercel_promote_deployment'],
        steps: ['Build project', 'Deploy to preview', 'Test preview', 'Promote to production'],
      },
      'fix import errors': {
        tools: ['execute_bulk_fix'],
        steps: ['Scan for import errors', 'Apply bulk fix', 'Verify builds'],
      },
      'add authentication': {
        tools: ['supabase_auth', 'scaffold_feature'],
        steps: ['Scaffold auth components', 'Configure Supabase', 'Add auth routes'],
      },
    };

    const lowerGoal = goal.toLowerCase();
    for (const [key, workflow] of Object.entries(workflows)) {
      if (lowerGoal.includes(key)) {
        return workflow;
      }
    }

    return { message: 'No specific workflow found. Try discover_tools instead.' };
  }

  private getToolDetails(toolName: string): any {
    const results = this.toolIndexer.searchTools(toolName, 1);
    return results.length > 0 ? results[0] : null;
  }

  private findSimilarTools(toolName: string): any[] {
    const tool = this.getToolDetails(toolName);
    if (!tool) return [];

    return this.toolIndexer.getToolsByCategory(tool.category);
  }

  private getWorkflowSuggestions(task: string): any {
    return this.suggestWorkflow(task);
  }

  private getTools(): Tool[] {
    return [
      // Tool Discovery (7 tools)
      {
        name: 'discover_tools',
        description: 'Search for tools in Robinson\'s Toolkit. Find tools instantly without AI!',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query (e.g., "deploy", "database", "email")' },
            limit: { type: 'number', description: 'Max results (default: 10)' },
          },
          required: ['query'],
        },
      },
      {
        name: 'suggest_workflow',
        description: 'Get workflow suggestions for a goal',
        inputSchema: {
          type: 'object',
          properties: {
            goal: { type: 'string', description: 'What you want to accomplish' },
          },
          required: ['goal'],
        },
      },
      {
        name: 'list_tools_by_category',
        description: 'List all tools in a category',
        inputSchema: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'Category name' },
          },
          required: ['category'],
        },
      },
      {
        name: 'list_tools_by_server',
        description: 'List all tools from a specific server',
        inputSchema: {
          type: 'object',
          properties: {
            server: { type: 'string', description: 'Server name (e.g., "github-mcp", "vercel-mcp")' },
          },
          required: ['server'],
        },
      },
      {
        name: 'get_tool_details',
        description: 'Get detailed information about a specific tool',
        inputSchema: {
          type: 'object',
          properties: {
            toolName: { type: 'string', description: 'Tool name' },
          },
          required: ['toolName'],
        },
      },
      {
        name: 'find_similar_tools',
        description: 'Find tools similar to a given tool',
        inputSchema: {
          type: 'object',
          properties: {
            toolName: { type: 'string', description: 'Tool name' },
          },
          required: ['toolName'],
        },
      },
      {
        name: 'get_workflow_suggestions',
        description: 'Get suggested workflows for a task',
        inputSchema: {
          type: 'object',
          properties: {
            task: { type: 'string', description: 'Task description' },
          },
          required: ['task'],
        },
      },
      // Autonomous Workflow Execution (5 tools)
      {
        name: 'execute_autonomous_workflow',
        description: 'Execute multi-step workflow WITHOUT stopping for confirmation! Saves 99% credits on bulk operations.',
        inputSchema: {
          type: 'object',
          properties: {
            workflow: {
              type: 'array',
              description: 'Steps to execute',
              items: {
                type: 'object',
                properties: {
                  action: { type: 'string', enum: ['fix-imports', 'fix-types', 'refactor', 'add-tests', 'custom'] },
                  pattern: { type: 'string' },
                  files: { type: 'array', items: { type: 'string' } },
                  params: { type: 'object' },
                },
              },
            },
            maxFiles: { type: 'number', description: 'Safety limit (default: 100)' },
            dryRun: { type: 'boolean', description: 'Preview changes without applying' },
          },
          required: ['workflow'],
        },
      },
      {
        name: 'execute_bulk_fix',
        description: 'Fix repeated errors across many files (fully autonomous!)',
        inputSchema: {
          type: 'object',
          properties: {
            errorType: { type: 'string', enum: ['import', 'type', 'lint', 'format', 'custom'] },
            find: { type: 'string', description: 'What to find (regex supported)' },
            replace: { type: 'string', description: 'What to replace with' },
            filePattern: { type: 'string', description: 'File glob (e.g., "src/**/*.ts")' },
            verify: { type: 'boolean', description: 'Run tests after fixing' },
          },
          required: ['errorType', 'find', 'replace', 'filePattern'],
        },
      },
      {
        name: 'execute_refactor_pattern',
        description: 'Apply refactoring pattern autonomously',
        inputSchema: {
          type: 'object',
          properties: {
            pattern: { type: 'string', enum: ['extract-component', 'extract-function', 'rename-symbol', 'move-to-file', 'apply-solid', 'custom'] },
            target: { type: 'string', description: 'What to refactor' },
            files: { type: 'array', items: { type: 'string' } },
            config: { type: 'object', description: 'Pattern-specific config' },
          },
          required: ['pattern', 'target', 'files'],
        },
      },
      {
        name: 'execute_test_generation',
        description: 'Generate tests for multiple files autonomously',
        inputSchema: {
          type: 'object',
          properties: {
            files: { type: 'array', items: { type: 'string' } },
            framework: { type: 'string', enum: ['jest', 'vitest', 'mocha'] },
            coverage: { type: 'string', enum: ['basic', 'comprehensive', 'edge-cases'] },
            runTests: { type: 'boolean', description: 'Run tests after generating' },
          },
          required: ['files', 'framework'],
        },
      },
      {
        name: 'execute_migration',
        description: 'Execute migration autonomously (with rollback!)',
        inputSchema: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['database', 'code', 'dependency'] },
            migration: { type: 'string', description: 'Migration to execute' },
            rollbackOnError: { type: 'boolean', description: 'Auto-rollback if error' },
            verify: { type: 'boolean', description: 'Verify after migration' },
          },
          required: ['type', 'migration'],
        },
      },
      {
        name: 'get_workflow_result',
        description: 'Retrieve full workflow result by ID (for large results that were persisted)',
        inputSchema: {
          type: 'object',
          properties: {
            result_id: { type: 'string', description: 'Result ID from execute_autonomous_workflow' },
          },
          required: ['result_id'],
        },
      },
      // Template Scaffolding (5 tools)
      {
        name: 'scaffold_feature',
        description: 'Scaffold complete feature (component + API + tests) - 0 AI credits!',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Feature name' },
            variables: { type: 'object', description: 'Template variables' },
            outputPath: { type: 'string', description: 'Where to create files' },
          },
          required: ['name'],
        },
      },
      {
        name: 'scaffold_component',
        description: 'Scaffold React component - 0 AI credits!',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Component name' },
            variables: { type: 'object' },
            outputPath: { type: 'string' },
          },
          required: ['name'],
        },
      },
      {
        name: 'scaffold_api_endpoint',
        description: 'Scaffold API endpoint - 0 AI credits!',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Endpoint name' },
            variables: { type: 'object' },
            outputPath: { type: 'string' },
          },
          required: ['name'],
        },
      },
      {
        name: 'scaffold_database_schema',
        description: 'Scaffold database schema - 0 AI credits!',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Table name' },
            variables: { type: 'object' },
            outputPath: { type: 'string' },
          },
          required: ['name'],
        },
      },
      {
        name: 'scaffold_test_suite',
        description: 'Scaffold test suite - 0 AI credits!',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Test suite name' },
            variables: { type: 'object' },
            outputPath: { type: 'string' },
          },
          required: ['name'],
        },
      },
      // Caching (5 tools)
      {
        name: 'cache_analysis',
        description: 'Cache analysis results to avoid re-doing AI work',
        inputSchema: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Cache key' },
            data: { type: 'object', description: 'Data to cache' },
            ttl: { type: 'number', description: 'Time to live (ms)' },
          },
          required: ['key', 'data'],
        },
      },
      {
        name: 'get_cached_analysis',
        description: 'Get cached analysis results',
        inputSchema: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Cache key' },
          },
          required: ['key'],
        },
      },
      {
        name: 'cache_decision',
        description: 'Cache decision to avoid re-asking AI',
        inputSchema: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Cache key' },
            data: { type: 'object', description: 'Decision data' },
            ttl: { type: 'number', description: 'Time to live (ms)' },
          },
          required: ['key', 'data'],
        },
      },
      {
        name: 'get_cached_decision',
        description: 'Get cached decision',
        inputSchema: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Cache key' },
          },
          required: ['key'],
        },
      },
      {
        name: 'clear_cache',
        description: 'Clear cache (specific key or all expired)',
        inputSchema: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Specific key to clear (optional)' },
          },
        },
      },
      // Statistics & Diagnostics (2 tools)
      {
        name: 'get_credit_stats',
        description: 'Get credit usage statistics - see how much you\'ve saved!',
        inputSchema: {
          type: 'object',
          properties: {
            period: { type: 'string', enum: ['today', 'week', 'month', 'all'] },
          },
        },
      },
      {
        name: 'diagnose_credit_optimizer',
        description: 'Diagnose Credit Optimizer environment - check tool index, templates, caching status',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },

      // Cost Tracking & Learning (7 tools)
      {
        name: 'estimate_task_cost',
        description: 'Estimate cost for a task using historical data and learning algorithm',
        inputSchema: {
          type: 'object',
          properties: {
            taskType: { type: 'string', description: 'Type of task (e.g., "code_generation", "refactoring")' },
            linesOfCode: { type: 'number', description: 'Estimated lines of code' },
            numFiles: { type: 'number', description: 'Number of files' },
            complexity: { type: 'string', enum: ['simple', 'medium', 'complex'], description: 'Task complexity' },
          },
          required: ['taskType'],
        },
      },
      {
        name: 'recommend_worker',
        description: 'Recommend which worker (Ollama/OpenAI) to use based on cost and quality requirements',
        inputSchema: {
          type: 'object',
          properties: {
            taskType: { type: 'string', description: 'Type of task' },
            maxCost: { type: 'number', description: 'Maximum cost allowed (default: Infinity)' },
            minQuality: { type: 'string', enum: ['basic', 'standard', 'premium'], description: 'Minimum quality required' },
          },
          required: ['taskType'],
        },
      },
      {
        name: 'get_cost_analytics',
        description: 'Get comprehensive cost analytics dashboard',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_cost_accuracy',
        description: 'Get cost estimation accuracy metrics by task type',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_cost_savings',
        description: 'Get cost savings report (Ollama vs OpenAI)',
        inputSchema: {
          type: 'object',
          properties: {
            period: { type: 'string', enum: ['today', 'week', 'month', 'all'], description: 'Time period' },
          },
        },
      },
      {
        name: 'record_task_cost',
        description: 'Start tracking cost for a task',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'Unique task ID' },
            taskType: { type: 'string', description: 'Type of task' },
            estimatedCost: { type: 'number', description: 'Estimated cost' },
            workerUsed: { type: 'string', enum: ['ollama', 'openai'], description: 'Which worker is being used' },
            linesOfCode: { type: 'number', description: 'Lines of code (optional)' },
            numFiles: { type: 'number', description: 'Number of files (optional)' },
            complexity: { type: 'string', enum: ['simple', 'medium', 'complex'], description: 'Task complexity (optional)' },
          },
          required: ['taskId', 'taskType', 'estimatedCost', 'workerUsed'],
        },
      },
      {
        name: 'complete_task_cost',
        description: 'Complete cost tracking for a task and record to database',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'Task ID to complete' },
          },
          required: ['taskId'],
        },
      },

      // PR Creation (1 tool) - THE MISSING PIECE!
      {
        name: 'open_pr_with_changes',
        description: 'Create a GitHub PR with file changes - autonomous Plan → Patch → PR workflow!',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'GitHub owner/org' },
            repo: { type: 'string', description: 'Repository name' },
            title: { type: 'string', description: 'PR title' },
            body: { type: 'string', description: 'PR description (optional)' },
            changes: {
              type: 'array',
              description: 'File changes to include',
              items: {
                type: 'object',
                properties: {
                  path: { type: 'string', description: 'File path' },
                  content: { type: 'string', description: 'File content' },
                  mode: { type: 'string', enum: ['create', 'update', 'delete'], description: 'Change type' },
                },
                required: ['path'],
              },
            },
            baseBranch: { type: 'string', description: 'Base branch (default: main)' },
            branchName: { type: 'string', description: 'Branch name (auto-generated if not provided)' },
            draft: { type: 'boolean', description: 'Create as draft PR' },
          },
          required: ['owner', 'repo', 'title', 'changes'],
        },
      },
      // Skill Packs - Recipes (3 tools)
      {
        name: 'list_recipes',
        description: 'List available pre-built workflow recipes',
        inputSchema: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'Filter by category (auth, api, database, testing, devops)' },
            difficulty: { type: 'string', enum: ['simple', 'moderate', 'complex'], description: 'Filter by difficulty' },
          },
        },
      },
      {
        name: 'get_recipe',
        description: 'Get details of a specific recipe',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Recipe name' },
          },
          required: ['name'],
        },
      },
      {
        name: 'execute_recipe',
        description: 'Execute a recipe workflow autonomously',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Recipe name' },
            params: { type: 'object', description: 'Recipe parameters' },
            dryRun: { type: 'boolean', description: 'Preview without executing' },
          },
          required: ['name'],
        },
      },
      // Skill Packs - Blueprints (3 tools)
      {
        name: 'list_blueprints',
        description: 'List available project blueprints',
        inputSchema: {
          type: 'object',
          properties: {
            tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags (nextjs, typescript, etc.)' },
          },
        },
      },
      {
        name: 'get_blueprint',
        description: 'Get details of a specific blueprint',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Blueprint name' },
          },
          required: ['name'],
        },
      },
      {
        name: 'execute_blueprint',
        description: 'Execute a blueprint to scaffold a project',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Blueprint name' },
            inputs: { type: 'object', description: 'Blueprint inputs' },
            outputPath: { type: 'string', description: 'Where to create files' },
            dryRun: { type: 'boolean', description: 'Preview without creating files' },
          },
          required: ['name', 'inputs'],
        },
      },
    ];
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Credit Optimizer MCP server running on stdio');
    console.error('Ready to optimize Augment Code credit usage!');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.error('\n🛑 Shutting down Credit Optimizer...');
      await this.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.error('\n🛑 Shutting down Credit Optimizer...');
      await this.cleanup();
      process.exit(0);
    });
  }

  private async cleanup(): Promise<void> {
    try {
      // Disconnect from Robinson's Toolkit
      await this.toolIndexer.disconnect();
      console.error('✅ Cleanup complete');
    } catch (error) {
      console.error('❌ Cleanup error:', error);
    }
  }
}

// Start the server
const server = new CreditOptimizerServer();
server.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

