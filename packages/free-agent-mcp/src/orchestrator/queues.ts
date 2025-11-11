/**
 * Job Queue System
 *
 * Lightweight in-process queue for task orchestration.
 * Supports enqueue, drain, and batch processing.
 */

export type Job = {
  type: string;
  payload: any;
  id?: string;
  priority?: number;
  createdAt?: number;
};

let queue: Job[] = [];
let jobCounter = 0;

/**
 * Enqueue a job
 *
 * @param type - Job type identifier
 * @param payload - Job payload
 * @param priority - Optional priority (higher = earlier)
 *
 * @example
 * ```typescript
 * enqueue("build", { detail: "Add auth", cwd: "." });
 * enqueue("research", { query: "authentication patterns" }, 10);
 * ```
 */
export function enqueue(type: string, payload: any, priority: number = 0): string {
  const id = `job-${++jobCounter}`;
  const job: Job = {
    type,
    payload,
    id,
    priority,
    createdAt: Date.now()
  };

  // Insert by priority (higher priority first)
  let inserted = false;
  for (let i = 0; i < queue.length; i++) {
    if ((queue[i].priority ?? 0) < priority) {
      queue.splice(i, 0, job);
      inserted = true;
      break;
    }
  }

  if (!inserted) {
    queue.push(job);
  }

  return id;
}

/**
 * Dequeue a job
 *
 * @returns Next job or undefined
 */
export function dequeue(): Job | undefined {
  return queue.shift();
}

/**
 * Peek at next job without removing
 *
 * @returns Next job or undefined
 */
export function peek(): Job | undefined {
  return queue[0];
}

/**
 * Get queue length
 *
 * @returns Number of jobs in queue
 */
export function getQueueLength(): number {
  return queue.length;
}

/**
 * Drain queue with handler
 *
 * @param handler - Async handler for each job
 * @returns Promise that resolves when queue is empty
 *
 * @example
 * ```typescript
 * await drain(async (job) => {
 *   console.log(`Processing ${job.type}`);
 *   await handle(job);
 * });
 * ```
 */
export async function drain(handler: (job: Job) => Promise<void>): Promise<void> {
  while (queue.length > 0) {
    const job = dequeue();
    if (job) {
      try {
        await handler(job);
      } catch (err) {
        console.error(`[Queue] Error processing job ${job.id}:`, err);
      }
    }
  }
}

/**
 * Drain queue with error handling
 *
 * @param handler - Async handler for each job
 * @param onError - Error handler
 * @returns Promise that resolves when queue is empty
 */
export async function drainWithErrorHandling(
  handler: (job: Job) => Promise<void>,
  onError: (job: Job, err: Error) => Promise<void>
): Promise<void> {
  while (queue.length > 0) {
    const job = dequeue();
    if (job) {
      try {
        await handler(job);
      } catch (err) {
        await onError(job, err as Error);
      }
    }
  }
}

/**
 * Clear queue
 */
export function clearQueue(): void {
  queue = [];
}

/**
 * Get all jobs
 *
 * @returns Copy of all jobs in queue
 */
export function getAllJobs(): Job[] {
  return [...queue];
}

/**
 * Get jobs by type
 *
 * @param type - Job type to filter
 * @returns Jobs matching type
 */
export function getJobsByType(type: string): Job[] {
  return queue.filter(j => j.type === type);
}

/**
 * Remove job by ID
 *
 * @param id - Job ID
 * @returns True if removed
 */
export function removeJob(id: string): boolean {
  const index = queue.findIndex(j => j.id === id);
  if (index >= 0) {
    queue.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * Get queue stats
 *
 * @returns Queue statistics
 */
export function getQueueStats(): {
  length: number;
  byType: Record<string, number>;
  avgPriority: number;
  oldestJob: Job | null;
} {
  const byType: Record<string, number> = {};
  let totalPriority = 0;

  for (const job of queue) {
    byType[job.type] = (byType[job.type] ?? 0) + 1;
    totalPriority += job.priority ?? 0;
  }

  return {
    length: queue.length,
    byType,
    avgPriority: queue.length > 0 ? totalPriority / queue.length : 0,
    oldestJob: queue.length > 0 ? queue[0] : null
  };
}

/**
 * Batch enqueue multiple jobs
 *
 * @param jobs - Array of [type, payload] tuples
 * @returns Array of job IDs
 */
export function batchEnqueue(jobs: Array<[string, any, number?]>): string[] {
  return jobs.map(([type, payload, priority]) => enqueue(type, payload, priority));
}

/**
 * Process queue with concurrency limit
 *
 * @param handler - Async handler for each job
 * @param concurrency - Max concurrent jobs
 * @returns Promise that resolves when queue is empty
 */
export async function drainWithConcurrency(
  handler: (job: Job) => Promise<void>,
  concurrency: number = 1
): Promise<void> {
  const active: Promise<void>[] = [];

  while (queue.length > 0 || active.length > 0) {
    // Fill up to concurrency limit
    while (active.length < concurrency && queue.length > 0) {
      const job = dequeue();
      if (job) {
        const promise = handler(job).catch(err => {
          console.error(`[Queue] Error processing job ${job.id}:`, err);
        });
        active.push(promise);
      }
    }

    // Wait for at least one to complete
    if (active.length > 0) {
      await Promise.race(active);
      // Remove completed promises
      for (let i = active.length - 1; i >= 0; i--) {
        if (active[i]) {
          try {
            await active[i];
            active.splice(i, 1);
          } catch {
            // Already handled
            active.splice(i, 1);
          }
        }
      }
    }
  }
}

/**
 * Export queue as JSON
 *
 * @returns JSON string
 */
export function exportQueue(): string {
  return JSON.stringify(queue, null, 2);
}

/**
 * Import queue from JSON
 *
 * @param json - JSON string
 */
export function importQueue(json: string): void {
  try {
    const imported = JSON.parse(json) as Job[];
    if (Array.isArray(imported)) {
      queue = imported;
    }
  } catch (err) {
    console.error("[Queue] Failed to import queue:", err);
  }
}

