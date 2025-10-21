#!/usr/bin/env node

/**
 * @robinsonai/sequential-thinking-mcp
 * Enhanced Sequential Thinking MCP Server
 * Provides advanced reasoning capabilities: sequential, parallel, and reflective thinking
 * By Robinson AI Systems
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

interface ThoughtStep {
  thoughtNumber: number;
  thought: string;
  nextThoughtNeeded: boolean;
  isRevision?: boolean;
  revisesThought?: number;
  branchId?: string;
  branchFromThought?: number;
}

interface ParallelBranch {
  branchId: string;
  description: string;
  thoughts: ThoughtStep[];
  conclusion?: string;
}

interface ReflectionPoint {
  thoughtNumber: number;
  reflection: string;
  improvements: string[];
  confidence: number;
}

class SequentialThinkingMCP {
  private server: Server;
  private thoughtHistory: ThoughtStep[] = [];
  private parallelBranches: Map<string, ParallelBranch> = new Map();
  private reflections: ReflectionPoint[] = [];

  constructor() {
    this.server = new Server(
      { name: '@robinsonai/sequential-thinking-mcp', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'sequential_thinking',
          description: 'Break down complex problems into sequential thought steps. Supports revisions, branching, and dynamic thought adjustment.',
          inputSchema: {
            type: 'object',
            properties: {
              thought: {
                type: 'string',
                description: 'Your current thinking step',
              },
              nextThoughtNeeded: {
                type: 'boolean',
                description: 'Whether another thought step is needed',
              },
              thoughtNumber: {
                type: 'integer',
                description: 'Current thought number',
                minimum: 1,
              },
              totalThoughts: {
                type: 'integer',
                description: 'Estimated total thoughts needed (can be adjusted)',
                minimum: 1,
              },
              isRevision: {
                type: 'boolean',
                description: 'Whether this revises previous thinking',
              },
              revisesThought: {
                type: 'integer',
                description: 'Which thought is being reconsidered',
                minimum: 1,
              },
              branchFromThought: {
                type: 'integer',
                description: 'Branching point thought number',
                minimum: 1,
              },
              branchId: {
                type: 'string',
                description: 'Branch identifier',
              },
              needsMoreThoughts: {
                type: 'boolean',
                description: 'If more thoughts are needed',
              },
            },
            required: ['thought', 'nextThoughtNeeded', 'thoughtNumber', 'totalThoughts'],
          },
        },
        {
          name: 'parallel_thinking',
          description: 'Explore multiple solution paths simultaneously. Create branches to evaluate different approaches in parallel.',
          inputSchema: {
            type: 'object',
            properties: {
              branchId: {
                type: 'string',
                description: 'Unique identifier for this branch',
              },
              description: {
                type: 'string',
                description: 'Description of this solution path',
              },
              thought: {
                type: 'string',
                description: 'Current thought in this branch',
              },
              thoughtNumber: {
                type: 'integer',
                description: 'Thought number within this branch',
                minimum: 1,
              },
              nextThoughtNeeded: {
                type: 'boolean',
                description: 'Whether more thoughts needed in this branch',
              },
              conclusion: {
                type: 'string',
                description: 'Final conclusion for this branch (if complete)',
              },
            },
            required: ['branchId', 'description', 'thought', 'thoughtNumber', 'nextThoughtNeeded'],
          },
        },
        {
          name: 'reflective_thinking',
          description: 'Review and critique previous thoughts and decisions. Identify improvements and assess confidence.',
          inputSchema: {
            type: 'object',
            properties: {
              thoughtNumber: {
                type: 'integer',
                description: 'Which thought to reflect on',
                minimum: 1,
              },
              reflection: {
                type: 'string',
                description: 'Your reflection on this thought',
              },
              improvements: {
                type: 'array',
                items: { type: 'string' },
                description: 'Suggested improvements',
              },
              confidence: {
                type: 'number',
                description: 'Confidence level (0-1)',
                minimum: 0,
                maximum: 1,
              },
            },
            required: ['thoughtNumber', 'reflection', 'improvements', 'confidence'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'sequential_thinking':
          return this.handleSequentialThinking(args);
        case 'parallel_thinking':
          return this.handleParallelThinking(args);
        case 'reflective_thinking':
          return this.handleReflectiveThinking(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async handleSequentialThinking(args: any) {
    const step: ThoughtStep = {
      thoughtNumber: args.thoughtNumber,
      thought: args.thought,
      nextThoughtNeeded: args.nextThoughtNeeded,
      isRevision: args.isRevision,
      revisesThought: args.revisesThought,
      branchId: args.branchId,
      branchFromThought: args.branchFromThought,
    };

    this.thoughtHistory.push(step);

    const response = {
      thoughtNumber: step.thoughtNumber,
      totalThoughts: args.totalThoughts,
      nextThoughtNeeded: step.nextThoughtNeeded,
      thoughtHistoryLength: this.thoughtHistory.length,
      branches: Array.from(this.parallelBranches.keys()),
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  private async handleParallelThinking(args: any) {
    const branchId = args.branchId;
    
    if (!this.parallelBranches.has(branchId)) {
      this.parallelBranches.set(branchId, {
        branchId,
        description: args.description,
        thoughts: [],
      });
    }

    const branch = this.parallelBranches.get(branchId)!;
    
    branch.thoughts.push({
      thoughtNumber: args.thoughtNumber,
      thought: args.thought,
      nextThoughtNeeded: args.nextThoughtNeeded,
    });

    if (args.conclusion) {
      branch.conclusion = args.conclusion;
    }

    const response = {
      branchId,
      thoughtsInBranch: branch.thoughts.length,
      totalBranches: this.parallelBranches.size,
      branchComplete: !!args.conclusion,
      allBranches: Array.from(this.parallelBranches.entries()).map(([id, b]) => ({
        id,
        description: b.description,
        thoughtCount: b.thoughts.length,
        complete: !!b.conclusion,
      })),
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  private async handleReflectiveThinking(args: any) {
    const reflection: ReflectionPoint = {
      thoughtNumber: args.thoughtNumber,
      reflection: args.reflection,
      improvements: args.improvements,
      confidence: args.confidence,
    };

    this.reflections.push(reflection);

    const targetThought = this.thoughtHistory.find(t => t.thoughtNumber === args.thoughtNumber);

    const response = {
      reflectionAdded: true,
      totalReflections: this.reflections.length,
      targetThought: targetThought?.thought || 'Not found',
      confidence: args.confidence,
      improvementCount: args.improvements.length,
      averageConfidence: this.reflections.reduce((sum, r) => sum + r.confidence, 0) / this.reflections.length,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('@robinsonai/sequential-thinking-mcp server running on stdio');
    console.error('3 tools available: sequential_thinking, parallel_thinking, reflective_thinking');
  }
}

const server = new SequentialThinkingMCP();
server.run().catch(console.error);

