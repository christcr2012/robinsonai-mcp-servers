#!/usr/bin/env node

/**
 * @robinsonai/thinking-tools-mcp
 * Comprehensive Thinking Tools MCP Server
 * Provides 18 cognitive frameworks for structured reasoning
 * By Robinson AI Systems
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import all thinking tools
import { devilsAdvocate } from './tools/devils-advocate.js';
import { firstPrinciples } from './tools/first-principles.js';
import { rootCauseAnalysis } from './tools/root-cause.js';
import { swotAnalysis } from './tools/swot.js';
import { premortemAnalysis } from './tools/premortem.js';
import { criticalThinking } from './tools/critical-thinking.js';
import { lateralThinking } from './tools/lateral-thinking.js';
import { redTeam } from './tools/red-team.js';
import { blueTeam } from './tools/blue-team.js';
import { decisionMatrix } from './tools/decision-matrix.js';
import { socratic } from './tools/socratic.js';
import { systemsThinking } from './tools/systems-thinking.js';
import { scenarioPlanning } from './tools/scenario-planning.js';
import { brainstorming } from './tools/brainstorming.js';
import { mindMapping } from './tools/mind-mapping.js';

class ThinkingToolsMCP {
  private server: Server;

  constructor() {
    this.server = new Server(
      { name: '@robinsonai/thinking-tools-mcp', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // Initialize handler
    this.server.setRequestHandler(InitializeRequestSchema, async (request) => ({
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: "@robinsonai/thinking-tools-mcp",
        version: "1.0.0",
      },
    }));

    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'devils_advocate',
          description: 'Challenge assumptions and find flaws in plans. Returns challenges, risks, counterarguments, and recommendations.',
          inputSchema: {
            type: 'object',
            properties: {
              context: { type: 'string', description: 'The plan or idea to challenge' },
              goal: { type: 'string', description: 'What you\'re trying to achieve' },
              depth: { type: 'string', enum: ['quick', 'deep'], description: 'How thorough to be' },
            },
            required: ['context'],
          },
        },
        {
          name: 'first_principles',
          description: 'Break down complex problems to fundamental truths. Returns fundamentals, assumptions, insights, and alternative approaches.',
          inputSchema: {
            type: 'object',
            properties: {
              problem: { type: 'string', description: 'The problem to analyze' },
              domain: { type: 'string', description: 'Problem domain (e.g., "authentication", "caching")' },
            },
            required: ['problem'],
          },
        },
        {
          name: 'root_cause',
          description: 'Use 5 Whys technique to find underlying causes. Returns why-chain, root causes, contributing factors, and solutions.',
          inputSchema: {
            type: 'object',
            properties: {
              problem: { type: 'string', description: 'The problem to analyze' },
              context: { type: 'string', description: 'Additional context' },
            },
            required: ['problem'],
          },
        },
        {
          name: 'swot_analysis',
          description: 'Analyze Strengths, Weaknesses, Opportunities, Threats. Returns SWOT breakdown and strategic recommendations.',
          inputSchema: {
            type: 'object',
            properties: {
              subject: { type: 'string', description: 'What to analyze (technology, approach, team, etc.)' },
              context: { type: 'string', description: 'Additional context' },
              perspective: { type: 'string', enum: ['technical', 'business', 'product', 'team'], description: 'Analysis perspective' },
            },
            required: ['subject'],
          },
        },
        {
          name: 'premortem_analysis',
          description: 'Imagine project failure and work backward to identify risks. Returns failure scenarios, warning signals, and mitigation strategies.',
          inputSchema: {
            type: 'object',
            properties: {
              project: { type: 'string', description: 'The project or initiative' },
              context: { type: 'string', description: 'Additional context' },
            },
            required: ['project'],
          },
        },
        {
          name: 'critical_thinking',
          description: 'Evaluate arguments, evidence, and logical reasoning. Returns claims, evidence quality, logical fallacies, and assessment.',
          inputSchema: {
            type: 'object',
            properties: {
              argument: { type: 'string', description: 'The argument to evaluate' },
              context: { type: 'string', description: 'Additional context' },
              depth: { type: 'string', enum: ['quick', 'deep'], description: 'How thorough to be' },
            },
            required: ['argument'],
          },
        },
        {
          name: 'lateral_thinking',
          description: 'Generate creative, non-obvious solutions. Returns unconventional approaches, analogies, reversals, and provocative ideas.',
          inputSchema: {
            type: 'object',
            properties: {
              problem: { type: 'string', description: 'The problem to solve creatively' },
              context: { type: 'string', description: 'Additional context' },
              constraints: { type: 'array', items: { type: 'string' }, description: 'Constraints to work within' },
            },
            required: ['problem'],
          },
        },
        {
          name: 'red_team',
          description: 'Attack the plan/design to find vulnerabilities. Returns attack vectors, exploits, edge cases, and stress tests.',
          inputSchema: {
            type: 'object',
            properties: {
              plan: { type: 'string', description: 'The plan or design to attack' },
              context: { type: 'string', description: 'Additional context' },
              focus: { type: 'string', enum: ['security', 'reliability', 'performance', 'all'], description: 'Attack focus area' },
            },
            required: ['plan'],
          },
        },
        {
          name: 'blue_team',
          description: 'Defend against attacks and strengthen the plan. Returns defenses, monitoring strategy, incident response, and hardening steps.',
          inputSchema: {
            type: 'object',
            properties: {
              plan: { type: 'string', description: 'The plan or design to defend' },
              threats: { type: 'array', items: { type: 'string' }, description: 'Known threats' },
              context: { type: 'string', description: 'Additional context' },
            },
            required: ['plan'],
          },
        },
        {
          name: 'decision_matrix',
          description: 'Weighted decision-making for comparing options. Returns scored matrix, recommendation, and tradeoffs.',
          inputSchema: {
            type: 'object',
            properties: {
              options: { type: 'array', items: { type: 'string' }, description: 'Options to compare' },
              criteria: { type: 'array', items: { type: 'string' }, description: 'Criteria to evaluate (auto-detected if not provided)' },
              context: { type: 'string', description: 'Additional context (affects weighting)' },
            },
            required: ['options'],
          },
        },
        {
          name: 'socratic_questioning',
          description: 'Deep inquiry through probing questions. Returns clarifying, assumption, reasoning, perspective, implication, and meta questions.',
          inputSchema: {
            type: 'object',
            properties: {
              topic: { type: 'string', description: 'The topic to explore' },
              context: { type: 'string', description: 'Additional context' },
              depth: { type: 'string', enum: ['quick', 'deep'], description: 'How many questions to generate' },
            },
            required: ['topic'],
          },
        },
        {
          name: 'systems_thinking',
          description: 'Understand interconnections, feedback loops, and emergent behavior. Returns components, feedback loops, leverage points, and system archetypes.',
          inputSchema: {
            type: 'object',
            properties: {
              system: { type: 'string', description: 'The system to analyze' },
              context: { type: 'string', description: 'Additional context' },
            },
            required: ['system'],
          },
        },
        {
          name: 'scenario_planning',
          description: 'Explore multiple possible futures. Returns scenarios with probability, impact, indicators, and preparations.',
          inputSchema: {
            type: 'object',
            properties: {
              situation: { type: 'string', description: 'The current situation' },
              timeframe: { type: 'string', description: 'Time horizon (e.g., "1 year", "5 years")' },
              context: { type: 'string', description: 'Additional context' },
            },
            required: ['situation'],
          },
        },
        {
          name: 'brainstorming',
          description: 'Generate many ideas quickly without judgment. Returns categorized ideas, wild ideas, and practical ideas.',
          inputSchema: {
            type: 'object',
            properties: {
              prompt: { type: 'string', description: 'What to brainstorm about' },
              context: { type: 'string', description: 'Additional context' },
              quantity: { type: 'number', description: 'How many ideas to generate (default: 20)' },
            },
            required: ['prompt'],
          },
        },
        {
          name: 'mind_mapping',
          description: 'Visual organization of ideas and concepts. Returns hierarchical structure and Mermaid diagram.',
          inputSchema: {
            type: 'object',
            properties: {
              centralIdea: { type: 'string', description: 'The central concept' },
              context: { type: 'string', description: 'Additional context' },
            },
            required: ['centralIdea'],
          },
        },
      ],
    }));

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result: any;

        switch (name) {
          case 'devils_advocate':
            result = devilsAdvocate(args as any);
            break;
          case 'first_principles':
            result = firstPrinciples(args as any);
            break;
          case 'root_cause':
            result = rootCauseAnalysis(args as any);
            break;
          case 'swot_analysis':
            result = swotAnalysis(args as any);
            break;
          case 'premortem_analysis':
            result = premortemAnalysis(args as any);
            break;
          case 'critical_thinking':
            result = criticalThinking(args as any);
            break;
          case 'lateral_thinking':
            result = lateralThinking(args as any);
            break;
          case 'red_team':
            result = redTeam(args as any);
            break;
          case 'blue_team':
            result = blueTeam(args as any);
            break;
          case 'decision_matrix':
            result = decisionMatrix(args as any);
            break;
          case 'socratic_questioning':
            result = socratic(args as any);
            break;
          case 'systems_thinking':
            result = systemsThinking(args as any);
            break;
          case 'scenario_planning':
            result = scenarioPlanning(args as any);
            break;
          case 'brainstorming':
            result = brainstorming(args as any);
            break;
          case 'mind_mapping':
            result = mindMapping(args as any);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
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

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Thinking Tools MCP server running on stdio');
  }
}

const server = new ThinkingToolsMCP();
server.run().catch(console.error);

