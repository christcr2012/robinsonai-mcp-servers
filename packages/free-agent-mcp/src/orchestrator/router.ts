/**
 * Task Router
 *
 * Routes tasks by kind to appropriate agents and queues.
 * Supports feature, bugfix, refactor, and research tasks.
 */

import { enqueue, Job } from "./queues.js";
import { callAgent } from "./agents.js";

export type TaskKind = "feature" | "bugfix" | "refactor" | "research" | "analysis" | "optimization";

export type Task = {
  kind: TaskKind;
  detail: string;
  cwd: string;
  priority?: number;
  metadata?: Record<string, any>;
};

export type RouteResult = {
  jobId: string;
  jobType: string;
  priority: number;
};

/**
 * Route a task to appropriate queue
 *
 * @param task - Task to route
 * @returns Route result with job ID
 *
 * @example
 * ```typescript
 * const result = route({
 *   kind: "feature",
 *   detail: "Add user authentication",
 *   cwd: "."
 * });
 * console.log(`Job ${result.jobId} queued as ${result.jobType}`);
 * ```
 */
export function route(task: Task): RouteResult {
  const priority = task.priority ?? 0;

  let jobType: string;
  let actualPriority = priority;

  switch (task.kind) {
    case "research":
      jobType = "research";
      actualPriority = Math.max(priority, 5); // Research gets higher priority
      break;

    case "analysis":
      jobType = "analysis";
      actualPriority = Math.max(priority, 4);
      break;

    case "optimization":
      jobType = "optimization";
      actualPriority = Math.max(priority, 3);
      break;

    case "bugfix":
      jobType = "build";
      actualPriority = Math.max(priority, 8); // Bugfixes get highest priority
      break;

    case "feature":
    case "refactor":
    default:
      jobType = "build";
      break;
  }

  const jobId = enqueue(jobType, task, actualPriority);

  return {
    jobId,
    jobType,
    priority: actualPriority
  };
}

/**
 * Handle a job by routing to appropriate agent
 *
 * @param job - Job to handle
 * @returns Agent result
 * @throws Error if agent not found
 *
 * @example
 * ```typescript
 * const job = { type: "build", payload: { kind: "feature", ... } };
 * const result = await handle(job);
 * ```
 */
export async function handle(job: Job): Promise<any> {
  const { type, payload } = job;

  switch (type) {
    case "research":
      return callAgent("researcher", payload);

    case "analysis":
      return callAgent("analyzer", payload);

    case "optimization":
      return callAgent("optimizer", payload);

    case "build":
      return callAgent("builder", payload);

    default:
      throw new Error(`Unknown job type: ${type}`);
  }
}

/**
 * Get routing strategy for task kind
 *
 * @param kind - Task kind
 * @returns Routing strategy info
 */
export function getRoutingStrategy(kind: TaskKind): {
  jobType: string;
  agent: string;
  priority: number;
  description: string;
} {
  const strategies: Record<TaskKind, any> = {
    feature: {
      jobType: "build",
      agent: "builder",
      priority: 0,
      description: "Build new features"
    },
    bugfix: {
      jobType: "build",
      agent: "builder",
      priority: 8,
      description: "Fix bugs (high priority)"
    },
    refactor: {
      jobType: "build",
      agent: "builder",
      priority: 2,
      description: "Refactor existing code"
    },
    research: {
      jobType: "research",
      agent: "researcher",
      priority: 5,
      description: "Research and analysis"
    },
    analysis: {
      jobType: "analysis",
      agent: "analyzer",
      priority: 4,
      description: "Code analysis"
    },
    optimization: {
      jobType: "optimization",
      agent: "optimizer",
      priority: 3,
      description: "Performance optimization"
    }
  };

  return strategies[kind];
}

/**
 * Get all routing strategies
 *
 * @returns Record of all strategies
 */
export function getAllRoutingStrategies(): Record<TaskKind, any> {
  const strategies: Record<TaskKind, any> = {};

  for (const kind of ["feature", "bugfix", "refactor", "research", "analysis", "optimization"] as TaskKind[]) {
    strategies[kind] = getRoutingStrategy(kind);
  }

  return strategies;
}

/**
 * Validate task
 *
 * @param task - Task to validate
 * @returns Validation result
 */
export function validateTask(task: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!task) {
    errors.push("Task is required");
    return { valid: false, errors };
  }

  if (!task.kind) {
    errors.push("Task.kind is required");
  } else if (!["feature", "bugfix", "refactor", "research", "analysis", "optimization"].includes(task.kind)) {
    errors.push(`Invalid task.kind: ${task.kind}`);
  }

  if (!task.detail) {
    errors.push("Task.detail is required");
  } else if (typeof task.detail !== "string") {
    errors.push("Task.detail must be a string");
  }

  if (!task.cwd) {
    errors.push("Task.cwd is required");
  } else if (typeof task.cwd !== "string") {
    errors.push("Task.cwd must be a string");
  }

  if (task.priority !== undefined && typeof task.priority !== "number") {
    errors.push("Task.priority must be a number");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Route multiple tasks
 *
 * @param tasks - Tasks to route
 * @returns Array of route results
 */
export function routeMultiple(tasks: Task[]): RouteResult[] {
  return tasks.map(task => route(task));
}

/**
 * Get router info
 *
 * @returns Router statistics
 */
export function getRouterInfo(): {
  taskKinds: TaskKind[];
  strategies: Record<TaskKind, any>;
} {
  return {
    taskKinds: ["feature", "bugfix", "refactor", "research", "analysis", "optimization"],
    strategies: getAllRoutingStrategies()
  };
}

