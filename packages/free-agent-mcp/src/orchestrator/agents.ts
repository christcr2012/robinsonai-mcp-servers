/**
 * Agent Registry and Communication
 *
 * Enables Agent↔Agent communication and handoff.
 * Supports agent registration, discovery, and invocation.
 */

export type AgentCall = (input: any) => Promise<any>;

export type AgentMetadata = {
  name: string;
  description: string;
  version: string;
  capabilities: string[];
};

export type RegisteredAgent = {
  fn: AgentCall;
  metadata: AgentMetadata;
};

const registry: Record<string, RegisteredAgent> = {};

/**
 * Register an agent
 *
 * @param name - Agent name
 * @param fn - Agent function
 * @param metadata - Optional metadata
 *
 * @example
 * ```typescript
 * registerAgent("builder", async (input) => {
 *   // ... build code ...
 *   return { status: "done" };
 * }, {
 *   name: "builder",
 *   description: "Builds features",
 *   version: "1.0.0",
 *   capabilities: ["code-generation", "testing"]
 * });
 * ```
 */
export function registerAgent(
  name: string,
  fn: AgentCall,
  metadata?: Partial<AgentMetadata>
): void {
  registry[name] = {
    fn,
    metadata: {
      name,
      description: metadata?.description ?? `Agent: ${name}`,
      version: metadata?.version ?? "1.0.0",
      capabilities: metadata?.capabilities ?? []
    }
  };
}

/**
 * Call an agent
 *
 * @param name - Agent name
 * @param input - Input to agent
 * @returns Agent output
 * @throws Error if agent not found
 *
 * @example
 * ```typescript
 * const result = await callAgent("builder", {
 *   detail: "Add user authentication",
 *   cwd: "."
 * });
 * ```
 */
export async function callAgent(name: string, input: any): Promise<any> {
  const agent = registry[name];
  if (!agent) {
    throw new Error(`Agent not found: ${name}`);
  }

  try {
    return await agent.fn(input);
  } catch (err) {
    console.error(`[Agents] Error calling agent ${name}:`, err);
    throw err;
  }
}

/**
 * Check if agent exists
 *
 * @param name - Agent name
 * @returns True if agent is registered
 */
export function hasAgent(name: string): boolean {
  return name in registry;
}

/**
 * Get agent metadata
 *
 * @param name - Agent name
 * @returns Agent metadata or undefined
 */
export function getAgentMetadata(name: string): AgentMetadata | undefined {
  return registry[name]?.metadata;
}

/**
 * List all registered agents
 *
 * @returns Array of agent names
 */
export function listAgents(): string[] {
  return Object.keys(registry);
}

/**
 * Get all agent metadata
 *
 * @returns Record of agent names to metadata
 */
export function getAllAgentMetadata(): Record<string, AgentMetadata> {
  const result: Record<string, AgentMetadata> = {};
  for (const [name, agent] of Object.entries(registry)) {
    result[name] = agent.metadata;
  }
  return result;
}

/**
 * Find agents by capability
 *
 * @param capability - Capability to search for
 * @returns Array of agent names with capability
 */
export function findAgentsByCapability(capability: string): string[] {
  return Object.entries(registry)
    .filter(([_, agent]) => agent.metadata.capabilities.includes(capability))
    .map(([name]) => name);
}

/**
 * Unregister an agent
 *
 * @param name - Agent name
 * @returns True if unregistered
 */
export function unregisterAgent(name: string): boolean {
  if (name in registry) {
    delete registry[name];
    return true;
  }
  return false;
}

/**
 * Call agent with timeout
 *
 * @param name - Agent name
 * @param input - Input to agent
 * @param timeoutMs - Timeout in milliseconds
 * @returns Agent output
 * @throws Error if timeout or agent not found
 */
export async function callAgentWithTimeout(
  name: string,
  input: any,
  timeoutMs: number = 30000
): Promise<any> {
  return Promise.race([
    callAgent(name, input),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Agent ${name} timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

/**
 * Call agent with retry
 *
 * @param name - Agent name
 * @param input - Input to agent
 * @param maxRetries - Maximum retries
 * @param delayMs - Delay between retries
 * @returns Agent output
 * @throws Error if all retries fail
 */
export async function callAgentWithRetry(
  name: string,
  input: any,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<any> {
  let lastErr: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await callAgent(name, input);
    } catch (err) {
      lastErr = err as Error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastErr ?? new Error(`Agent ${name} failed after ${maxRetries} retries`);
}

/**
 * Handoff from one agent to another
 *
 * @param fromAgent - Source agent name
 * @param toAgent - Target agent name
 * @param input - Input to pass
 * @returns Target agent output
 *
 * @example
 * ```typescript
 * const result = await handoff("researcher", "builder", {
 *   detail: "Add auth",
 *   research: { notes: "..." }
 * });
 * ```
 */
export async function handoff(fromAgent: string, toAgent: string, input: any): Promise<any> {
  if (!hasAgent(fromAgent)) {
    throw new Error(`Source agent not found: ${fromAgent}`);
  }
  if (!hasAgent(toAgent)) {
    throw new Error(`Target agent not found: ${toAgent}`);
  }

  console.log(`[Agents] Handoff from ${fromAgent} to ${toAgent}`);
  return callAgent(toAgent, input);
}

/**
 * Get agent registry info
 *
 * @returns Registry statistics
 */
export function getRegistryInfo(): {
  agentCount: number;
  agents: string[];
  capabilities: string[];
} {
  const agents = listAgents();
  const capabilities = new Set<string>();

  for (const agent of agents) {
    const meta = getAgentMetadata(agent);
    if (meta) {
      meta.capabilities.forEach(cap => capabilities.add(cap));
    }
  }

  return {
    agentCount: agents.length,
    agents,
    capabilities: Array.from(capabilities)
  };
}

/**
 * Clear all agents
 */
export function clearRegistry(): void {
  for (const name of Object.keys(registry)) {
    delete registry[name];
  }
}

