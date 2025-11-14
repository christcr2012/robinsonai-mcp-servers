/**
 * Agent Pool
 * 
 * Manages pool of available agents and distributes work based on availability.
 * Supports both FREE Ollama agents and PAID OpenAI agents.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface Agent {
  name: string;
  tool: string; // execute_versatile_task_autonomous-agent-mcp or execute_versatile_task_openai-worker-mcp
  cost: number | 'variable'; // 0 for Ollama, 'variable' for OpenAI
  busy: boolean;
  client?: Client;
}

export interface AgentPoolConfig {
  autonomousAgents?: number; // Number of FREE Ollama agents (default: 2)
  openaiWorkers?: number;     // Number of PAID OpenAI workers (default: 2)
}

export class AgentPool {
  private agents: Agent[] = [];
  private waitQueue: Array<(agent: Agent) => void> = [];

  constructor(config: AgentPoolConfig = {}) {
    const autonomousCount = config.autonomousAgents || 2;
    const openaiCount = config.openaiWorkers || 2;

    // Create FREE Ollama agents
    for (let i = 1; i <= autonomousCount; i++) {
      this.agents.push({
        name: `autonomous-${i}`,
        tool: 'execute_versatile_task_autonomous-agent-mcp',
        cost: 0,
        busy: false,
      });
    }

    // Create PAID OpenAI workers
    for (let i = 1; i <= openaiCount; i++) {
      this.agents.push({
        name: `openai-worker-${i}`,
        tool: 'execute_versatile_task_openai-worker-mcp',
        cost: 'variable',
        busy: false,
      });
    }

    console.error(`[AgentPool] Initialized with ${this.agents.length} agents:`);
    console.error(`  - ${autonomousCount} FREE Ollama agents`);
    console.error(`  - ${openaiCount} PAID OpenAI workers`);
  }

  /**
   * Get an available agent (waits if all busy)
   */
  async getAvailableAgent(): Promise<Agent> {
    // Try to get a FREE Ollama agent first
    const freeAgent = this.agents.find(a => !a.busy && a.cost === 0);
    if (freeAgent) {
      freeAgent.busy = true;
      console.error(`[AgentPool] Assigned ${freeAgent.name} (FREE)`);
      return freeAgent;
    }

    // Try to get any available agent
    const anyAgent = this.agents.find(a => !a.busy);
    if (anyAgent) {
      anyAgent.busy = true;
      console.error(`[AgentPool] Assigned ${anyAgent.name} (${anyAgent.cost === 0 ? 'FREE' : 'PAID'})`);
      return anyAgent;
    }

    // All agents busy, wait for one to become available
    console.error(`[AgentPool] All agents busy, waiting...`);
    return new Promise((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  /**
   * Release an agent back to the pool
   */
  releaseAgent(agent: Agent): void {
    agent.busy = false;
    console.error(`[AgentPool] Released ${agent.name}`);

    // If there are waiting tasks, assign this agent immediately
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift()!;
      agent.busy = true;
      console.error(`[AgentPool] Immediately reassigned ${agent.name} to waiting task`);
      resolve(agent);
    }
  }

  /**
   * Execute a task on a specific agent
   */
  async executeOnAgent(agent: Agent, tool: string, params: any): Promise<any> {
    try {
      // Connect to agent's MCP server if not already connected
      if (!agent.client) {
        await this.connectToAgent(agent);
      }

      // Execute tool on agent
      const result = await agent.client!.callTool({
        name: agent.tool,
        arguments: params,
      });

      return result.content;
    } finally {
      // Always release agent when done
      this.releaseAgent(agent);
    }
  }

  /**
   * Connect to an agent's MCP server
   */
  private async connectToAgent(agent: Agent): Promise<void> {
    console.error(`[AgentPool] Connecting to ${agent.name}...`);

    // Determine which MCP server to connect to
    let command: string;
    let args: string[];

    if (agent.tool === 'execute_versatile_task_autonomous-agent-mcp') {
      command = 'npx';
      args = ['autonomous-agent-mcp'];
    } else if (agent.tool === 'execute_versatile_task_openai-worker-mcp') {
      command = 'npx';
      args = ['openai-worker-mcp'];
    } else {
      throw new Error(`Unknown agent tool: ${agent.tool}`);
    }

    // Create transport
    const transport = new StdioClientTransport({
      command,
      args,
    });

    // Create client
    agent.client = new Client(
      {
        name: `agent-pool-${agent.name}`,
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    // Connect
    await agent.client.connect(transport);

    console.error(`[AgentPool] Connected to ${agent.name}`);
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    total: number;
    busy: number;
    available: number;
    free: number;
    paid: number;
    waiting: number;
  } {
    const busy = this.agents.filter(a => a.busy).length;
    const free = this.agents.filter(a => a.cost === 0).length;
    const paid = this.agents.filter(a => a.cost === 'variable').length;

    return {
      total: this.agents.length,
      busy,
      available: this.agents.length - busy,
      free,
      paid,
      waiting: this.waitQueue.length,
    };
  }

  /**
   * Disconnect all agents
   */
  async disconnectAll(): Promise<void> {
    console.error(`[AgentPool] Disconnecting all agents...`);

    for (const agent of this.agents) {
      if (agent.client) {
        await agent.client.close();
        agent.client = undefined;
      }
    }

    console.error(`[AgentPool] All agents disconnected`);
  }

  /**
   * Get agent by name
   */
  getAgent(name: string): Agent | undefined {
    return this.agents.find(a => a.name === name);
  }

  /**
   * List all agents
   */
  listAgents(): Agent[] {
    return this.agents.map(a => ({
      name: a.name,
      tool: a.tool,
      cost: a.cost,
      busy: a.busy,
    }));
  }
}

/**
 * Shared singleton instance
 */
let sharedAgentPool: AgentPool | null = null;

/**
 * Get shared agent pool instance
 */
export function getSharedAgentPool(config?: AgentPoolConfig): AgentPool {
  if (!sharedAgentPool) {
    sharedAgentPool = new AgentPool(config);
  }
  return sharedAgentPool;
}

/**
 * Cleanup on process exit
 */
process.on('exit', () => {
  if (sharedAgentPool) {
    sharedAgentPool.disconnectAll().catch(console.error);
  }
});

